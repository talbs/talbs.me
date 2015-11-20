// ------------------------------
// task: styles
// ------------------------------

var gulp          = require('gulp'),
    autoprefixer  = require('gulp-autoprefixer'),
    browserSync   = require('browser-sync'),
    config        = require('../config').css,
    handleErrors  = require('../util/handleErrors'),
    sass          = require('gulp-sass'),
    sourcemaps    = require('gulp-sourcemaps');

gulp.task('css', function () {
  return gulp.src(config.src)
    .pipe(sourcemaps.init())
    .pipe(sass(config.settings.imagePath))
    .on('error', handleErrors)
    .pipe(autoprefixer(config.settings.autoprefixer))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(config.dest))
    .pipe(browserSync.reload({stream:true}));
});
