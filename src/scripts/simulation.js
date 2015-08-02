"use strict";

var LogikSim = LogikSim || {};
LogikSim.Backend = LogikSim.Backend || {};

/**
 * Creates new a Simulation instance with corresponding web-worker.
 *
 * The simulation instance acts as a proxy between the backend Controller
 * which is running in the web-worker and the front-end user. It exposes
 * all available functionality as normal function calls and allows registration
 * of handlers for reacting to backend events.
 *
 * @param base_url Base url on which the backend folder is located
 * @param logger Logger to use
 * @param worker If passed no web-worker is created and instead the
 *        given object is used as a drop-in. This feature is used
 *        in testing of the Simulation class.
 * @constructor
 */
LogikSim.Backend.Simulation = function(base_url, logger, worker) {
    base_url = typeof base_url !== 'undefined' ? base_url : '';
    this.log = typeof logger !== 'undefined' ? logger : new LogikSim.Logger("Backend");

    this.worker = typeof worker !== 'undefined' ? worker : new Worker(base_url + 'backend/worker.js');

    this._handlers = {
        error: this._on_error
    };
    this._clock = 0;
    this._sent_requests = 0;
    this._created_elements = 1; // Has to start at 1 so we can meaningfully negate it for out edges

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
     * Stop event processing in the simulation.
     * A simulation stopped this way can be restarted with another start() call
     * @return {number} Request id
     */
    stop: function() {
        return this._post_to_backend("stop")
    },
    /**
     * Stop event processing in the simulation at a specific simulation time.
     * @param when When to schedule the stop
     * @return {number} Request id
     */
    stopAt: function(when) {
        return this._post_to_backend("stop", { when: when });
    },
    /**
     * Stop event processing in the simulation after a simulation time delay
     * @param delay Simulation ticks to delay the stop
     * @return {number} Request id
     */
    stopAfter: function(delay) {
        return this._post_to_backend("stop", { delay: delay });
    },
    /**
     * Sets the given properties for the simulation.
     *
     * @param properties dict with properties to set
     * @return {number} Request id
     */
    set_simulation_properties: function (properties) {
        return this._post_to_backend('set_simulation_properties', {
            properties: properties
        });
    },
    /**
     * Queries the current simulation properties from the backend.
     * @return {number} Request id
     */
    query_simulation_properties: function () {
        return this._post_to_backend("query_simulation_properties");
    },
    /**
     * Creates a new component and returns its future id.
     *
     * @param type Component type to instantiate
     * @param additional_properties Additional properties to use in construction
     * @return {{component_id: (number), request_id: (number)}}
     */
    create_component: function(type, additional_properties) {
        var id = this._gen_element_uid();
        return {
            component_id: id,
            request_id: this._post_to_backend("create_component", {
                type: type,
                id: id,
                additional_properties: additional_properties
            })
        };
    },
    /**
     * Requests a property propagation of a given component.
     *
     * @param component_id Component that should propagate.
     * @return {number} Request id
     */
    query_component: function(component_id) {
        return this._post_to_backend("query_component", {
            component: component_id
        });
    },
    /**
     * Updates given properties on a component.
     *
     * @param component_id Component to update.
     * @param properties
     * @return {number} Request id
     */
    update_component: function(component_id, properties) {
        return this._post_to_backend("update_component", {
            component: component_id,
            properties: properties
        });
    },
    /**
     * Deletes a component from the simulation.
     *
     * @param component_id Component to delete
     * @return {number} Request id
     */
    delete_component: function(component_id) {
        return this._post_to_backend("delete_component", {
            component: component_id
        });
    },


    /**
     * Connects the output of a component to the input of another one.
     *
     * Not that neither output nor input may be already used by another
     * connection.
     *
     * @param source_id Source component
     * @param source_port Output port
     * @param sink_id Target component
     * @param sink_port Input port
     * @param delay Signal delay from output to input
     * @return {number} Request id
     */
    connect: function(source_id, source_port, sink_id, sink_port, delay) {
        if (delay === undefined) {
            delay = 0;
        }

        return this._post_to_backend("connect", {
            source_id: source_id,
            source_port: source_port,
            sink_id: sink_id,
            sink_port: sink_port,
            delay: delay
        });
    },
    /**
     * Disconnects an existing connection between two components.
     *
     * @param source_id Connection source component
     * @param source_port Port the connection that should be dropped is on
     * @return {*|number}
     */
    disconnect: function(source_id, source_port) {
        return this._post_to_backend("disconnect", {
            source_id: source_id,
            source_port: source_port
        });
    },

    /**
     * Schedules a rising or falling edge on a input in the future.
     *
     * @param component_id Component to target
     * @param input_port Input port on component the edge occurs on
     * @param state New input state after the edge (true=high, false=low)
     * @param delay Delta time into the future to schedule
     * @return {number} Request id
     */
    schedule_edge: function(component_id, input_port, state, delay) {
        return this._post_to_backend("schedule_edge", {
            component: component_id,
            input_port: input_port,
            state: !!state,
            delay: delay
        });
    },

    /**
     * Requests all available component templates from the backend.
     *
     * @return {number} Request id
     */
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

        var handler = this._handlers[msg.message_type];
        if (!handler) {
            return; // It's fine if we don't have a handler
        }

        if (handler.call(this, msg) === false) {
            this.log.error("Handling of message of type " + msg.message_type + " failed: " + msg);
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
     * @param message_type Message type
     * @param additional_fields Additional message fields
     * @return {number} Request id
     * @private
     */
    _post_to_backend: function (message_type, additional_fields) {
        var message = typeof additional_fields !== 'undefined' ? additional_fields : {};

        message.message_type = message_type;
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
