"use strict";

var LogikSim = LogikSim || {};
LogikSim.Backend = LogikSim.Backend || {};

LogikSim.Backend.Component = function(parent, properties) {
    this.props = properties;

    this.parent = parent;
    this.props.parent = parent && parent.id ? parent.id() : null;

    // Add our own state
    Object.defineProperty(this.props, "id", {
        value: this.props.id, // must be >0, see OutEdge
        writable: false,
        enumerable: true
    });

    if (!this.props.delay) {
        this.props.delay = 1;
    }

    this.props.inputs = typeof this.props.inputs !== "undefined"
        ? this.props.inputs
        : 0;

    this.props.input_states = new Array(this.props.inputs);
    this.props.input_connections = new Array(this.props.inputs);

    this.props.outputs = typeof this.props.outputs !== "undefined"
        ? this.props.outputs
        : 0;

    this.props.output_states = new Array(this.props.outputs);
    this.props.output_connections = new Array(this.props.outputs);

    this.last_logic_outputs = new Array(this.props.outputs);

    this.inputs_changed = false;
    this.outputs_changed = false;

    this.propagate_self();
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
    /**
     * Called to process one or more previous input or output state changes
     * on the component.
     *
     * @param when Clock cycle the changes belonged to.
     * @return {Array} Array of events resulting from the.
     */
    clock: function(when) {
        var events = [];

        if (this.inputs_changed) {
            var future_outputs = this.props.logic(this.props.input_states);

            for (var output_port = 0; output_port < this.props.outputs; ++output_port) {
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
            this.propagate({
                id: this.id(),
                input_states: this.props.input_states,
                output_states: this.props.output_states
            })
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
    /**
     * Sets a property and propagates its change.
     *
     * Property application is best effort. This function throws a list of
     * exceptions for all properties that could not be applied.
     *
     * @param properties Dictionary with property key:value pairs
     */
    set_properties: function(properties) {
        var update = {};
        var errors = [];
        var propagate = false;

        for (var prop in properties) {
            if (!properties.hasOwnProperty(prop)) {
                continue;
            }

            try {
                var value = properties[prop];
                this.props[prop] = value;
                update[prop] = value;
            } catch (ex) {
                errors.push(ex);
            }

            propagate = true;
        }

        if (propagate) {
            update.id = this.id();
            this.propagate(update);
        }

        if (errors.length > 0) {
            throw errors;
        }
    },
    propagate: function(message) {
        return this.parent.propagate(message);
    },
    propagate_self: function() {
        return this.propagate(this._convert_for_propagation(this.props));
    },
    _connect: function(output_port, component, input_port, delay) {
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
    connect: function(output_port, component, input_port, delay) {
        if(!this._connect(output_port, component, input_port, delay)) {
            return false;
        }

        this.propagate({
            id: this.id(),
            output_connections: this._convert_for_propagation(this.props.output_connections)
        });

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

        this.propagate({
            id: this.id(),
            input_connections: this._convert_for_propagation(this.props.input_connections)
        });

        return true;
    },
    _disconnect: function(output_port) {
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
    disconnect: function(output_port) {
        if (!this._disconnect(output_port)) {
            return false;
        }

        this.propagate({
            id: this.id(),
            output_connections: this._convert_for_propagation(this.props.output_connections)
        });

        return true;
    },
    disconnected: function(input_port) {
        if (!this.props.input_connections[input_port]) {
            return false;
        }

        this.props.input_connections[input_port] = null;

        this.propagate({
            id: this.id(),
            input_connections: this._convert_for_propagation(this.props.input_connections)
        });

        return true;
    },
    destruct: function() {
        // Drop inbound connections
        for (var input_port = 0; input_port < this.props.inputs; ++input_port) {
            var input = this.props.input_connections[input_port];
            if (!input) {
                continue;
            }

            input.component.disconnect(input.output_port);
        }

        // Drop outbound connections
        for (var output_port = 0; output_port < this.props.outputs; ++output_port) {
            var output = this.props.output_connections[output_port];
            if (!output) {
                continue;
            }

            this._disconnect(output_port);
        }

        this.propagate({
            id: this.id(),
            type: null
        });
    },

    /**
     * Converts this objects properties for propagation.
     * @param thing What to convert
     * @return Simplified deep-copy of thing
     */
    _convert_for_propagation: function(thing) {
        return JSON.parse(JSON.stringify(thing, function(key, value) {
            if (value instanceof LogikSim.Backend.Component) {
                return value.id();
            }

            return value;
        }));
    }
};
