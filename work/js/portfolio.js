// === portfolio js ===
$(document).ready(function() {
	
	// utilities-n-such
	$('.wrapper-work:even').addClass('even');
	$('.wrapper-work:odd').addClass('odd');
	$('article.item .samples .sample:even').addClass('even');
	$('article.item .samples .sample:odd').addClass('odd');


	// widow fixing
	$('nav.main .description').widowFix();
	$('.samples p').widowFix();
	$('.steps .step p').widowFix();
	$('.item .description').widowFix();
	$('.nav-tabs a strong').widowFix();

	// card flipping
	$('.wrapper-card .card').hover(function(){
		$(this).toggleClass("flipped");
	});

	// scrollspy
	$('nav.main').scrollspy();

	// smoothscroll
	$('a[href^="#"]:not(.link-tab)').smoothScroll({
		offset: -200,
    easing: 'swing',
    speed: 2000
	});

	// tabs
	$('.tab-group').tabs();


	// link announcements - pdf
	$('a[href$=".pdf"], a.cta-dl').each(function(){
		$(this).attr('title','This link will download a PDF document');
	});

		// link announcements - modal
	$('a[data-toggle="modal"], a.cta-modal').each(function(){
		$(this).attr('title','This link will open in a modal window');
	});

	// link announcements - new windows
	$('a[href^="http://"], a.cta-view, a.new-window').each(function(){
		
		var $url = $(this).attr('href');
		$(this).attr('title','This link will open in a new window');

		$(this).click(function(e){
			window.open($url);
			e.preventDefault();
		});
	});
});