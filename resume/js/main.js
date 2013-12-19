
function $linkNewWindow(e) {
  window.open($(e.target).attr('href'));
  e.preventDefault();
}

// --------------------

jQuery(document).ready(function($) {

  // removing no-js, accessibility/modernizr marker
  $('html').removeClass('no-js');

  // removing preload class - holds up load-based animations
  $("body").removeClass("preload");

  // general link management - new window/tab
  $('a[data-rel="external"]').bind('click', $linkNewWindow);

  // one page nav - https://github.com/davist11/jQuery-One-Page-Nav
  $('#nav--global').onePageNav({
      currentClass: 'is--current',
      changeHash: false,
      scrollSpeed: 750,
      scrollOffset: 30,
      scrollThreshold: 0.5,
      filter: '',
      easing: 'swing',
      begin: function() {
          //I get fired when the animation is starting
      },
      end: function() {
          //I get fired when the animation is ending
      },
      scrollChange: function($currentListItem) {
          //I get fired when you enter a section and I pass the list item of the section
      }
  });
});
