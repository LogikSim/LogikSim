var gulp = require('gulp-help')(require('gulp'));
var karma = require('karma').server;

/**
 * Run test once and exit
 */
gulp.task('test', 'Run test once and exit', function (done) {
  karma.start({
    configFile: __dirname + '/test/karma.conf.js',
    singleRun: true
  }, done);
});

/**
 * Watch for file changes and re-run tests on each change
 */
gulp.task('tdd', 'Watch for file changes and re-run tests on each change', function (done) {
  karma.start({
    configFile: __dirname + '/test/karma.conf.js'
  }, done);
});