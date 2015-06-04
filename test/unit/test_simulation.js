"use strict";

function do_test_simulation_with(description, simulation_factory) {
    describe(description, function() {
        var simulation;

        /**
         * Non-web-worker builds crash by default on any error in testing
         * so we can easily get a useful trace. Calling this function will
         * disable this functionality so this kind of test also uses the
         * normal built-in error reporting of the backend.
         *
         * This function has no effect on web-worker backed testing.
         */
        function dontDieOnError() {
            if (simulation.worker.controller) {
                simulation.worker.controller._rethrow_exceptions = false;
            }
        }

        beforeEach(function() {
            simulation = simulation_factory();
        });

        afterEach(function() {
            simulation.terminate();
        });

        it("should correctly start up and terminate", function(done) {
            var was_started = false;
            simulation.set_handler('started', function(msg) {
                was_started = true;
                simulation.stop();
            });

            simulation.set_handler('error', function(msg) {
                done.fail("Backend reported error" + msg.message);
            });

            simulation.set_handler('stopped', function(msg) {
                expect(was_started).toBeTruthy();
                done();
            });

            simulation.start();
        }, 100);

        it("should respond with an error if a receiving a bogus request", function (done) {
            dontDieOnError();

            simulation.set_handler('error', function(msg) {
                done();
            });

            simulation.start();
            simulation._post_to_backend("no-such-thing");
        });

        it("should be able to do basic simulation", function(done) {
            var and_id = simulation.create_component("AND").component_id;
            var or_id = simulation.create_component("OR").component_id;

            simulation.set_handler('update', function(msg) {
                if (msg.props.id === or_id) {
                    if ('output_states' in msg.props) {
                        if (msg.props.output_states[0] === true) {
                            // Our operations should give us a rising edge.
                            done();
                        }
                    }
                }
            });

            simulation.start();

            simulation.connect(and_id, 0, or_id, 0, 0);

            simulation.schedule_edge(and_id, 0, true, 1);
            simulation.schedule_edge(and_id, 1, true, 1);
        }, 100);

        it("should be able to instantiate and destruct components", function(done) {
            var and_id = simulation.create_component("AND").component_id;

            simulation.set_handler('update', function(msg) {
                if (msg.props.id === and_id && msg.props.type === null) {
                    done();
                }
            });

            simulation.start();

            simulation.delete_component(and_id);
        }, 100);

        it("should be able to query and set simulation properties", function(done) {
            var did_set_it = false;
            simulation.set_handler('simulation_properties', function(msg) {
                if (msg.properties.simulation_rate === 42) {
                    done();
                } else if (!did_set_it) {
                    did_set_it = true;
                    simulation.set_simulation_properties({
                        simulation_rate: 42
                    });
                }
            });

            simulation.start();

            simulation.query_simulation_properties();
        }, 100);

        it("should be able to query and set custom simulation properties", function(done) {
            var did_set_it = false;
            simulation.set_handler('simulation_properties', function(msg) {
                if (msg.properties.fancy_pants && msg.properties.fancy_pants.bling == 'bling' ) {
                    done();
                } else if (!did_set_it) {
                    did_set_it = true;
                    simulation.set_simulation_properties({
                        fancy_pants: {bling: 'bling'}
                    });
                }
            });

            simulation.start();

            simulation.query_simulation_properties();
        }, 100);

        it("should be able to update and query component properties", function(done) {
            simulation.start();

            var called = 0;
            simulation.set_handler('update', function(msg) {
                expect(msg.props.id).toBeDefined();

                if (called < 2) {
                    // One call for the intial propagation
                    // another one for the query.
                    ++called;
                    expect(msg.props.bernd).toBe("bread");
                    if (called === 2) {
                        simulation.update_component(msg.props.id, {
                            bernd: "brot"
                        });
                    }
                } else {
                    expect(msg.props.bernd).toBe("brot");
                    expect(msg.delay).toBeUndefined(); // Should be a selective update
                    done();
                }
            });

            var and_id = simulation.create_component("AND", {
                bernd: "bread"
            }).component_id;

            simulation.query_component(and_id);

        }, 100);

        it("should be able to enumerate the templates in the backend library", function(done) {
            simulation.set_handler("template_enumeration", function(msg) {
                done();
            });

            simulation.enumerate_templates();
        }, 100);

        it("should be able to connect and disconnect components", function(done) {
            var c1_id = simulation.create_component("OR").component_id;
            var c2_id = simulation.create_component("OR").component_id;

            // Expect to see a connection established, then removed
            var step = 0;
            simulation.set_handler("update", function(msg) {
                if (msg.props.delay !== undefined) {
                    // Not the updates we are looking for
                    return;
                }

                switch (step) {
                    case 0:
                        expect(msg.props.id).toBe(c2_id);
                        expect(msg.props.input_connections).toEqual([{
                            component: c1_id,
                            output_port: 0
                        }, null]);
                        ++step;
                        break;
                    case 1:
                        expect(msg.props.id).toBe(c1_id);
                        expect(msg.props.output_connections).toEqual([{
                            component: c2_id,
                            input_port: 0,
                            delay: 0
                        }]);
                        ++step;
                        break;
                    case 2:
                        expect(msg.props.id).toBe(c2_id);
                        expect(msg.props.input_connections).toEqual([null, null]);
                        ++step;
                        break;
                    case 3:
                        expect(msg.props.id).toBe(c1_id);
                        expect(msg.props.output_connections).toEqual([null]);
                        done();
                        break;
                }
            });
            simulation.connect(c1_id, 0, c2_id, 0);
            simulation.disconnect(c1_id, 0);
        }, 100);

        it("should correctly simulate a compound half-adder", function(done) {
            var x = simulation.create_component("Interconnect").component_id;
            var y = simulation.create_component("Interconnect").component_id;
            var s = simulation.create_component("Interconnect").component_id;
            var c = simulation.create_component("Interconnect").component_id;

            var xor = simulation.create_component("XOR").component_id;
            var and = simulation.create_component("AND").component_id;

            simulation.connect(x, 0, xor, 0);
            simulation.connect(x, 1, and, 0);
            simulation.connect(y, 0, xor, 1);
            simulation.connect(y, 1, and, 1);

            simulation.connect(xor, 0, s, 0);
            simulation.connect(and, 0, c, 0);

            var truth_table = [
                {x:0, y:0, c:0, s:0, after: 1},
                {x:0, y:1, c:0, s:1, after: 10},
                {x:1, y:0, c:0, s:1, after: 20},
                {x:1, y:1, c:1, s:0, after: 30}
            ];

            for (var i = 0; i < truth_table.length; ++i) {
                var entry = truth_table[i];

                simulation.schedule_edge(x, 0, entry.x, entry.after);
                simulation.schedule_edge(y, 0, entry.y, entry.after);
            }

            var current_step = 0;
            var last_seen = {};

            simulation.set_handler('stopped', function(msg) {
                expect(current_step).toEqual(truth_table.length);
                done();
            });

            simulation.set_handler("error", function(msg) {
                console.log("Encountered error");
                console.log(msg);
                expect(true).toBeFalsy();
                done();
            });

            simulation.set_handler("update", function(msg) {
                if (msg.clock > truth_table[truth_table.length - 1].after + 10) {
                    console.log("Simulation time is above expected");
                    console.log(msg);
                    expect(true).toBeFalsy();
                    done();
                }

                if (current_step >= truth_table.length) {
                    console.log("Unexpected trailing item updates");
                    console.log(msg);
                    expect(true).toBeFalsy();
                    return;
                }

                var state = undefined;
                switch (msg.props.id) {
                    case x:
                        state = msg.props.input_states;
                        if (state === undefined) return;

                        last_seen.x = state[0];
                        break;
                    case y:
                        state = msg.props.input_states;
                        if (state === undefined) return;

                        last_seen.y = state[0];
                        break;
                    case s:
                        state = msg.props.output_states;
                        if (state === undefined) return;

                        last_seen.s = state[0];
                        break;
                    case c:
                        state = msg.props.output_states;
                        if (state === undefined) return;

                        last_seen.c = state[0];
                        break;
                    default:
                        return;
                }

                var truth = truth_table[current_step];
                if (msg.clock > truth.after
                    && last_seen.x == truth.x
                    && last_seen.y == truth.y
                    && last_seen.s == truth.s
                    && last_seen.c == truth.c) {

                    ++current_step;

                    if (current_step >= truth_table.length) {
                        simulation.stop();
                    }
                }
            });

            simulation.start();
        }, 100);

    }); // end of describe
}

// Most of the tests of backend with or without web-worker should be identical so
// we handle them like this to not have to copy and paste around all the time.

do_test_simulation_with("A simulation with web-work backend", function() {
    return new LogikSim.Backend.Simulation('base/src/scripts/');
});

do_test_simulation_with("A test simulation _without_ web-worker backend", function() {
    return mk_synchronous_test_simulation('base/src/scripts/');
});
