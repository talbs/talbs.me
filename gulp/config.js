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
    dest: dest + "/css",
    settings: {
      imagePath: 'images', // Used by the image-url helper
      autoprefixer: { browsers: ['last 2 version'] }
    }
  },
  images: {
    src:  src + "/images/**",
    dest: dest + "/images"
  },
  jekyll:                     {
    content:  '**/*.md',
    home:     'index.html',
    work:     'work/**/*',
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
