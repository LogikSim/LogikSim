
describe("A backend core", function() {
    it("should be able to do housekeeping and be terminated", function(done) {
        var core = new LogikSim.Backend.Core();
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
});

