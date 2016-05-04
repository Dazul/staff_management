odoo.define('staff_management.Tooltip', function (require) {
"use strict";

var core = require('web.core');

var Tooltip = {
	min_width: 200,
	max_width: 400,

	timeout_hide: 0,
	timeout_left_hide: 0,

	show: function(element, content){

		// Set tooltip content and size
		$('.staff_tooltip').removeAttr('style');
		$('.staff_tooltip_content').empty().append(content);

		if($('.staff_tooltip').width() < this.min_width){
			$('.staff_tooltip').css({'width': this.min_width});
		}
		if($('.staff_tooltip').width() > this.max_width){
			$('.staff_tooltip').css({'width': this.max_width});
		}


		// Tooltip position
		var position = $(element).offset();
		var h = $('.staff_tooltip').height();
		var w = $('.staff_tooltip').width();
		var ew = $(element).width();

		var left = position.left - w/2 + ew/2;
		var top = position.top - h - 10;

		var right = left + w;
		if(right + 10 > $(window).width()){
			left = $(window).width() - w - 10;
		}

		$('.staff_tooltip').css({
			'top': top,
			'left': left,
		});

		// Arrow position
		var aw = $('.staff_tooltip_arrow').width();
		var aleft =  position.left - left + ew/2 - aw/2;
		if(aleft + 25 > w){
			aleft = w - 25;
		}
		$('.staff_tooltip_arrow').css({'left': aleft});


		// Display
		clearTimeout(self.timeout_hide);
		$('.staff_tooltip').fadeIn(100);
	},

	hide: function(){
		self.timeout_hide = setTimeout(function(){
			$('.staff_tooltip').fadeOut(100);
		}, 50);

		self.timeout_left_hide = setTimeout(function(){
			$('.staff_tooltip_left').fadeOut(100);
		}, 50);
	},

	show_left: function(element, content){

		// Set tooltip content and size
		$('.staff_tooltip_left').removeAttr('style');
		$('.staff_tooltip_left_content').empty().append(content);

		if($('.staff_tooltip_left').width() < this.min_width){
			$('.staff_tooltip_left').css({'width': this.min_width});
		}
		if($('.staff_tooltip_left').width() > this.max_width){
			$('.staff_tooltip_left').css({'width': this.max_width});
		}

		// Tooltip position
		var position = $(element).offset();
		var h = $('.staff_tooltip_left').height();
		var w = $('.staff_tooltip_left').width();
		var ew = $(element).width();
		var eh = $(element).height();

		var left = position.left + ew + 10;
		var top = position.top + eh/2 - h/2;

		var bottom = top + h;
		if(top < 40){
			top = 40;
		}
		if(bottom + 10 > $(window).height()){
			top = $(window).height() - h - 10;
		}

		$('.staff_tooltip_left').css({
			'top': top,
			'left': left,
		});

		// Arrow position
		var ah = $('.staff_tooltip_left_arrow').height();
		var atop =  position.top - top + eh/2 - ah/2;
		/*if(aleft + 25 > w){
			aleft = w - 25;
		}*/
		$('.staff_tooltip_left_arrow').css({'top': atop});


		// Display
		clearTimeout(self.timeout_left_hide);
		$('.staff_tooltip_left').fadeIn(100);

	},

};

return Tooltip;
});
