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
importScripts(
    '../../vendor/underscore.js',
    'utils.js',
    'log.js',
    'event.js',
    'controller.js',
    'component.js',
    'component_library.js',
    'core.js'
);

var core = new LogikSim.Backend.Core();
var lib = new LogikSim.Backend.ComponentLibrary();
var controller = new LogikSim.Backend.Controller(core, lib);

self.addEventListener('message', function(event) {
    controller.handle.call(controller, event.data);
});

// Load component library
(function () {
    var request = new XMLHttpRequest();
    request.onload = function() {
        var templates = JSON.parse(this.responseText);
        lib.add_templates(templates); //TODO: Prop to controller -> frontend
    };
    //TODO: Error handling
    //TODO: Figure out if this style of loading makes sense and where the backend should get its paths from
    request.open("get", "components/component_templates.json");
    request.send();
})();
