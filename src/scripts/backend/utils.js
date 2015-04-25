"use strict";

var LogikSim = LogikSim || {};
LogikSim.Backend = LogikSim.Backend || {};

LogikSim._ = _.noConflict();
/**
 * Returns a high precision, monotonic timestamp.
 * @function LogikSim.Backend.time
 * @returns {number}
 */
if (typeof performance !== 'undefined') {
    LogikSim.Backend.time = function () {
        return performance.now();
    };
} else if (typeof self !== 'undefined') {
    if (typeof self.performance !== 'undefined') {
        LogikSim.Backend.time = function () {
            return self.performance.now();
        };
    } else {
        LogikSim.Backend.time = function () {
            return Date.now(); // :(
        };
    }
}

/**
 * Creates and returns a priority queue
 * @param cmp_fu Comparator function for two items in the PQ
 * @return {Array}
 */
LogikSim.Backend.make_priority_queue = function(cmp_fu) {
    var pq = [];

    /**
     * Put a new Event into the priority queue using a very slow but easy method.
     * TODO: Replace this
     * @param item Item to insert
     */
    pq.put = function(item) {
        var min = 0;
        var max = this.length;

        while (min !== max) {
            var center = ((max - min) >> 1) + min;
            var cmp = cmp_fu(item, this[center]);
            if (cmp < 0) {
                max = center;
            } else if (cmp > 0) {
                min = center + 1;
            } else {
                min = max = center;
            }
        }

        this.splice(min, 0, item);
    };

    return pq;
};


(function() {
    // Jasmine is a bit naive with its type detection when trying to
    // figure out whether a thrown error matches an expected type.
    // It uses MyType.constructor.name which for the usual definition syntax
    // we use is empty as we assign from a lambda. To work around this we
    // actually define a named function. Also we seemingly can't re-use the
    // error constructor to get a stack trace so we misuse Error to attempt
    // to get one anyways.

    /**
     * Custom backend error type.
     * @param message Error message
     * @constructor
     */
    function BackendError(message) {
        this.name = this.constructor.name;
        this.message = message || 'An unidentified error occurred in the LogikSim backend';
        this.stack = (new Error()).stack;
    }

    BackendError.prototype = Object.create(Error.prototype);
    BackendError.prototype.constructor = BackendError;

    LogikSim.Backend.BackendError = BackendError;
}());
