// Sets the expected path for our test fixtures so we don't
// have to repeat it in every spec file
// See https://github.com/velesin/jasmine-jquery
(function() {
    var fixtureDirectory = 'base/test/unit/'; // 'base/' prefix is a karma idiosyncrasy
    jasmine.getFixtures().fixturesPath = fixtureDirectory;
    jasmine.getStyleFixtures().fixturesPath = fixtureDirectory;
    jasmine.getJSONFixtures().fixturesPath = fixtureDirectory;
}());
