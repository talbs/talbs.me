// ------------------------------
// task: watch
// ------------------------------

var gulp     = require('gulp'),
    config   = require('../config');

gulp.task('watch', ['browsersync'], function(callback) {
  gulp.watch(config.css.src, ['css']);
  gulp.watch(config.images.src, ['images']);
  gulp.watch(config.js.src, ['js']);

  // local
  gulp.watch(config.jekyll.home, ['jekyll-rebuild']);
  gulp.watch(config.jekyll.layouts, ['jekyll-rebuild']);
  gulp.watch(config.jekyll.includes, ['jekyll-rebuild']);
  gulp.watch(config.jekyll.posts, ['jekyll-rebuild']);
  gulp.watch(config.jekyll.work, ['jekyll-rebuild']);
  gulp.watch(config.jekyll.content, ['jekyll-rebuild']);
});
