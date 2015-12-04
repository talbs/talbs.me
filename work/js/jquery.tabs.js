/**
 * @name jQuery Tabs
 * @author Trevor Davis
 * @copyright (cc) Trevor Davis (http://www.trevordavis.net)
 *
 * Licensed under the CC-GNU GPL (http://creativecommons.org/licenses/GPL/2.0/)
 */
;(function($, window, document, undefined) {
	
	var Tabs = function(elem, options) {
		this.elem = elem;
		this.$elem = $(elem);
		this.options = options;
		this.metadata = this.$elem.data('tabs-options');
		this.$navTabs = this.$elem.find('.nav-tabs');
		this.$tabs = this.$elem.find('.tabs');
	};

	Tabs.prototype = {
		defaults: {

		},

		init: function() {
			var _this = this;
			
			//Handle Clicks
			_this.$navTabs.on('click', 'a', $.proxy(_this.handleClick, _this));
			
			//Make tabs linkable via a url hash
			_this.setInitial();
			
			_this.$tabs.find( '.current' ).show();

			return this;
		},
		
		changeTabs: function($parent, $target) {
			var _this = this,
			$currentTab = _this.$tabs.find( '.current' );

			_this.$navTabs.find('.current').removeClass('current');
			$parent.addClass('current');

			$currentTab.fadeOut( 500, function() {
				$target.fadeIn( 500, function() {
					$currentTab.add( $target ).toggleClass( 'current' );
				});
			});
		},
		
		handleClick: function(e) {
			var _this = this,
				$this = $(e.currentTarget),
				$parent = $this.parent(),
				target = $this.attr('href').split('#')[1],
				$target = $('#' + target);
			
			if($target && !$parent.hasClass('current')) {
				_this.changeTabs($parent, $target);
			}
			
			e.preventDefault();
		},
		
		setInitial: function() {
			var _this = this,
				hash = window.location.href.split('#')[1],
				cleanHash,
				$target,
				$parent;
				
			if(hash) {
				cleanHash = hash.replace('tab-', '');
				$target = _this.$tabs.find('#' + cleanHash);
				
				if($target.length) {
					$parent = _this.$navTabs.find('a[href$="#' + cleanHash + '"]').parent();

					if($parent.length) {
						_this.changeTabs($parent, $target);
					}

				}
			}
		}
		
	};

	Tabs.defaults = Tabs.prototype.defaults;

	$.fn.tabs = function(options) {
		return this.each(function() {
			new Tabs(this, options).init();
		});
	};

})(jQuery, window , document);