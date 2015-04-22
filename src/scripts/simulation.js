"use strict";

var LogikSim = LogikSim || {};
LogikSim.Backend = LogikSim.Backend || {};

LogikSim.Backend.Simulation = function(base_url, logger, worker) {
    base_url = typeof base_url !== 'undefined' ? base_url : '';
    this.log = typeof logger !== 'undefined' ? logger : new LogikSim.Logger("Backend");

    this.worker = typeof worker !== 'undefined' ? worker : new Worker(base_url + 'backend/worker.js');

    this._handlers = {
        error: this._on_error
    };
    this._clock = 0;
    this._sent_requests = 0;
    this._created_elements = 0;

    this.worker.onmessage = this._handle.bind(this);
};

LogikSim.Backend.Simulation.prototype = {
    /**
     * Starts event processing in the simulation.
     * @return Request id
     */
    start: function () {
        return this._post_to_backend("start");
    },
    /**
     * Quit event processing in the simulation.
     * A simulation stopped this way cannot be restarted.
     * @return Request id
     */
    stop: function() {
        return this._post_to_backend("stop");
    },
    /**
     * Sets the given properties for the simulation.
     *
     * @param properties dict with properties to set
     * @return Request id
     */
    set_simulation_properties: function (properties) {
        return this._post_to_backend('set_simulation_properties', {
            properties: properties
        });
    },
    /**
     * Queries the current simulation properties from the backend.
     * @return Request id
     */
    query_simulation_properties: function () {
        return this._post_to_backend("query_simulation_properties");
    },
    create_component: function(guid, additional_properties) {
        var id = this._gen_element_uid();
        return {
            component_id: id,
            request_id: this._post_to_backend("create_component", {
                guid: guid,
                id: id,
                additional_properties: additional_properties
            })
        };
    },
    query_component: function(component_id) {
        return this._post_to_backend("query_component", {
            component: component_id
        });
    },
    update_component: function(component_id, properties) {
        return this._post_to_backend("update_component", {
            component: component_id,
            properties: properties
        });
    },
    delete_component: function(element_id) {
        return this._post_to_backend("delete_component", {
            component: element_id
        });
    },

    connect: function(source_id, source_port, sink_id, sink_port, delay) {
        return this._post_to_backend("connect", {
            source_id: source_id,
            source_port: source_port,
            sink_id: sink_id,
            sink_port: sink_port,
            delay: delay
        });
    },
    disconnect: function(source_id, source_port) {
        return this._post_to_backend("disconnect", {
            source_id: source_id,
            source_port: source_port
        });
    },

    schedule_edge: function(component_id, input_port, state, delay) {
        return this._post_to_backend("schedule_edge", {
            component: component_id,
            input_port: input_port,
            state: state,
            delay: delay
        });
    },

    enumerate_templates: function() {
        return this._post_to_backend("enumerate_templates");
    },

    /**
     * Set a handler function for a specific reply type.
     *
     * @param type Message type to register handler for
     * @param handler Handler function to call with message.
     */
    set_handler: function(type, handler, ctx) {
        if (typeof ctx === 'undefined') {
            this._handlers[type] = handler; // Will have this class as 'this' on call
        } else {
            this._handlers[type] = handler.bind(ctx);
        }
    },
    /**
     * Remove previously set handler for message type.
     * @param type Message type to remove handler from
     */
    clear_handler: function(type) {
        delete this._handlers[type];
    },


    /**
     * Terminates the backend unconditionally and immediately.
     */
    terminate: function () {
        this.worker.terminate();
    },
    /**
     * Dispatcher function for calling configured handlers.
     *
     * @param event onmessage event from backend.
     * @private
     */
    _handle: function (event) {
        var msg = event.data;

        this._clock = msg.clock;

        var handler = this._handlers[msg.type];
        if (!handler) {
            return; // It's fine if we don't have a handler
        }

        if (handler.call(this, msg) === false) {
            this.log.error("Handling of message of type " + msg.type + " failed: " + msg);
        }
    },
    /**
     * @return {number} Guaranteed session unique request id.
     * @private
     */
    _gen_request_id: function () {
        return this._sent_requests++;
    },
    /**
     * @return {number} Guaranteed simulation unique element id.
     * For single user an incrementing counter in the interface is just fine. No
     * need to make them really unique and unwieldy at this point.
     * @private
     */
    _gen_element_uid: function() {
        return this._created_elements++;
    },
    /**
     * Sends a message to the backend.
     * Note: Will extend additional_fields variable.
     * @param type Message type
     * @param additional_fields Additional message fields
     * @return {number} Request id
     * @private
     */
    _post_to_backend: function (type, additional_fields) {
        var message = typeof additional_fields !== 'undefined' ? additional_fields : {};

        message.type = type;
        message.request_id = this._gen_request_id();

        this.worker.postMessage(message);

        return message.request_id;
    },
    /**
     * Default error handler which simply logs errors from the backend.
     * @param msg Error message
     * @private
     */
    _on_error: function(msg) {
        this.log.error("Error in backend: " + msg.message);
    }
};
