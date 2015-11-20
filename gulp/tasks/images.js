// ------------------------------
// task: images
// ------------------------------

var gulp            = require('gulp'),
    browserSync     = require('browser-sync'),
    changed         = require('gulp-changed'),
    config          = require('../config').images,
    imagemin        = require('gulp-imagemin'),
    pngquant        = require('imagemin-pngquant');

gulp.task('images', function() {
  return gulp.src(config.src)
    .pipe(changed(config.dest)) // ignore unchanged files
    .pipe(imagemin({            // optimize
        progressive: true,
        use: [pngquant()]
     }))
    .pipe(gulp.dest(config.dest))
    .pipe(browserSync.reload({stream:true}));
});
