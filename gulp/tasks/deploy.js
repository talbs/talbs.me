// ------------------------------
// task: deploy
// ------------------------------

var gulp    = require('gulp'),
    config  = require('../config'),
    ghPages = require('gulp-gh-pages'),
    open    = require('open'),
    os      = require('os'),
    package = require('../../package.json'),
    path    = require('path');

var settings = {
  url: package.homepage,
  src: path.join('./build', '/**/*'),
  ghPages: {
    cacheDir: path.join(os.tmpdir(), package.name)
  }
}

gulp.task('deploy', ['build-production'], function() {
  return gulp.src(settings.src)
    .pipe(ghPages(settings.ghPages))
    .on('end', function(){
      open(settings.url)
    })
})
