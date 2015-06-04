
describe("A logger", function() {
    function mk_log(ss, log_level) {
        function my_log(s) {
            ss.push(s);
        }

        return new LogikSim.Logger("Test", log_level, my_log);
    }

    it("should be able to log from all its helper functions", function() {
        var ss = [];
        var log = mk_log(ss, LogikSim.DEBUG);

        log.debug("D");
        log.info("I");
        log.warn("W");
        log.error("E");

        expect(ss).toEqual(['DEBUG Test: D', 'INFO Test: I', 'WARN Test: W', 'ERROR Test: E']);
    });

    it("should discard messages below its configured level", function() {
        var ss = [];
        var log = mk_log(ss, LogikSim.ERROR);

        log.error("1");
        log.debug("D");
        log.info("I");
        log.error("2");
        log.warn("W");
        log.error("3");

        expect(ss).toEqual(['ERROR Test: 1', 'ERROR Test: 2', 'ERROR Test: 3']);
    });

    it("should be able to deal with numeric levels", function() {
        var ss = [];
        var log = mk_log(ss, 23);

        log.log(22, "Brz");
        log.log(23, "Foo");
        log.log(-10, "Bar");

        expect(ss).toEqual(['23 Test: Foo']);
    });
});
