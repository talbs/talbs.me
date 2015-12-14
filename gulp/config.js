// gulp configuration
var dest   = "./",
    src    = './',
    jekyll = './jekyll',
    local  = './_site';

module.exports = {
  browsersync: {
    server: {
      // Serve up jekyll-powered folder
      baseDir: local
    }
  },
  css: {
    src: src + "/sass/**/*.scss",
    local: local + "/css",
    dest: dest + "/css",
    dest_files: dest + "/css/**/*.css",
    settings: {
      imagePath: 'images', // Used by the image-url helper
      autoprefixer: { browsers: ['last 2 version'] }
    }
  },
  images: {
    src:  src + "/_images/**/*.png",
    dest: dest + "/images/"
  },
  jekyll:                     {
    data:     '_data/**/*',
    content:  '**/*.md',
    home:     'index.html',
    contact:  'contact/**/*',
    posts:    '_posts/**/*',
    includes: '_includes/**/*',
    layouts:  '_layouts/**/*'
  },
  js: {
    src:  src + "/js/**/*.js",
    dest: dest + "/js"
  },
  production: {
    cssSrc: dest + 'css/*.css',
    jsSrc:  dest + 'js/*.js',
    dest:   dest
  }
};
