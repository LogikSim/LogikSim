"use strict";

var LogikSim = LogikSim || {};
LogikSim.Backend = LogikSim.Backend || {};

/**
 * Creates a circuit component.
 *
 * A component is the basic building block of the logic simulation.
 * The component has a type specific logic function it uses to
 * calculate outputs for corresponding inputs applied to it.
 *
 * State changes on the component are realized via a clocked two
 * stage interface. Every cycle input changes for one or more input
 * changes for the component have to be processed the edge function
 * has to be called for each of them. For every clock cycle in which
 * edge calls were performed a corresponding clock call enables the
 * component to react to these changes in terms of follow-up events
 * which are scheduled in the core.

 * @param parent Parent element to propagate property changes to.
 * @param properties Properties to initialize the component with.
 * @constructor
 */
LogikSim.Backend.Component = function(parent, properties) {
    this.props = properties;

    this.parent = parent;

    //TODO: Do we want to do parameter validation here? Should we even bother?
    var inputs = this.props.inputs | 0;

    this.inputs_max = typeof this.props.inputs_max !== 'undefined' ?
    this.props.inputs_max | 0 :
        inputs;

    this.inputs_min = typeof this.props.inputs_min !== 'undefined' ?
    this.props.inputs_min | 0:
        inputs;

    this.inputs = 0;
    this.props.input_connections = [];
    this.props.input_states = [];

    var outputs = this.props.outputs | 0;

    this.outputs_max = typeof this.props.outputs_max !== 'undefined' ?
        this.props.outputs_max :
        outputs;

    this.outputs_min = typeof this.props.outputs_min !== 'undefined' ?
        this.props.outputs_min :
        outputs;

    this.outputs = 0;
    this.props.output_connections = [];
    this.props.output_states = [];
    this.last_logic_outputs = [];

    // Add our own state
    if (!this.props.delay) {
        this.props.delay = 1;
    }

    var that = this;
    Object.defineProperties(this.props, {
        id: {
            value: this.props.id, // must be >0, see OutEdge
            writable: false,
            enumerable: true
        },

        parent: {
            get: function() {
                return  that.parent && that.parent.id ? that.parent.id() : null;
            },
            enumerable: true
        },

        inputs: {
            get: function() { return that.inputs; },
            set: this._adjust_input_count,
            enumerable: true
        },
        inputs_max: {
            get: function() { return that.inputs_max; },
            set: function(c) {
                if (typeof c !== 'Number' || c !== (c | 0) || c < 0) {
                    throw "Input maximum can only be a positive integer";
                } else if (c < that.inputs_min) {
                    throw "Cannot set input maximum below minimum";
                }

                that.inputs_max = c;
            },
            enumerable: true
        },
        inputs_min: {
            get: function() { return that.inputs_min; },
            set: function(c) {
                if (typeof c !== 'Number' || c !== (c | 0) || c < 0) {
                    throw "Input minimum can only be a positive integer";
                } else if (c > that.inputs_max) {
                    throw "Cannot set input minimum above maximum";
                }
                that.inputs_min = c;
            },
            enumerable: true
        },

        outputs: {
            get: function() { return that.outputs; },
            set:  this._adjust_output_count,
            enumerable: true
        },
        outputs_max: {
            get: function() { return that.outputs_max; },
            set: function(c) {
                if (typeof c !== 'Number' || c !== (c | 0) || c < 0) {
                    throw "Output maximum can only be a positive integer";
                } else if (c < that.outputs_min) {
                    throw "Cannot set output maximum below minimum";
                }

                that.outputs_max = c;
            },
            enumerable: true
        },
        outputs_min: {
            get: function() { return that.outputs_min; },
            set: function(c) {
                if (typeof c !== 'Number' || c !== (c | 0) || c < 0) {
                    throw "Output maximum can only be a positive integer";
                } else if (c > that.outputs_max) {
                    throw "Cannot set output minimum above maximum";
                }
                that.outputs_min = c;
            },
            enumerable: true
        }
    });

    this._adjust_input_count(inputs, true);
    this._adjust_output_count(outputs, true);

    // Some properties have setters and handle their own propagation
    this.self_propagating_prop = {
        inputs: true,
        outputs: true
    };

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
        if (input_port > this.inputs - 1 || input_port < 0) {
            return;
        }
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
            var future_outputs = this.props.logic(this.props.input_states, this.props.outputs);

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
            });
        }

        this.inputs_changed = false;
        this.outputs_changed = false;

        return events;
    },
    /**
     * Called by OutEdge processing functions to make outputs take effect.
     *
     * @param output_port Port to output on
     * @param state New state of the output
     * @return {*} Connection the edge occurred on
     * @private
     */
    _out_edge: function(output_port, state) {
        if (output_port > this.outputs - 1 || output_port < 0) {
            return;
        }

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
                if (!this.self_propagating_prop[prop]) {
                    update[prop] = value;
                }
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
    /**
     * Propagates messages up child/parent relationships to the front-end.
     * @param message Message to propagate
     * @return {*}
     */
    propagate: function(message) {
        return this.parent.propagate(message);
    },
    /**
     * Propagate whole property set of this component to the front-end.
     *
     * @return {*}
     */
    propagate_self: function() {
        return this.propagate(this._convert_for_propagation(this.props));
    },
    /**
     * Connects an output of this component to an input of another one.
     *
     * @param output_port Output on this component
     * @param component Component to connect to
     * @param input_port Input on component
     * @param delay Scheduling delay to apply to this connection
     * @return {boolean}
     */
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
    /**
     * Called by a connecting components connect function to notify its target.
     *
     * @param component Connecting component
     * @param output_port Output port used for connection
     * @param input_port Input port on this component that is being connected to
     * @param state Current state of the output port
     * @return {boolean} True if connection can be established. False if not (e.g. input already in use).
     */
    connected: function(component, output_port, input_port, state) {
        if (this.props.input_connections[input_port]) {
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
    /**
     * Disconnects an output port of this component from another component.
     *
     * @param output_port Output port to disconnect.
     * @return {boolean} True if disconnected. False if otherwise (e.g. port wasn't connected).
     */
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
    /**
     * Called by a disconnecting components disconnect function to notify the involved component.
     *
     * @param input_port Input port being disconnected from.
     * @return {boolean} True if disconnect is acknowledged. False if not (e.g. no connection present).
     */
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
    /**
     * Removes the component from the simulation.
     *
     * This is achieved by disconnecting all incoming and outgoing
     * connections and then propagating the component as no longer
     * having a type.
     */
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
     * Connects an output of this component to an input of another one.
     *
     * This internal variant will not propagate the connect. The caller
     * has to ensure that the connect is properly propagated later on.
     *
     * @param output_port Output on this component
     * @param component Component to connect to
     * @param input_port Input on component
     * @param delay Scheduling delay to apply to this connection
     * @return {boolean}
     * @private
     */
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
    /**
     *
     * Disconnects an output port of this component from another component.
     *
     * This internal variant will not propagate the disconnect. The caller
     * has to ensure that the disconnect is properly propagated later on.
     *
     * @param output_port Output port to disconnect.
     * @return {boolean} True if disconnected. False if otherwise (e.g. port wasn't connected).
     * @private
     */
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
    },
    _adjust_input_count: function(new_count, no_propagate) {
        // Clamp value
        new_count = Math.max(Math.min(new_count | 0, this.props.inputs_max), this.props.inputs_min);

        // Adjust ports
        var delta = new_count - this.inputs;

        if (delta < 0) {
            while (this.inputs != new_count) {
                var connection = this.props.input_connections.pop();
                if (connection) {
                    connection.component.disconnect(connection.input_port);
                }

                this.props.input_states.pop();

                --this.inputs;
            }
        } else if (delta > 0) {
            while (this.inputs != new_count) {
                this.props.input_connections.push(undefined);
                this.props.input_states.push(undefined);

                ++this.inputs;
            }
        } else {
            // Nothing to do
            return;
        }

        this.inputs_changed = true;

        if (!no_propagate) {
            this.propagate({
                id: this.id(),
                input_connections: this._convert_for_propagation(this.props.input_connections),
                input_states: this.props.input_states
            });
        }
    },
    _adjust_output_count: function(new_count, no_propagate) {
        // Clamp value
        new_count = Math.max(Math.min(new_count | 0, this.props.outputs_max), this.props.outputs_min);

        // Adjust ports
        var delta = new_count - this.outputs;

        if (delta < 0) {
            while (this.outputs != new_count) {
                this._disconnect(this.outputs - 1);

                this.props.output_connections.pop();
                this.props.output_states.pop();
                this.last_logic_outputs.pop();

                --this.outputs;
            }
        } else if (delta > 0) {
            while (this.outputs != new_count) {
                this.props.output_connections.push(undefined);
                this.props.output_states.push(undefined);
                this.last_logic_outputs.push(undefined);

                ++this.outputs;
            }
        } else {
            // Nothing to do
            return;
        }

        if (!no_propagate) {
            this.propagate({
                id: this.id(),
                output_connections: this._convert_for_propagation(this.props.output_connections),
                output_states: this.props.output_states
            });
        }
    }
};
