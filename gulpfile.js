var jshint = require('gulp-jshint');
var gulp = require('gulp-help')(require('gulp'));
var karma = require('karma').server;

gulp.task('test', 'Run test once and exit', function (done) {
  karma.start({
    configFile: __dirname + '/test/karma.conf.js',
    singleRun: true
  }, done);
});

gulp.task('tdd', 'Watch for file changes and re-run tests on each change', function (done) {
  karma.start({
    configFile: __dirname + '/test/karma.conf.js'
  }, done);
});

gulp.task('lint', 'Lint source files and exit', function (done) {
  return gulp.src(['src/**/*.js', '!src/vendor/**'])
     .pipe(jshint())
     .pipe(jshint.reporter('default'))
     .pipe(jshint.reporter('fail'));
});
