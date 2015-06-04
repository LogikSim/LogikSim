
describe("A backend core", function() {
    it("should be able to do housekeeping and be terminated", function(done) {
        var core = new LogikSim.Backend.Core(mk_test_logger("core"));
        core.start();
        setTimeout(function () {
            var clock = core.clock;
            expect(clock).toBeGreaterThan(80);
            core.quit();
            setTimeout(function () {
                expect(core.clock).toBe(clock);
                expect(core.clock).toBeLessThan(120);
                done();
            }, 100);
        }, 100);
    }, 300);

    it("should process a series of events over time", function(done) {
        var core = new LogikSim.Backend.Core(mk_test_logger("core"));
        core.start();

        var e = mk_event(10);
        var e2 = mk_event(300);

        var fe = mk_event(150, 0);
        var fe2 = mk_event(300, 0);

        spyOn(e, "process").and.returnValue([fe, fe2]);
        spyOn(e2, "process").and.callThrough();
        spyOn(fe, "process").and.callThrough();
        spyOn(fe2, "process").and.callThrough();

        core.schedule_many([e, e2]);

        setTimeout(function () {
            expect(e.process).toHaveBeenCalledWith(true);

            setTimeout(function () {
                expect(fe.process).toHaveBeenCalledWith(true);
                expect(fe2.process.calls.any()).toBe(false);
                expect(e2.process.calls.any()).toBe(false);

                core.quit();
                done();
            }, 100);
        }, 100);
    }, 300);

    it("should throw an exception if started or stopped twice", function() {
        var core = new LogikSim.Backend.Core(mk_test_logger("core"));

        expect(core.quit.bind(core)).toThrowError(LogikSim.Backend.BackendError);
        core.start();
        expect(core.start.bind(core)).toThrowError(LogikSim.Backend.BackendError);
        core.quit();
        expect(core.start.bind(core)).toThrowError(LogikSim.Backend.BackendError);
        expect(core.quit.bind(core)).toThrowError(LogikSim.Backend.BackendError);
    });

    /*
        As testing the core asynchronously is pretty unwieldy and slow.
        The following tests instead use internal knowledge of the class
        to perform synchronous event processing in a test harness which
        allows greater control and insight on the core behavior.
     */

    it("should have _process_next_event advance time infinitely fast in steady state ", function() {
        var core = mk_test_core(mk_test_logger("core"));

        expect(core.clock).toBe(0);
        expect(core._process_next_event(100)).toBeNull();
        expect(core.clock).toBe(100);
    });

    it("should process scheduled events", function() {
        var core = mk_test_core();

        var e1 = mk_event(2);
        var e2 = mk_event(10);
        var e3 = mk_event(11);

        var es = [e2,e3,e1];
        es.forEach(function (e) { spyOn(e, "process").and.callThrough(); });

        core._schedule_many(es);

        expect(core.test_loop_until_stable_or_time(10)).toBe(10);

        expect(e1.process).toHaveBeenCalledWith(true);
        expect(e2.process).toHaveBeenCalledWith(true);
        expect(e3.process.calls.any()).toBe(false);
    });

    it("should process follow-up events", function() {
        var core = mk_test_core(mk_test_logger("core"));

        var e = mk_event(2);
        var fe = mk_event(10, 0);
        var fe2 = mk_event(10, 0);

        spyOn(e, "process").and.returnValue([fe, fe2]);
        spyOn(fe, "process").and.callThrough();
        spyOn(fe2, "process").and.callThrough();

        core._schedule(e);

        expect(core.test_loop_until_stable_or_time()).toBe(10);

        expect(e.process).toHaveBeenCalledWith(true);
        expect(fe.process).toHaveBeenCalledWith(false);
        expect(fe2.process).toHaveBeenCalledWith(true);
    });
});
