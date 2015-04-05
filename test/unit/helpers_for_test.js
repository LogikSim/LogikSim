/**
 * Creates a test core for blocking execution to a stable state.
 */
function mk_test_core() {
    var core = new LogikSim.Backend.Core();

    core.test_timeline = [];
    core.test_loop_until_stable_or_time = function (time) {
        time = typeof time !== 'undefined' ? time : Infinity;

        while (this.event_queue.length !== 0) {
            var event = this._process_next_event(time);
            if (event !== null) {
                this.test_timeline.push(event);
            } else {
                break;
            }
        }

        return this.clock;
    };

    return core;
}

function mk_event(when, group, _order) {
    group = typeof group !== 'undefined' ? group : 0;

    var ev = new LogikSim.Backend.Event(when, group);
    if (typeof _order !== 'undefined') {
        // Note: Scheduling the event will cause this to be overridden.
        ev._order = _order;
    }

    return ev;
}
