"use strict";

var LogikSim = LogikSim || {};
LogikSim.Backend = LogikSim.Backend || {};

/**
 * Creates a controller for a LogikSim simulation core.
 *
 * The controller handles all communication with the front-end.
 * This includes reacting to front-end commands as well as reporting
 * updates to the front-end.
 *
 * This is done by a JSON message based protocol. As by default the
 * controller expects to be in a web-worker with its core the default
 * method for communicating is with the postMessage function.
 *
 * The controller expects to communicate directly with a Simulation interface
 * object in the front-end. Hence no other part of the backend may use this
 * communication channel without going through the controller.
 *
 * @param core Core the controller handles
 * @param component_library Library used for component template management
 * @param logger Optional LogikSim.Logger to use for logging
 * @constructor
 */
LogikSim.Backend.Controller = function(core, component_library, logger) {
    this.core = core;
    this.lib = component_library;
    this.log = typeof logger !== 'undefined' ? logger : LogikSim.Logger("Ctrl");

    this.components = {};

    /** ID of the request currently being processed. Used to tag replies. */
    this._current_request_id = null;

    /** If true exceptions from a handler are re-thrown so they crash the backend */
    this._rethrow_exceptions = false;

    var that = this;
    this.properties = {};
    Object.defineProperties(this.properties, {
        simulation_rate: {
            get: function() { return that.core.simulation_rate; },
            set: function(v) {
                if (typeof v !== 'number' || v < 0) {
                    throw new TypeError("Simulation rate must have a value >= 0.0");
                }

                that.core.simulation_rate = v;
            },
            enumerable: true
        },
        clock: {
            get: function() { return that.core.clock; },
            enumerable: true
        },
        scheduled_events: {
            get: function() { return that.core.scheduled_events; },
            enumerable: true
        }
    });

    this.component_parent = {
        propagate: function(message) {
            that._post_to_frontend("update", {
                props: message
            });
        }
    };

    /** Map of front-end message type to handler function */
    this._message_handler = {
        start: this._on_start,
        stop: this._on_stop,

        set_simulation_properties: this._on_set_simulation_properties,
        query_simulation_properties: this._on_query_simulation_properties,

        create_component: this._on_create_component,
        query_component: this._on_query_component,
        update_component: this._on_update_component,
        delete_component: this._on_delete_component,

        connect: this._on_connect,
        disconnect: this._on_disconnect,

        schedule_edge: this._on_schedule_edge,

        enumerate_templates: this._on_enumerate_templates
    };
};

LogikSim.Backend.Controller.prototype = {
    /**
     * Function taking a message from the front-end and handling it.
     *
     * For an unknown message or if errors occur during execution a
     * message will be sent to the front-end. By default execution
     * will be continued though.
     *
     * @param msg Message to handle.
     */
    handle: function(msg) {
        var old_request_id = this._current_request_id;
        this._current_request_id = msg.request_id;

        try {
            var handler = this._message_handler[msg.message_type];
            if (typeof handler === 'undefined') {
                // No handler for this message type
                throw new LogikSim.Backend.BackendError("Unknown message type '" + msg.message_type + "'");
            }

            handler.call(this, msg);
        } catch (ex) {
            this._post_to_frontend('error', {
                message: ex.message
            });

            if (this._rethrow_exceptions) {
                throw ex;
            }
        } finally {
            this._current_request_id = old_request_id;
        }
    },
    /**
     * Sends a message with correct structure to the front-end.
     *
     * Note: Will extend additional_fields
     * @param message_type Type of the message
     * @param additional_fields Additional message fields.
     * @private
     */
    _post_to_frontend: function (message_type, additional_fields) {
        var message = typeof additional_fields !== 'undefined' ? additional_fields : {};

        message.message_type = message_type;
        message.clock = this.core.clock; //FIXME: Should use a clock property

        if (this._current_request_id !== null) {
            message.in_reply_to = this._current_request_id;
        }

        this._post_raw(message);
    },
    /**
     * Wrapper around postMessage for easy stubbing.
     * @param message Raw message to send.
     * @private
     */
    _post_raw: function (message) {
        postMessage(message); // jshint ignore:line
    },
    /**
     * Starts the simulation core.
     * @private
     */
    _on_start: function() {
        this.core.start();
        this._post_to_frontend("started");
    },
    /**
     * Quits the simulation.
     * @private
     */
    _on_stop: function() {
        this.core.quit();
        this._post_to_frontend("stopped");
    },
    /**
     * Applies given simulation properties.
     *
     * For properties than cannot be applied errors are propagated. After
     * (partial) application a simulation property propagation will be
     * automatically triggered.
     *
     * @param message Properties to apply
     * @private
     */
    _on_set_simulation_properties: function(message) {
        var props = message.properties;
        try {
            for (var prop in props) {
                if (!props.hasOwnProperty(prop)) {
                    continue;
                }

                try {
                    if (prop in this.properties && !this.properties.hasOwnProperty(prop)) {
                        throw new LogikSim.Backend.BackendError("Setting simulation property '" + prop + "' is not allowed");
                    }

                    this.properties[prop] = props[prop];
                }
                catch (ex) {
                    this._post_to_frontend('error', {
                        message: ex.message
                    });

                    if (this._rethrow_exceptions) {
                        throw ex;
                    }
                }
            }
        } finally {
            this._on_query_simulation_properties();
        }
    },
    /**
     * Propagates current simulation properties.
     *
     * @private
     */
    _on_query_simulation_properties: function() {
        this._post_to_frontend("simulation_properties", {
            properties: JSON.parse(JSON.stringify(this.properties))
        });
    },
    /**
     * Instantiates a component from the library and makes it available.
     *
     * @param message Message with type, id, parent and additional_properties
     * @private
     */
    _on_create_component: function(message) {
        if (message.id in this.components) {
            throw new LogikSim.Backend.BackendError(
                "Failed to instantiate. Already have component instance with id '" + message.id + "'"
            );
        }

        var component = this.lib.instantiate(
            message.type,
            message.id,
            message.parent || this.component_parent,
            message.additional_properties
        );

        if (!component) {
            throw new LogikSim.Backend.BackendError("Failed to instantiate '" + message.type + "'");
        }

        this.components[message.id] = component;
    },
    /**
     * Triggers a property propagation for a specific component.
     *
     * @param message Message with component id
     * @private
     */
    _on_query_component: function(message) {
        var component = this._get_component(message.component);

        component.propagate_self();
    },
    /**
     * Updates a set of given properties on a specific component.
     *
     * @param message Message with component id and a properties dict.
     * @private
     */
    _on_update_component: function(message) {
        var component = this._get_component(message.component);

        component.set_properties(message.properties);
    },
    /**
     * Deletes a specific component from the simulation.
     *
     * @param message Message with component id
     * @private
     */
    _on_delete_component: function(message) {
        var component = this._get_component(message.component);

        component.destruct();

        delete this.components[message.component];
    },
    /**
     * Connects an existing component to another one.
     *
     * @param message Message with source/sink id/port.
     * @private
     */
    _on_connect: function(message) {
        var source = this._get_component(message.source_id);
        var sink = this._get_component(message.sink_id);

        //TODO: Validate
        if (!source.connect(message.source_port, sink, message.sink_port, message.delay)) {
            throw new LogikSim.Backend.BackendError(
                "Failed to connect '" + message.source_id + "' to '" + message.sink_id + "'"
            );
        }
    },
    /**
     * Removes an connection between existing components.
     *
     * @param message Message with source id and port.
     * @private
     */
    _on_disconnect: function(message) {
        var component = this._get_component(message.source_id);

        if (!component.disconnect(message.source_port)) {
            throw new LogikSim.Backend.BackendError(
                "Failed to disconnect port '" + message.source_port + "' on '" + message.source_id + "'"
            );
        }
    },
    /**
     * Schedules an edge on a specific input at a delta time in the future.
     *
     * @param message Message with component id, input_port, state as well as an optional delay.
     * @private
     */
    _on_schedule_edge: function(message) {
        var component = this._get_component(message.component);

        var delay = message.delay || Number.MIN_VALUE; // Schedule at dt in the future if no specific delay is given.
        this.core.schedule(new LogikSim.Backend.Edge(
            this.core.clock + delay,
            component,
            message.input_port,
            message.state
        ));
    },
    /**
     * Triggers a propagation of all templates stored in the attached library.
     *
     * @private
     */
    _on_enumerate_templates: function() {
        this._post_to_frontend("template_enumeration", {
            templates: this.lib.get_templates()
        });
    },
    /**
     * Helper function which retrieves a component by id or throws an exception if it doesn't exist.
     * @param id ID of component to return
     * @return Component
     * @private
     */
    _get_component: function(id) {
        var component = this.components[id];
        if (!component) {
            throw new LogikSim.Backend.BackendError("No component with id '" + id + "'");
        }
        return component;
    }
};
