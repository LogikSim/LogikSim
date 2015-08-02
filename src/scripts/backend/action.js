"use strict";

var LogikSim = LogikSim || {};
LogikSim.Backend = LogikSim.Backend || {};

LogikSim.Backend.Action = function(when, callback) {
    LogikSim.Backend.Event.call(this, when, Number.POSITIVE_INFINITY);
    this.callback = callback;
};

LogikSim.Backend.Action.prototype = Object.create(LogikSim.Backend.Event.prototype);
LogikSim.Backend.Action.prototype.constructor = LogikSim.Backend.Action;

LogikSim.Backend.Action.prototype.process = function(last_in_group) {
    if (!last_in_group) {
        return this.callback(this.when);
    }

    // Last input for this element in this clock cycle.
    return []
};
