// ------------------------------
// task: build-development
// ------------------------------

var gulp = require('gulp');

// run this to compress all the things!
gulp.task('build-development', ['images', 'js', 'css', 'jekyll-build']);
