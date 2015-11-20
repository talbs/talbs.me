// ------------------------------
// task: build-development
// ------------------------------

var gulp          = require('gulp'),
    runSequence   = require('run-sequence');

// run this to compress all the things!
gulp.task( 'build-development', function() {
    runSequence(
        ['images', 'js', 'css'],
        'jekyll-build'
    );
});
