
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

    xit("should be able to do basic asynchronous simulation", function(done) {
        var simulation = new LogikSim.Backend.Simulation('base/src/scripts/');

        var and_id = simulation.create_component("AND").component_id;
        var or_id = simulation.create_component("OR").component_id;

        simulation.set_handler('update', function(msg) {
            if (msg.props.id === or_id) {
                if ('output_states' in message.props) {
                    if (message.props.output_states[0] === true) {
                        // Our operations should give us a rising edge.
                        done();
                    }
                }
            }
        });

        simulation.connect(and_id, 0, or_id, 0, 0);

        simulation.schedule_edge(and_id, 0, true, 1);
        simulation.schedule_edge(and_id, 1, true, 1);
    }, 100);
});
