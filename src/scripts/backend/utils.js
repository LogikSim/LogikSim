"use strict";

var LogikSim = LogikSim || {};
LogikSim.Backend = LogikSim.Backend || {};

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
            var center = ((max - min) >> 2) + min;
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

