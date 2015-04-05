"use strict";

var LogikSim = LogikSim || {};

// Define default log levels
LogikSim.DEBUG = 0;
LogikSim.INFO = 10;
LogikSim.WARN = 20;
LogikSim.ERROR = 30;

// Define names for default log levels
LogikSim.LOGLEVELNAMES = {};
LogikSim.LOGLEVELNAMES[LogikSim.DEBUG] = 'DEBUG';
LogikSim.LOGLEVELNAMES[LogikSim.INFO] = 'INFO';
LogikSim.LOGLEVELNAMES[LogikSim.WARN] = 'WARN';
LogikSim.LOGLEVELNAMES[LogikSim.ERROR] = 'ERROR';

/**
 * Trivial wrapper around console.log with basic support for named loggers and loglevels.
 *
 * @param name Name of the logger
 * @param minimum_level Minimum log level
 * @param target Function accepting the log string (default console.log)
 * @constructor
 */
LogikSim.Logger = function(name, minimum_level, target) {
    this.name = name;
    this.minimum_level = typeof minimum_level !== 'undefined' ? minimum_level : LogikSim.INFO;

    if (typeof target !== 'undefined') {
        this.target = target;
    } else if (typeof console !== 'undefined') {
        this.target = function (message) {
            //FIXME: For some strange reason even with a shim bind on console.log doesn't work with PhantomJS 1.X
            //       Probably easiest to wait until PhantomJS 2 is supported by karma and just switch.
            console.log(message);
        }
    } else if (typeof self !== 'undefined') {
        if (typeof self.console !== 'undefined') {
            this.target = self.console.log.bind(self.console); // Web-worker scope (https://developer.mozilla.org/en-US/docs/Web/API/DedicatedWorkerGlobalScope)
        } else {
            this.target = function (msg) {}; // No good default behavior possible :(
        }
    }

};

LogikSim.Logger.prototype = {
    log: function(level, message) {
        if (level < this.minimum_level) {
            return;
        }

        var lvl_name = typeof LogikSim.LOGLEVELNAMES[level] !== 'undefined' ? LogikSim.LOGLEVELNAMES[level] : level;

        this.target(lvl_name + ' ' + this.name + ": " + message);
    },

    debug: function(message) {
        this.log(LogikSim.DEBUG, message);
    },
    info: function(message) {
        this.log(LogikSim.INFO, message);
    },
    warn: function(message) {
        this.log(LogikSim.WARN, message);
    },
    error: function(message) {
        this.log(LogikSim.ERROR, message);
    },
    exception: function(exception) {
        this.log(LogikSim.ERROR, exception.message);
        //this.log(LogikSim.ERROR, exception.stack); //FIXME: Read up on this
    }
};
