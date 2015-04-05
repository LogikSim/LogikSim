
describe("A simulation with workers", function() {
    it("should correctly start up and terminate", function(done) {
        var simulation = new LogikSim.Backend.Simulation('base/src/scripts/');

        var was_started = false;
        simulation.set_handler('started', function(msg) {
            was_started = true;
            simulation.stop();
        });

        simulation.set_handler('error', function(msg) {
            done.fail("Backend reported error" + msg.message);
            simulation.terminate();
        });

        simulation.set_handler('stopped', function(msg) {
            expect(was_started).toBeTruthy();
            simulation.terminate();
            done();
        });

        simulation.start();
    }, 100);

    it("should respond with an error if a receiving a bogus request", function (done) {
        var simulation = new LogikSim.Backend.Simulation('base/src/scripts/');

        simulation.set_handler('error', function(msg) {
            simulation.terminate();
            done();
        });

        simulation.start();
        simulation._post_to_backend("no-such-thing");
    });
});
