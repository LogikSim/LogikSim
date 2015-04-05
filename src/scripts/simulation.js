"use strict";

var LogikSim = LogikSim || {};
LogikSim.Backend = LogikSim.Backend || {};

LogikSim.Backend.Simulation = function(base_url, logger) {
    base_url = typeof base_url !== 'undefined' ? base_url : '';
    this.log = typeof logger !== 'undefined' ? logger : new LogikSim.Logger("Backend");

    this.worker = new Worker(base_url + 'backend/worker.js');

    this._handlers = {
        error: this._on_error
    };
    this._clock = 0;
    this._sent_requests = 0;

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

    /**
     * Set a handler function for a specific reply type.
     *
     * @param type Message type to register handler for
     * @param handler Handler function to call with message.
     */
    set_handler: function(type, handler) {
        this._handlers[type] = handler;
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

        if (handler.call(this, handler) === false) {
            this.log.error("Handling of message of type " + msg.type + " failed: " + msg);
        }
    },
    /**
     * @return {number} Guaranteed session unique request id.
     */
    _gen_request_id: function () {
        return this._sent_requests++;
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
