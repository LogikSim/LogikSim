"use strict";

describe("A circuit component", function() {
    var and;
    var parent;

    beforeEach(function() {
        parent = mk_parent_dummy();
        and = new LogikSim.Backend.Component(parent, {
            id: 3,
            type: "AND",
            logic: function(ins) {
                return [ins.every(function(s) { return s; }), false];
            },
            input_count: 3,
            output_count: 2
        });
    });

    it("should make its given ID read-only", function() {
        expect(and.props.id).toBe(3);
        expect(function() { and.props.id = 4}).toThrow();
    });

    it("should be expose type as well as id", function() {
        expect(and.id()).toBe(3);
        expect(and.type()).toBe("AND");
    });

    it("should propagate its complete properties on instantiation", function() {
        expect(parent.propagate).toHaveBeenCalledWith({
            id: 3,
            type: "AND",
            input_count: 3,
            output_count: 2,
            parent: null,
            delay: 1,
            input_states: [null, null, null],
            input_connections: [null, null, null],
            output_states: [null, null],
            output_connections: [null, null]
        });
    });

    it("should propagate changes to properties performed on it", function() {
        parent.propagate.calls.reset();
        and.set_properties({ delay: 10 });

        expect(parent.propagate).toHaveBeenCalledWith({
            id: 3,
            delay: 10
        });
    });

    it("should properly connect to other components and disconnect from them", function() {
        var dummyComponent = {
               connected: function() { return true; },
               disconnected: function() { return true; }
        };

        spyOn(dummyComponent, "connected").and.callThrough();
        spyOn(dummyComponent, "disconnected").and.callThrough();

        expect(and.connect(0, dummyComponent, 1)).toBe(true);
        expect(dummyComponent.connected).toHaveBeenCalledWith(and, 0, 1, undefined);
        expect(and.connect(0, dummyComponent, 1)).toBe(false); // Double connect
        expect(dummyComponent.connected.calls.count()).toBe(1);

        expect(and.disconnect(0)).toBe(true);
        expect(dummyComponent.disconnected).toHaveBeenCalledWith(1);
        expect(and.disconnect(0)).toBe(false); // Double disconnect
        expect(dummyComponent.disconnected.calls.count()).toBe(1);
    });

    it("should not connect to or disconnect from components rejecting that", function() {
        var dummyComponent = {
            connected: function() { return false; },
            disconnected: function() { return false; }
        };

        expect(and.connect(0, dummyComponent, 1)).toBe(false);

        spyOn(dummyComponent, "connected").and.returnValue(true);
        expect(and.connect(0, dummyComponent, 1)).toBe(true);

        expect(and.disconnect(0, dummyComponent, 1)).toBe(false);
    });

    it("should allow other components to connect to it and disconnect from it", function() {
        var dummyComponent = {};

        expect(and.connected(dummyComponent, 1, 0, 0)).toBe(true);
        expect(and.connected({}, 1, 0, 0)).toBe(false); // Double connect

        expect(and.disconnected(1)).toBe(false);
        expect(and.disconnected(0)).toBe(true);
        expect(and.disconnected(0)).toBe(false); // Double disconnect
    });

    it("should disconnect inputs and outputs when destructed", function() {
        var dummyComponent = {
            connected: function() { return true; },
            disconnect: function() { return true; },
            disconnected: function() { return true; }
        };

        expect(and.connected(dummyComponent, 0, 0, 1)).toBe(true);
        expect(and.connected(dummyComponent, 1, 1, 1)).toBe(true);
        expect(and.connect(0, dummyComponent, 1, 0)).toBe(true);

        spyOn(dummyComponent, "disconnect").and.callThrough();
        spyOn(dummyComponent, "disconnected").and.callThrough();

        and.destruct();

        expect(dummyComponent.disconnect.calls.count()).toBe(2);
        expect(dummyComponent.disconnected.calls.count()).toBe(1);
    });

    it("should remember edges and create corresponding follow-up events", function() {
        var dummyComponent = {
            id: function() { return 10; },
            connected: function() { return true; },
            edge: function() {},
            clock: function() { return []; }
        };

        spyOn(dummyComponent, "edge");
        spyOn(dummyComponent, "clock").and.callThrough();

        and.connect(0, dummyComponent, 0, 0);

        var core = mk_test_core();

        core.schedule_many([
            mk_edge(0, and, 0, true),
            mk_edge(0, and, 1, true)
        ]);

        expect(core.test_loop_until_stable_or_time(0)).toBe(0);

        expect(dummyComponent.edge).not.toHaveBeenCalled();
        expect(dummyComponent.clock).not.toHaveBeenCalled();

        expect(core.test_loop_until_stable_or_time()).toBe(1);

        expect(dummyComponent.edge.calls.count()).toBe(1);
        expect(dummyComponent.edge).toHaveBeenCalledWith(0, true);
        expect(dummyComponent.clock.calls.count()).toBe(1);
        expect(dummyComponent.clock).toHaveBeenCalledWith(1);

        dummyComponent.edge.calls.reset();
        dummyComponent.clock.calls.reset();

        core.schedule_many([
            mk_edge(10, and, 1, false)
        ]);

        expect(core.test_loop_until_stable_or_time()).toBe(11);

        expect(dummyComponent.edge.calls.count()).toBe(1);
        expect(dummyComponent.edge).toHaveBeenCalledWith(0, false);
        expect(dummyComponent.clock.calls.count()).toBe(1);
        expect(dummyComponent.clock).toHaveBeenCalledWith(11);
    });

});
