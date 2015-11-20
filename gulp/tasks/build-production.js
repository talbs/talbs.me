// ------------------------------
// task: build-production
// ------------------------------

var gulp          = require('gulp'),
    runSequence   = require('run-sequence');

// run this to compress all the things!
gulp.task( 'build-production', function() {
    runSequence(
        'build-development',
        ['images', 'css-minify', 'js-uglify']
    );
});
