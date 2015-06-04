"use strict";

var LogikSim = LogikSim || {};
LogikSim.Backend = LogikSim.Backend || {};

/**
 * Creates a new event scheduled at a given time.
 *
 * @param when Simulation time to schedule this event to.
 * @param group Integer value used to group events. Events occurring at the
 *  same time with the same group are guaranteed to be executed consecutively
 *  with the last one receiving the last_in_group flag during processing.
 * @constructor
 */
LogikSim.Backend.Event = function(when, group) {
    this.when = when;
    this.group = group;
    this._order = null; // Set when event is scheduled.
};

LogikSim.Backend.Event.prototype = {
    process: function(last_in_group) {
        return [];
    }
};

/**
 * Custom comparator function which defines the execution order of
 * the Events.
 * @param a Event instance
 * @param b Event instance
 * @return <0 if a is scheduled before b. >0 if b is scheduled before a. 0 if events scheduling is equal.
 */
LogikSim.Backend.event_cmp = function(a, b) {
    var delta_when = a.when - b.when;
    if (delta_when !== 0) {
        return delta_when;
    }

    var delta_group = a.group - b.group;
    if (delta_group !== 0) {
        return delta_group;
    }

    return a._order - b._order;
};


