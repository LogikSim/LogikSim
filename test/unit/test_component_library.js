"use strict";

describe("A component library", function() {
    xit("should be able to rely on write-only and freezing", function() {
        var o = {};

        Object.defineProperty(o, "a", {
            value: 5,
            writable: false
        });

        // Unfortunately PhantomJS 1.9.X fails this test due to an bug in older v8 versions
        // https://esdiscuss.org/topic/the-way-too-handle-readonly-properties-in-the-prototype
        // Obviously we can workaround it like this
        /*
        Object.defineProperty(o, "a", {
            'get': function() { return 5 },
            'set': function (v) { throw new TypeError("Cannot write this property"); }
        });
        */
        // for every attribute. Really don't want to do that though. I guess we'll just have to disable
        // tests like this one until we can use Phantom JS 2. Another issue with the code we are using
        // this for is that it won't work in IE7/8 as they neither support defineProperty nor freeze
        // http://kangax.github.io/compat-table/es5/#Object.freeze

        // Object.freeze(o);  // Sets write-only on all properties and does some more neat stuff

        expect(function() { o.a = 20; }).toThrowError(TypeError);
        expect(o.a).toBe(5);

        var p = Object.create(o);
        expect(p.a).toBe(5);
        expect(function() { p.a = 30; }).toThrowError(TypeError);
        expect(p.a).toBe(5);
    });

    it("should be able to instantiate registered types", function() {
        var lib = new LogikSim.Backend.ComponentLibrary(mk_test_logger("lib"));
        expect(lib.add_templates({"my-template": {logic: function() {}}})).toBe(1);
        var component = lib.instantiate("my-template", 5);

        expect(component.type()).toBe("my-template");
        expect(component.id()).toBe(5);
    });

    it("should not allow the same type to be registered twice", function() {
        var lib = new LogikSim.Backend.ComponentLibrary(mk_test_logger("lib", LogikSim.ERROR));
        expect(lib.add_templates({"my-template": {logic: function() {}}})).toBe(1);
        expect(lib.add_templates({"my-template": {logic: function() {}}})).toBe(0);
    });

    xit("should make the type field of the template write protected", function() { // See above
        var lib = new LogikSim.Backend.ComponentLibrary(mk_test_logger("lib"));
        expect(lib.add_templates({'my-template': {logic: function() {}}})).toBe(1);
        var component = lib.instantiate("my-template");
        expect(function() { component.props.type = "blub"}).toThrow();
        expect(component.type()).toBe("my-template")
    })
});
