/**
 * Creates a test core for blocking execution to a stable state.
 */
function mk_test_core() {
    var core = new LogikSim.Backend.Core();

    core.test_timeline = [];
    core.test_loop_until_stable_or_time = function (time) {
        time = typeof time !== 'undefined' ? time : Infinity;

        while (this.event_queue.length !== 0) {
            var event = this._process_next_event(time);
            if (event !== null) {
                this.test_timeline.push(event);
            } else {
                break;
            }
        }

        return this.clock;
    };

    return core;
}

/**
 * Creates a LogikSim.Backend.Event
 * @param when Scheduling time for event
 * @param group Group the event belongs to (optional)
 * @param _order Internal order parameter to set (optional)
 * @return {LogikSim.Backend.Event}
 */
function mk_event(when, group, _order) {
    group = typeof group !== 'undefined' ? group : 0;

    var ev = new LogikSim.Backend.Event(when, group);
    if (typeof _order !== 'undefined') {
        // Note: Scheduling the event will cause this to be overridden.
        ev._order = _order;
    }

    return ev;
}

/**
 * Creates a LogikSim.Backend.Edge
 * @param when When to schedule the edge
 * @param component On which component to schedule the edge
 * @param input_port Input on component the edge is occuring on
 * @param state State of the input after the edge
 * @returns {LogikSim.Backend.Edge}
 */
function mk_edge(when, component, input_port, state) {
    return new LogikSim.Backend.Edge(when, component, input_port, state);
}

/**
 * Generates a dummy parent usable for Component instantiation.
 * @return {{propagate: Object}}
 */
function mk_parent_dummy() {
    return jasmine.createSpyObj("parent", ["propagate"]);
}

/**
 * Creates a logger for use in testing.
 *
 * For now a test logger is a normal logger that only
 * logs messages of level warning and above.
 *
 * @param name Name for the logger (optional)
 * @param minimum_loglevel Minimum log level for this logger (optional)
 * @return {LogikSim.Logger}
 */
function mk_test_logger(name, minimum_loglevel) {
    name = typeof name !== 'undefined' ? name : "test";
    minimum_loglevel = typeof minimum_loglevel !== 'undefined' ? minimum_loglevel : LogikSim.WARN;
    return new LogikSim.Logger(name, minimum_loglevel);
}

/**
 * @returns A "synchronous" emulation for the web-worker based Simulation with normally uses worker.js
 */
function mk_synchronous_test_simulation(base_path, rethrow_exceptions) {
    rethrow_exceptions = typeof rethrow_exceptions !== 'undefined' ? rethrow_exceptions : true;

    var core = new LogikSim.Backend.Core(mk_test_logger("core"));
    var lib = new LogikSim.Backend.ComponentLibrary(mk_test_logger("lib"));
    var controller = new LogikSim.Backend.Controller(core, lib, mk_test_logger("ctrl"));
    controller._rethrow_exceptions = rethrow_exceptions;

    // Load component library (synchronous)
    (function () {
        var request = new XMLHttpRequest();
        request.onload = function() {
            var templates = JSON.parse(this.responseText);
            lib.add_templates(templates); //TODO: Prop to controller -> frontend
        };
        //TODO: Error handling
        //TODO: Figure out if this style of loading makes sense and where the backend should get its paths from
        request.open("get", base_path + "backend/components/component_templates.json", false); // << !!Synchronously!!
        request.send();
    })();

    var virtual_worker = {
        core: core,
        lib: lib,
        controller: controller,
        /**
         * This post message emulation directly forwards the given message to the core controller.
         * @param message Message to post to backend
         */
        postMessage: function(message) {
            controller.handle.call(controller, message);
        },
        /**
         * Tells the backend to terminate. We can't actually hard-kill it like we can with web-workers though.
         */
        terminate: function() {
            if (!core._stopped) { // Prevent accidental double quits due to semantic mismatch to web-worker.
                core.stop();
            }
        },
        /**
         * Override this to handle messages
         */
        onmessage: function() {}
    };

    // Replace the web-worker focused message handling in the controller
    controller._post_raw = function (message) {
        var event = {
            data: message
        };

        virtual_worker.onmessage(event);
    };

    return new LogikSim.Backend.Simulation(undefined, mk_test_logger("simu"), virtual_worker);
}
