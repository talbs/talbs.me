// ------------------------------
// task: build-production
// ------------------------------

var gulp = require('gulp');

// run this to compress all the things!
gulp.task('build-production', ['images', 'css-minify', 'js-uglify']);
