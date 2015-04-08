"use strict";

var LogikSim = LogikSim || {};
LogikSim.Backend = LogikSim.Backend || {};

LogikSim.Backend.Component = function(parent, properties) {
    this.props = properties;

    this.parent = parent;
    this.props.parent = parent === null ? null : parent.id();

    // Add our own state
    Object.defineProperty(this.props, "id", {
        value: this.props.id, // must be >0, see OutEdge
        writable: false,
        enumerable: true
    });

    if (!this.props.delay) {
        this.props.delay = 1;
    }

    this.props.input_count = typeof this.props.input_count !== "undefined"
        ? this.props.input_count
        : 0;

    this.props.input_states = new Array(this.props.input_count);
    this.props.input_connections = new Array(this.props.input_count);

    this.props.output_count = typeof this.props.output_count !== "undefined"
        ? this.props.output_count
        : 0;

    this.props.output_states = new Array(this.props.output_count);
    this.props.output_connections = new Array(this.props.output_count);

    this.last_logic_outputs = new Array(this.props.output_count);

    this.inputs_changed = false;
    this.outputs_changed = false;
};


LogikSim.Backend.Component.prototype = {
    /**
     * Returns the type of the component template.
     * @return {String} Template type
     */
    type: function() {
        return this.props.type;
    },
    /**
     * Returns this components id
     * @return {number} Component id
     */
    id: function() {
        return this.props.id;
    },
    /**
     * Processes an incoming edge on one of the input ports.
     *
     * @param input_port Number of port edge is coming in on
     * @param state New state for port.
     */
    edge: function(input_port, state) {
        this.props.input_states[input_port] = state;
        this.inputs_changed = true;
    },
    clock: function(when) {
        var events = [];

        if (this.inputs_changed) {
            var future_outputs = this.props.logic(this.props.input_states);

            for (var output_port = 0; output_port < this.props.output_count; ++output_port) {
                if (future_outputs[output_port] !== this.last_logic_outputs[output_port]) {
                    events.push(new LogikSim.Backend.OutEdge(
                        when + this.props.delay,
                        this,
                        output_port,
                        future_outputs[output_port]
                    ));

                    this.last_logic_outputs[output_port] = future_outputs[output_port];
                }
            }
        }

        if (this.inputs_changed || this.outputs_changed) {
            //TODO: Propagate state change
        }

        this.inputs_changed = false;
        this.outputs_changed = false;

        return events;
    },
    _out_edge: function(output_port, state) {
        this.props.output_states[output_port] = state;
        this.outputs_changed = true;

        return this.props.output_connections[output_port];
    },
    connect: function(output_port, component, input_port, delay) {
        if (this.props.output_connections[output_port] !== undefined) {
            // Can't connect twice
            return false;
        }

        if (!component.connected(this, output_port, input_port, this.props.output_states[output_port])) {
            // Other element rejected connection
            return false;
        }

        this.props.output_connections[output_port] = {
            component: component,
            input_port: input_port,
            delay: delay
        };

        return true;
    },
    connected: function(component, output_port, input_port, state) {
        if (this.props.input_connections[input_port] !== undefined) {
            // Already have something connected on that port
            return false;
        }

        this.props.input_connections[input_port] = {
            component: component,
            output_port: output_port
        };

        //FIXME: Instead of this hack the connect on 'component' should schedule an edge with proper delay on us.
        this.edge(input_port, state);

        return true;
    },
    disconnect: function(output_port) {
        var connection = this.props.output_connections[output_port];
        if (!connection) {
            // Nothing to do
            return false;
        }

        if (!connection.component.disconnected(connection.input_port)) {
            return false;
        }

        this.props.output_connections[output_port] = null;

        return true;
    },
    disconnected: function(input_port) {
        if (!this.props.input_connections[input_port]) {
            return false;
        }

        this.props.input_connections[input_port] = null;

        return true;
    },
    destruct: function() {
        // Drop inbound connections
        for (var input_port = 0; input_port < this.props.input_count; ++input_port) {
            var input = this.props.input_connections[input_port];
            if (!input) {
                continue;
            }

            input.component.disconnect(input.output_port);
        }

        // Drop outbound connections
        for (var output_port = 0; output_port < this.props.output_count; ++output_port) {
            var output = this.props.output_connections[output_port];
            if (!output) {
                continue;
            }

            this.disconnect(output_port);
        }

        //FIXME: Propagate our destruction?
    },

    /**
     * Converts this objects properties into a JSON string.
     *
     * This does not include template properties that weren't
     * overridden for this instance. Together with the template
     * this should be sufficient to re-create the component
     * with identical state. Note that the id and connections
     * will be lost though.
     *
     * @return JSON string describing this instance.
     */
    to_json: function() {
        return JSON.stringify(this.props, function(key, value) {
            if (value instanceof LogikSim.Backend.Component) {
                return value.id();
            }

            return value;
        });
    }
};
