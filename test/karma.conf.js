// Karma configuration
// Generated on Fri Mar 27 2015 22:43:27 GMT+0100 (W. Europe Standard Time)

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '../',

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: [
      'phantomjs-shim', // Function.bind for PhantomJS 1.X.X
      'jasmine-jquery',
      'jasmine'
    ],


    // list of files / patterns to load in the browser
    files: [
      // Used vendor dependencies
      'src/vendor/underscore.js',

      // Fixture configuration
      'test/karma-fixture-setup.js',
      'test/unit/*.html',

      {pattern: 'src/scripts/backend/worker.js', included: false}, // Web-worker script with entry point
      {pattern: 'src/scripts/render.js', included: false}, // UI with global effects\
      {pattern: 'src/scripts/**/*.json', included: false},

      'src/scripts/backend/event.js',
      'src/scripts/**/*.js',

      // Spec files
      'test/unit/helpers_for_test.js',
      'test/unit/test_*.js'
    ],


    // list of files to exclude
    exclude: [
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'src/scripts/**/*.js': ['coverage']
    },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress',
                'coverage'],


    coverageReporter: {
        type: 'lcov'
    },
    // web server port
    //port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['PhantomJS'], //, 'Chrome', 'Firefox'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false
  });
};
