// ------------------------------
// task: browsersync
// ------------------------------

var gulp          = require('gulp'),
    browserSync   = require('browser-sync'),
    config        = require('../config').browsersync;

gulp.task('browsersync', function() {
  browserSync(config);
});
