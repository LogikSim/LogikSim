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
 * @param logger Optional LogikSim.Logger to use for logging.
 * @constructor
 */
LogikSim.Backend.Controller = function(core, logger) {
    this.core = core;
    this.log = typeof logger !== 'undefined' ? logger : LogikSim.Logger("Ctrl");

    /** ID of the request currently being processed. Used to tag replies. */
    this._current_request_id = null;

    /** If true exceptions from a handler are re-thrown so they crash the backend */
    this._rethrow_exceptions = false;

    /** Map of front-end message type to handler function */
    this._message_handler = {
        start: this._on_start,
        stop: this._on_stop
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
            var handler = this._message_handler[msg.type];
            if (typeof handler === 'undefined') {
                // No handler for this message type
                throw new LogikSim.Backend.BackendError("Unknown message type '" + msg.type + "'");
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

        message.type = message_type;
        message.clock = this.core._clock; //FIXME: Should use a clock property

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
    }
};
