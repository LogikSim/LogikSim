"use strict";

var LogikSim = LogikSim || {};
LogikSim.Backend = LogikSim.Backend || {};

/**
 * Creates the core for LogikSim's discrete event simulation.
 *
 * After the start() function is called the core starts
 * processing the events in its schedule. Processing an
 * event may cause additional new events to be scheduled
 * for the future. LogikSim.Backend.Event based events can
 * be scheduled manually using the schedule and
 * schedule_many functions.
 *
 * The real-time duration of a simulation tick depends on
 * the configured simulation rate as well well as processing
 * capacity in case of an overload scenario. Scheduling
 * precision is affected by platform restrictions as well
 * as configuration of the core.
 *
 * Call quit() to end the simulation.
 *
 *
 * @param logger Optional LogikSim.Logger to use for logging.
 * @constructor
 */
LogikSim.Backend.Core = function(logger) {
    this.log = typeof logger !== 'undefined' ? logger : new LogikSim.Logger("Backend");

    this.event_queue = LogikSim.Backend.make_priority_queue(LogikSim.Backend.event_cmp);
    /** Simulation clock */
    this.clock = 0;
    /** Total number of events scheduled for execution by this core since start. */
    this.scheduled_events = 0;
    /**
     * Maximum interval between updating simulation clock as well
     * as returning control flow to the JS event loop
     */
    this.housekeeping_interval = 0.05;
    /**
     * Used to keep track of event groups for last-in-group notification.
     * See LogikSim.Backend.Event for more.
     */
    this.group = null;
    /** Factor between wall-clock time and simulation clock */
    this.simulation_rate = 1.0;
    /** False as long as core is processing events. */
    this._quit = true;
    /** setTimeout id to the next event processing call. */
    this._process_events_continuation = null;
    /** Last time a process_events call ended */
    this._last_processing_time = LogikSim.Backend.time();
    /** Timestamp of last call to start() */
    this._start_time = null;
};

LogikSim.Backend.Core.prototype = {
    /**
     * Schedule a future event for processing.
     * If needed adjusts event processing scheduling.
     *
     * @param event Future event to schedule
     */
    schedule: function(event) {
        var before = this.event_queue[0];
        this._schedule(event);

        if (before !== this.event_queue[0]) {
            this._process_events_immediate();
        }
    },
    /**
     * Schedule multiple future events for processing.
     * If needed adjusts event processing scheduling.
     *
     * @param events Future events to schedule
     */
    schedule_many: function(events) {
        var before = this.event_queue[0];
        this._schedule_many(events);

        if (before !== this.event_queue[0]) {
            this._process_events_immediate();
        }
    },
    /**
     * Start simulation core.
     */
    start: function () {
        if (this._start_time !== null) {
            throw new LogikSim.Backend.BackendError("Simulation was already started once");
        }

        this.log.info("Starting event processing");
        this._quit = false;
        this._last_processing_time = LogikSim.Backend.time();
        this._start_time = this._last_processing_time;

        this._process_events_immediate();
    },
    /**
     * Starts processing events.
     *
     * This function will re-schedule itself in pre-set real-time intervals
     * to ensure the JS event loop stays responsive.
     */
    _process_events: function () {
        if (this._quit) {
            // Stop processing when asked to quit.
            clearTimeout(this._process_events_continuation);
            return;
        }

        // Set target clock independent of wall-clock. This prevents the simulation
        // from trying to catch up which imho is behavior you want for an interactive
        // simulation.
        var time_passed = LogikSim.Backend.time() - this._last_processing_time;
        var target_clock = this.clock + this.simulation_rate * time_passed;

        // Try mass-processing as much as possible. However ensure that we return
        // control flow to the JS event loop in regular intervals.
        var can_block_till = LogikSim.Backend.time() + this.housekeeping_interval;
        while (can_block_till - LogikSim.Backend.time() > 0) {
            if (!this._process_next_event(target_clock)) {
                break;
            }
        }

        // If we still have events pending we will schedule ourselves
        // depending on their real-time occurrence so we don't hog
        // the cpu. Otherwise we will just do housekeeping from time
        // to time.
        var target_delay = this.housekeeping_interval;

        if (this.event_queue.length > 0) {
            var next_event_delay = (this.event_queue[0].when - this.clock) / this.simulation_rate;
            target_delay = Math.min(this.housekeeping_interval, next_event_delay);
        }

        this._process_events_continuation = setTimeout(this._process_events.bind(this), target_delay);

        this._last_processing_time = LogikSim.Backend.time();
    },
    /**
     * Causes the core to terminate execution as soon as possible.
     */
    quit: function() {
        if (this._quit) {
            throw new LogikSim.Backend.BackendError("Simulation was already stopped");
        }

        this.log.info("Stopping event processing");
        this._quit = true;
        clearTimeout(this._process_events_continuation);
    },
    /**
     * Broken out inner core of event processing loop.
     * @param upto_clock Only process events scheduled up to this time.
     * @return Processed event or null if nothing was pending or clock limit reached
     * @private
     */
    _process_next_event: function(upto_clock) {
        if (this.event_queue.length === 0 || this.event_queue[0].when > upto_clock) {
            // If queue is empty circuit is steady state so simulation is
            // infinitely fast. Also we need this clock behavior to make delta
            // timing work. It totally makes sense though ;)
            this.clock = upto_clock;

            return null;
        }

        var event = this.event_queue.shift();

        this.clock = event.when;
        this.group = event.group;

        var last_in_group = (this.event_queue.length === 0
            || this.event_queue[0].group !== this.group
            || this.event_queue[0].when !== this.clock);

        var followup_events = event.process(last_in_group);

        this._schedule_many(followup_events);

        return event;
    },
    /**
     * Schedule an event for processing.
     *
     * @param event Event in the future to schedule
     * @private
     */
    _schedule: function(event) {
        event._order = this.scheduled_events;
        this.event_queue.put(event);
        this.scheduled_events += 1;
    },
    /**
     * Schedule multiple events for processing.
     *
     * @param events Events in the future to schedule
     * @private
     */
    _schedule_many: function(events) {
        events.forEach(this.schedule, this);
    },
    /**
     * Re-schedule event processing for immediate execution.
     * @private
     */
    _process_events_immediate: function () {
        clearTimeout(this._process_events_continuation);
        this._process_events_continuation = setTimeout(this._process_events.bind(this), 0);
    }
};
