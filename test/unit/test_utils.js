
describe("A priority queue", function() {
    var mk_pq = function () {
        return LogikSim.Backend.make_priority_queue(function(a, b) { return a - b; });
    };

    it("should be empty in the beginning", function() {
        expect(mk_pq().length).toBe(0);
    });

    it("should behave correctly with a single insertion", function() {
        var pq = mk_pq();
        pq.put(10);

        expect(pq[0]).toBe(10);
    });

    it("multiple insertions should be sorted correctly", function() {
        var pq = mk_pq();

        pq.put(0); expect(pq).toEqual([0]);
        pq.put(10); expect(pq).toEqual([0, 10]);
        pq.put(5); expect(pq).toEqual([0, 5, 10]);
        pq.put(20); expect(pq).toEqual([0, 5, 10, 20]);
        pq.put(-1); expect(pq).toEqual([-1, 0, 5, 10, 20]);

        expect(pq).toEqual([-1, 0, 5, 10, 20]);
    });

    it("should handle double insertions of the same item", function() {
        var pq = mk_pq();

        pq.put(0);
        pq.put(2);
        pq.put(1);
        pq.put(2);
        pq.put(3);

        expect(pq).toEqual([0, 1, 2, 2, 3]);
    });

    it("should be correct for random input", function() {
        for (var i = 0; i < 20; ++i) {
            var nums = [];
            var pq = mk_pq();
            for (var j = 0; j < 30; ++j) {
                var num = Math.random();
                nums.push(num);
                pq.put(num);
            }

            nums.sort(function (a, b) {
                return a - b;
            });

            expect(pq).toEqual(nums);
        }
    });

    // As long as it is array based and we retrieve the values with shift we
    // don't have to bother testing removal.
});

describe("A LogikSim.Backend.BackendError", function () {
    it("should be throwable and be caught by Jasmine", function() {
        function err() {
            throw new LogikSim.Backend.BackendError("Foo");
        }

        expect(err).toThrowError(LogikSim.Backend.BackendError, "Foo");
        expect(err).toThrowError(LogikSim.Backend.BackendError);
    });
});
