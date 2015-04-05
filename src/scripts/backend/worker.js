"use strict";

//FIXME: Unfortunately Karma phantomjs-shim doesn't reach into web-workers.
// Hence this is another (minimal and wrong) shim for Function.bind().
// Placing it here is a horrible horrible hack but hopefully we can switch
// to PhantomJS 2 soon and ditch this with the other hacks for PhantomJS 1.9.X
if (!Function.prototype.bind) {
    Function.prototype.bind = Function.prototype.bind || function (thisp) {
        var fn = this;
        return function () {
            return fn.apply(thisp, arguments);
        };
    };
}

// Import all backend dependencies
importScripts('utils.js', 'log.js', 'event.js', 'controller.js', 'core.js');

var core = new LogikSim.Backend.Core();
var controller = new LogikSim.Backend.Controller(core);

self.addEventListener('message', function(event) {
    controller.handle.call(controller, event.data);
});
