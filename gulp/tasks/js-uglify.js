// ------------------------------
// task: uglify
// ------------------------------

var gulp    = require('gulp'),
    config  = require('../config').js,
    size    = require('gulp-filesize'),
    uglify  = require('gulp-uglify');

gulp.task('js-uglify', ['js'], function() {
  return gulp.src(config.dest)
    .pipe(uglify())
    .pipe(size());
});
