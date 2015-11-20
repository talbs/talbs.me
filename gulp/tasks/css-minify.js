// ------------------------------
// task: minifycss
// ------------------------------

var gulp        = require('gulp'),
    config      = require('../config').css,
    minifyCSS   = require('gulp-minify-css'),
    size        = require('gulp-filesize');

gulp.task('css-minify', ['css'], function() {
  return gulp.src(config.dest_files)
    .pipe(minifyCSS())
    .pipe(size())
    .pipe(gulp.dest(config.dest));
})
