"use strict";

var LogikSim = LogikSim || {};
LogikSim.Backend = LogikSim.Backend || {};


LogikSim.Backend.OutEdge = function(when, component, output_port, state) {
    // We schedule ourselves with a negative id so we are guaranteed to process
    // before every normal edge event. This allows OutEdges processing to create
    // Edges that are processed on the same simulation clock cycle.
    LogikSim.Backend.Event.call(this, when, -component.id());

    this.component = component;
    this.output_port = output_port;
    this.state = state;
};

LogikSim.Backend.OutEdge.prototype = Object.create(LogikSim.Backend.Event.prototype);
LogikSim.Backend.OutEdge.prototype.constructor = LogikSim.Backend.OutEdge;

LogikSim.Backend.OutEdge.prototype.process = function(last_in_group) {
    var connection = this.component._out_edge(this.output_port, this.state);

    var events = [];

    if (connection) {
        events.push(new LogikSim.Backend.Edge(
            this.when + connection.delay,
            connection.component,
            connection.input_port,
            this.state
        ));
    }

    if (!last_in_group) {
        return events;
    }

    // To be able to reduce state propagation to the front-end we want to only
    // have to do them once for input and output changes on the same clock cycle.
    // To achieve this we schedule a virtual edge on the element which handled
    // outputs for this cycle so its clock function will be called.
    events.push(new LogikSim.Backend.Edge(this.when, this.component));

    return events;
};
