
describe("A event class", function() {
    var ev_cmp = LogikSim.Backend.event_cmp;

    it("shouldn't have an order by default", function() {
        var ev = new LogikSim.Backend.Event(0,0);
        expect(ev._order).toBeNull();
    });

    it("shouldn't have future events when processed", function() {
        var ev = new LogikSim.Backend.Event(0,0);
        expect(ev.process(false)).toEqual([]);
    });

    it("should compare correctly using event_compare", function() {
        var ev0 = mk_event(0,0,0);
        expect(ev_cmp(ev0, ev0)).toBe(0);

        var ev1 = mk_event(1,-1,-1);
        expect(ev_cmp(ev0, ev1)).toBeLessThan(0);
        expect(ev_cmp(ev1, ev0)).toBeGreaterThan(0);

        var ev2 = mk_event(1,2,-2);
        expect(ev_cmp(ev1, ev2)).toBeLessThan(0);
        expect(ev_cmp(ev2, ev1)).toBeGreaterThan(0);

        var ev3 = mk_event(1,2,3);
        expect(ev_cmp(ev2, ev3)).toBeLessThan(0);
        expect(ev_cmp(ev3, ev2)).toBeGreaterThan(0);

        expect(ev_cmp(ev0, ev2)).toBeLessThan(0);
        expect(ev_cmp(ev0, ev3)).toBeLessThan(0);

        expect(ev_cmp(ev3, ev1)).toBeGreaterThan(0);
        expect(ev_cmp(ev3, ev0)).toBeGreaterThan(0);
    });

});
