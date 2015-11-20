// ------------------------------
// task: default
// ------------------------------

var gulp            = require('gulp'),
    runSequence     = require('run-sequence');

gulp.task( 'default', function() {
    runSequence(
        'build-development',
        'watch'
    );
});
