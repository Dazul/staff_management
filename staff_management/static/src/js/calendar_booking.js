(function ($) {

/**
* @function
* @property {object} jQuery plugin which runs handler function once specified element is inserted into the DOM
* @param {function} handler A function to execute at the time when the element is inserted
* @param {bool} shouldRunHandlerOnce Optional: if true, handler is unbound after its first invocation
* @example $(selector).waitUntilExists(function);
*/

$.fn.waitUntilExists    = function (handler, shouldRunHandlerOnce, isChild) {
	var found       = 'found';
	var $this       = $(this.selector);
	var $elements   = $this.not(function () { return $(this).data(found); }).each(handler).data(found, true);

	if (!isChild)
	{
		(window.waitUntilExists_Intervals = window.waitUntilExists_Intervals || {})[this.selector] =
			window.setInterval(function () { $this.waitUntilExists(handler, shouldRunHandlerOnce, true); }, 500)
		;
	}
	else if (shouldRunHandlerOnce && $elements.length)
	{
		window.clearInterval(window.waitUntilExists_Intervals[this.selector]);
	}

	return $this;
}

}(jQuery));


openerp_staff_management_calendar_booking = function(instance) {
	var _t = instance.web._t; // For text translations
	
	instance.web.views.add('calendar_booking', 'instance.staff_management.BookingCalendar');
	
	instance.staff_management.BookingCalendar = instance.staff_management.Calendar.extend({
	
		template: "PersonalScheduleView",
		
		
		// init, backup scheduler fonctions
		init:function(){
			this.backup = {};
			this.backup.dhx_cal_data = scheduler._click.dhx_cal_data;
			this.backup._on_mouse_move = scheduler._on_mouse_move;
			this.backup._on_mouse_up = scheduler._on_mouse_up;
			this.backup._on_mouse_down = scheduler._on_mouse_down;
			this.backup._on_dbl_click = scheduler._on_dbl_click;
			this.backup.render_data = scheduler.render_data;
			this._super.apply(this,arguments);
			this.init_custom_calendar();
		},
		
		// destroy, restore scheduler fonctions
		destroy:function(){
			scheduler._click.dhx_cal_data = this.backup.dhx_cal_data;
			scheduler._on_mouse_move = this.backup._on_mouse_move;
			scheduler._on_mouse_up = this.backup._on_mouse_up;
			scheduler._on_mouse_down = this.backup._on_mouse_down;
			scheduler._on_dbl_click = this.backup._on_dbl_click;
			scheduler.render_data = this.backup.render_data;
			this._super();
		},
		
		
		// remove filter user_id
		do_search: function(domain, context, group_by) {			
			for(i=0 ; i<domain.length ; i++){
				if(domain[i][0] == 'user_id'){
					domain.pop(i);
					i--;
				}
			}
			this._super.apply(this,arguments);
		},
		
		
		// convert an event from databse to an event for the DHTMLXscheduler
		convert_event: function(evt) {
			var date_start = instance.web.str_to_datetime(evt[this.date_start]),
				date_stop = this.date_stop ? instance.web.str_to_datetime(evt[this.date_stop]) : null,
				date_delay = evt[this.date_delay] || 1.0,
				res_text = '';
					
			if (this.info_fields) {
				res_text = _.map(this.info_fields, function(fld) {
					if(evt[fld] instanceof Array)
						return evt[fld][1];
					return evt[fld];
				});
			}
			date_stop = date_start.clone();
			
						
			var r = {
				'start_date': date_start.toString('yyyy-MM-dd'),
				'end_date': date_stop.toString('yyyy-MM-dd'),
				'text': res_text.join(', '),
				'id': evt.id,
				'booking_name': evt.booking_name,
				'nbr_adult': evt.nbr_adult,
				'nbr_child': evt.nbr_child,
				'meal_included': evt.meal_included,
				'hour_from': evt.hour_from,
				'hour_to': evt.hour_to,
				'observation': evt.observation
			};
			
			if(evt.hour_from){
				r.hour_from = evt.hour_from;
			}
			
			if(evt.hour_to){
				r.hour_to = evt.hour_to;
			}
			
			if (evt.color) {
				r.color = evt.color;
			}
			if (evt.textColor) {
				r.textColor = evt.textColor;
			}
			return r;
		},	
		
		// TODO - Get instance.web.FormView & apply set_value({'field': 'value'});
		// FormView in FormPopup.view_form
		slow_create: function(event_id, event_obj) {
			var old_pop = instance.web.form.FormOpenPopup;
			instance.web.form.FormOpenPopup = instance.staff_management.FormOpenPopup;
			//this._super.apply(this,arguments);
			this.slow_create_initial(event_id, event_obj);
			
			instance.web.form.FormOpenPopup = old_pop;
		},
		slow_create_initial: function(event_id, event_obj) {
	        var self = this;
	        if (this.current_mode() === 'month') {
	            event_obj['start_date'].addHours(8);
	            if (event_obj._length === 1) {
	                event_obj['end_date'] = new Date(event_obj['start_date']);
	                event_obj['end_date'].addHours(1);
	            } else {
	                event_obj['end_date'].addHours(-4);
	            }
	        }
	        var defaults = {};
	        _.each(this.get_event_data(event_obj), function(val, field_name) {
	            defaults['default_' + field_name] = val;
	        });
	        
	        var something_saved = false;
	        var pop = new instance.web.form.FormOpenPopup(this);
	        var pop_infos = this.get_form_popup_infos();
	        pop.show_element(this.dataset.model, null, this.dataset.get_context(defaults), {
	            title: _.str.sprintf(_t("Create: %s"), pop_infos.title),
	            disable_multiple_selection: true,
	            view_id: pop_infos.view_id,
	        });
	        pop.on('closed', self, function() {
	            if (!something_saved) {
	                scheduler.deleteEvent(event_id);
	            }
	        });
	        pop.on('create_completed', self, function(id) {
	            something_saved = true;
	            self.dataset.ids.push(id);
	            scheduler.changeEventId(event_id, id);
	            self.reload_event(id);
	        });
	    },
		
		open_event: function(event_id) {
			var old_pop = instance.web.form.FormOpenPopup;
			instance.web.form.FormOpenPopup = instance.staff_management.FormOpenPopup;
			this._super.apply(this,arguments);
			instance.web.form.FormOpenPopup = old_pop;
		},
		
		staff_get_event: function(e){
			var trg = e?e.target:event.srcElement;
			var id = scheduler._locate_event(trg);
			return scheduler.getEvent(id);
		},

		
		
		
		set_staff_tooltip_content: function(evt){
			if(evt.meal_included){
				$('.staff_tooltip').html(
					'<div>'+this.convert_hour(evt.hour_from)+' - '+this.convert_hour(evt.hour_to)+'</div>'+
					'<div>'+evt.booking_name+'</div>'+
					'<div>'+evt.nbr_adult+'&nbsp;'+_t('adults')+'</div>'+
					'<div>'+evt.nbr_child+'&nbsp;'+_t('children')+'</div>'+
					'<div>'+_t('Meal included')+'</div>'
				);
			}
			else{
				$('.staff_tooltip').html(
					'<div>'+this.convert_hour(evt.hour_from)+' - '+this.convert_hour(evt.hour_to)+'</div>'+
					'<div>'+evt.booking_name+'</div>'+
					'<div>'+evt.nbr_adult+'&nbsp;'+_t('adults')+'</div>'+
					'<div>'+evt.nbr_child+'&nbsp;'+_t('children')+'</div>'
				);
			}
			
			if(evt.observation){
				$('.staff_tooltip').append($('<div>'+evt.observation+'</div>'));
			}
			/*
			$('.staff_tooltip').html('<div>'+this.convert_hour(evt.hour_from)+' - '+this.convert_hour(evt.hour_to)+'</div>'+
				'<div>'+evt.task[1]+'</div>'+
				'<div>'+comment+'</div>'
			);
			*/
		},
		
		init_custom_calendar: function(){
			var self = this;
			// Don't display time from here
			scheduler.templates.event_date=function(d){
				return "";
			}
			
			// Text in events
			scheduler.templates.event_bar_text=function(start,end,ev){
				if(ev.booking_name == undefined){
					return "<span>"+self.convert_hour(ev.hour_from)+" "+_t("New event")+"</span>";
				}
				return "<span>"+self.convert_hour(ev.hour_from)+" "+ev.booking_name+"</span>";
			}
			
			// class in events
			scheduler.templates.event_class=function(start,end,ev){
				return "staff_tooltip_show";
			}
		
			// disative mouses actions for drag&drop
			scheduler._on_mouse_move=function(e){
				this._drag_id = null;
				this._drag_mode=null;
				this._drag_pos=null;
				return false;
			}
			scheduler._on_mouse_up=function(e){
				this._drag_id = null;
				this._drag_mode=null;
				this._drag_pos=null;
				return false;
			}
			scheduler._on_mouse_down=function(e){
				this._drag_id = null;
				this._drag_mode=null;
				this._drag_pos=null;
				return false;
			}
			
		},
		
		
	});
	

	instance.staff_management.FormOpenPopup = instance.web.form.FormOpenPopup.extend({
		init_popup: function() {
	        this._super.apply(this,arguments);
	        this.init_totalPrice_update();
	    },

	    init_totalPrice_update: function(){
			var fields = [
				// adults
				'staff_nbr_adult',
				'staff_price_adult',
				// children
				'staff_nbr_child',
				'staff_price_child',
				// wheelchairs
				'staff_nbr_wheelchair',
				'staff_price_wheelchair',
				// meals (checkbox not included here)
				'staff_meal_price_adult',
				'staff_meal_price_child'
			];
			
			var self = this;
			
			
			fields.forEach(function(field){
				 $('.'+field+' input').waitUntilExists(function(){
				 	
				 	var old_field_value = self.getFieldValue(field);
					$('.'+field+' input').keyup(function(){
						if(field == 'staff_meal_price_adult' || field == 'staff_meal_price_child'){
							if(self.getFieldValue(field) != old_field_value){
								self.view_form.set_values({'meal_included': true});
								old_field_value = self.getFieldValue(field);
							}
						}
						self.updateTotalPrice();
					});
				});
			});
			
		   // meal checkbox
		   $('.staff_meal_included input').waitUntilExists(function(){
				$('.staff_meal_included input').change(function(){
					self.updateTotalPrice();
				});
			});
			
			// meal observation for the checkbox
			$('.staff_meal_observation textarea').waitUntilExists(function(){
				var old_field_value = self.getFieldValue('staff_meal_observation');
				$('.staff_meal_observation textarea').keyup(function(){
					if($('.staff_meal_observation textarea').val() != old_field_value){
						self.view_form.set_values({'meal_included': true});
						old_field_value = $('.staff_meal_observation textarea').val();
					}
				});
			});

		},

		updateTotalPrice: function(){
			var totalPrice = 0;
			
			var nbr_adult = this.getFieldValue('staff_nbr_adult');
			var price_adult = this.getFieldValue('staff_price_adult');
			totalPrice += nbr_adult * price_adult;
			
			var nbr_child = this.getFieldValue('staff_nbr_child');
			var price_child = this.getFieldValue('staff_price_child');
			totalPrice += nbr_child * price_child;
			
			var nbr_wheelchair = this.getFieldValue('staff_nbr_wheelchair');
			var price_wheelchair = this.getFieldValue('staff_price_wheelchair');
			totalPrice += nbr_wheelchair * price_wheelchair;
			
			if($('.staff_meal_included input').is(':checked')){
				var meal_price_adult = this.getFieldValue('staff_meal_price_adult');
				totalPrice += nbr_adult * meal_price_adult;
				
				var meal_price_child = this.getFieldValue('staff_meal_price_child');
				totalPrice += nbr_child * meal_price_child;
			}
			
			this.view_form.set_values({'total_price': totalPrice});
		},
		
		getFieldValue: function(fieldClass){
			var val = parseFloat($('.'+fieldClass+' input').val());
			if(isNaN(val)){
				return 0;
			}
			return val;
		},

	});


};






