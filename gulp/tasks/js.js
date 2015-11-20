// ------------------------------
// task: scripts
// ------------------------------

var gulp          = require('gulp'),
    browserSync   = require('browser-sync'),
    concat        = require('gulp-concat'),
    config        = require('../config').js,
    handleErrors  = require('../util/handleErrors'),
    jshint        = require('gulp-jshint');

gulp.task('js', function() {
  return gulp.src('config.src')
    .pipe(jshint(''))
    .pipe(jshint.reporter('default'))
    .pipe(concat('main.js'))
    .pipe(gulp.dest(config.dest))
    .pipe(browserSync.reload({stream:true}));
});
