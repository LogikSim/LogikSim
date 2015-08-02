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

            var inputs = {
                x: x, y: y
            };

            var outputs = {
                s: s, c: c
            };

            var truth_table = [
                // Standard truth table
                {x: false, y: false, c: false, s: false},
                {x: false, y: true , c: false, s: true },
                {x: true , y: false, c: false, s: true },
                {x: true , y: true , c: true , s: false},
                {x: true , y: false, c: false, s: true },
                {x: false, y: true , c: false, s: true },

                // Additional shuffled entries from the table
                { x: true , y: true , c: true , s: false },
                { x: true , y: false, c: false, s: true  },
                { x: true , y: false, c: false, s: true  },
                { x: false, y: true , c: false, s: true  },
                { x: false, y: false, c: false, s: false },
                { x: true , y: false, c: false, s: true  },
                { x: false, y: true , c: false, s: true  },
                { x: true , y: false, c: false, s: true  },
                { x: true , y: false, c: false, s: true  },
                { x: false, y: false, c: false, s: false },
                { x: false, y: true , c: false, s: true  },
                { x: false, y: true , c: false, s: true  },
                { x: false, y: false, c: false, s: false },
                { x: true , y: false, c: false, s: true  },
                { x: true , y: true , c: true , s: false },
                { x: false, y: true , c: false, s: true  },
                { x: false, y: true , c: false, s: true  },
                { x: true , y: true , c: true , s: false },

                // Last entry _must_ cause change messages for proper termination of this test
                {x: false, y: false, c: false, s: false}
            ];

            run_async_truth_table_simulation(simulation, inputs, outputs, truth_table, done);
        }, 100);

        it("should correctly simulate a sr flip-flow", function(done) {
            var i = {
                ns: simulation.create_component("Interconnect").component_id,
                nr: simulation.create_component("Interconnect").component_id
            };

            var o = {
                q: simulation.create_component("Interconnect").component_id,
                nq: simulation.create_component("Interconnect").component_id
            };

            var nand_a = simulation.create_component("NAND").component_id;
            var nand_b = simulation.create_component("NAND").component_id;

            //wiring for nand_a
            simulation.connect(i.ns, 0, nand_a, 0);
            simulation.connect(o.nq, 0, nand_a, 1);
            simulation.connect(nand_a, 0, o.q, 0); // out

            //wiring for nand_b
            simulation.connect(o.q, 0, nand_b, 0);
            simulation.connect(i.nr, 0, nand_b, 1);
            simulation.connect(nand_b, 0, o.nq, 0); // out

            var truth_table = [
                { ns: false, nr: true , q: true , nq: false },
                { ns: true , nr: true , q: true , nq: false },
                { ns: true , nr: false, q: false, nq: true  },
                { ns: true , nr: true , q: false, nq: true  },
                { ns: false, nr: false, q: true , nq: true  }, // non-allowed state

                // Same random transitions
                { ns: false, nr: true , q: true , nq: false },
                { ns: true , nr: false, q: false, nq: true  },
                { ns: false, nr: true , q: true , nq: false },
                { ns: true , nr: true , q: true , nq: false },
                { ns: false, nr: true , q: true , nq: false },
                { ns: true , nr: false, q: false, nq: true  },
                { ns: true , nr: true , q: false, nq: true  },
                { ns: true , nr: false, q: false, nq: true  }
            ];

            run_async_truth_table_simulation(simulation, i, o, truth_table, done);
        }, 100);

    }); // end of describe
}

/**
 * Checks a given simulation against a given truth table.
 *
 * @note The execution order matches the order of entries in the truth_table and can be relied
 *       upon for testing stateful circuits.
 *
 * @note Last entry in the truth table must result in input and/or output changes for the test
 *       to properly terminate.
 *
 * @param simulation Pre-built simulation with all needed components and input/output interconnects
 * @param inputs Map between truth table key name and input interconnect id
 * @param outputs Map between truth table key name and output interconnect id
 * @param truth_table Array of dictionaries which contain the expected inputs and outputs as name:boolean pairs
 * @param done Jasmine done callback so the test can be ended
 */
function run_async_truth_table_simulation(simulation, inputs, outputs, truth_table, done) {
    var current_step = 0;
    var last_seen = {};

    function schedule_truth_table_row() {
        var entry = truth_table[current_step];
        for (var k in inputs) {
            if (!inputs.hasOwnProperty(k)) continue;
            simulation.schedule_edge(inputs[k], 0, entry[k], 1);
        }
    }

    function fail(error, msg) {
        console.log(error);
        console.log(msg);
        expect(true).toBeFalsy();
        simulation.stop();
        done();
        throw error;
    }

    simulation.set_handler("error", function(msg) {
        fail("Encountered error", msg);
    });

    var steady = false;

    simulation.set_handler('stopped', function(msg) {
        if (current_step >= truth_table.length) {
            fail("Unexpected trailing simulation stop. Simulation shouldn't be running.", msg);
        }

        expect(steady).toBeTruthy();
        expect(last_seen).toEqual(truth_table[current_step]);

        //console.log("Done with " + current_step + " of " + (truth_table.length - 1));
        ++current_step;

        var completed = current_step >= truth_table.length;
        if (!completed) {
            steady = false;
            schedule_truth_table_row();
            setTimeout(simulation.start.bind(simulation), 0); // Break recursion in non-webworker tests
        }

        //console.log("Completed truth table");
        done();
    });

    simulation.set_handler("steady_state_changed", function(msg) {
        if (current_step >= truth_table.length) {
            fail("Unexpected trailing simulation steady state change. Simulation shouldn't be running.", msg);
        }

        if (!msg.steady) {
            steady = false;
            return;
        }

        expect(last_seen).toEqual(truth_table[current_step]);
        steady = true;

        simulation.stop();
    });

    simulation.set_handler("update", function(msg) {
        if (current_step >= truth_table.length) {
            fail("Unexpected trailing item updates, simulation is supposed to be steady", msg);
        }

        var state = undefined;

        function applyMessage(msg) {
            for (var input in inputs) {
                if (!inputs.hasOwnProperty(input)) continue;
                if (inputs[input] == msg.props.id) {
                    state = msg.props.input_states;
                    if (state === undefined)
                        return false;

                    last_seen[input] = state[0];
                    return true;
                }
            }

            for (var output in outputs) {
                if (!outputs.hasOwnProperty(output)) continue;
                if (outputs[output] == msg.props.id) {
                    state = msg.props.output_states;
                    if (state === undefined)
                        return false;

                    last_seen[output] = state[0];
                    return true;
                }
            }

            return false;
        }

        applyMessage(msg);
    });

    schedule_truth_table_row();
    simulation.start();
}

// Most of the tests of backend with or without web-worker should be identical. However
// debugging without web-workers is a lot easier so we handle them like this to not have
// to copy and paste around all the time.

do_test_simulation_with("A simulation with web-work backend", function() {
    return new LogikSim.Backend.Simulation('base/src/scripts/');
});

do_test_simulation_with("A test simulation _without_ web-worker backend", function() {
    return mk_synchronous_test_simulation('base/src/scripts/');
});
