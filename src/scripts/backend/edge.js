"use strict";

var LogikSim = LogikSim || {};
LogikSim.Backend = LogikSim.Backend || {};

LogikSim.Backend.Edge = function(when, component, input_port, state) {
    LogikSim.Backend.Event.call(this, when, component.id());

    this.component = component;
    this.input_port = input_port;
    this.state = state;
};

LogikSim.Backend.Edge.prototype = Object.create(LogikSim.Backend.Event);
LogikSim.Backend.Edge.prototype.constructor = LogikSim.Backend.Edge;

LogikSim.Backend.Edge.prototype.process = function(last_in_group) {
    if (this.input_port !== undefined) {
        this.component.edge(this.input_port, this.state);
    }

    if (!last_in_group) {
        return [];
    }

    // Last input for this element in this clock cycle.
    return this.component.clock(this.when);
};