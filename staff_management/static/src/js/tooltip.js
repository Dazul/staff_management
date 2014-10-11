openerp_staff_management_tooltip = function(instance) {
	
	instance.staff_management.tooltip = {

		min_width: 200,
		max_width: 400,

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
			$('.staff_tooltip').fadeIn(100);
		},

		hide: function(){
			$('.staff_tooltip').fadeOut(100);
		},



	};
}