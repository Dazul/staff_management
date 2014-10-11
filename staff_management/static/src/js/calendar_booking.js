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
		(window.waitUntilExists_Intervals = window.waitUntilExists_Intervals || {})[this.selector] = window.setInterval(function () { $this.waitUntilExists(handler, shouldRunHandlerOnce, true); }, 500);
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
		
		init:function(){
			this._super.apply(this,arguments);
		},
		
		// destroy, restore scheduler fonctions
		destroy:function(){
			this._super();
		},
		
		get_fc_init_options: function () {
			//Documentation here : http://arshaw.com/fullcalendar/docs/
			var self = this;
			return  $.extend({}, this._super(), {
				
				eventClick: function(event){
					self.open_event_staff(event.id,event.title);
				},
				select: function (start_date, end_date, all_day, _js_event, _view) {
					var data_template = self.get_event_data({
						start: start_date,
						end: end_date,
						allDay: all_day,
					});
					self.slow_create(data_template);
				},
				eventRender: function(event, element) {		
					
					element.text(self.format_hour(event.hour_from)+' '+event.booking_name);
					element.mouseenter(event, function(evt){
						instance.staff_management.tooltip.show($(this), self.get_tooltip_content(evt.data));
					}).mouseleave(instance.staff_management.tooltip.hide);
				},
			});
		},
	
		get_tooltip_content: function(event){
			var div = $('<div>');
			div.append($('<div>').text(this.format_hour(event.hour_from)+' - '+this.format_hour(event.hour_to)));
			div.append($('<div>').text(event.booking_name));
			div.append($('<div>').text(event.nbr_adult+' '+_t('adults')));
			div.append($('<div>').text(event.nbr_child+' '+_t('children')));
			if(event.meal_included){
				div.append($('<div>').text(_t('Meal included')));
			}
			if(event.observation){
				div.append($('<div>').text(event.observation));
			}
			return div;
		},
		
		event_data_transform: function(evt) {
			var r = this._super.apply(this,arguments);
			r.booking_name = evt.booking_name;
			r.hour_from = evt.hour_from;
			r.hour_to = evt.hour_to;
			r.observation = evt.observation;
			r.nbr_adult = evt.nbr_adult;
			r.nbr_child = evt.nbr_child;
			r.meal_included = evt.meal_included;
			return r;
		},

		get_title: function () {
			var title = (_.isUndefined(this.field_widget)) ?
					(this.string || this.name) :
					this.field_widget.string || this.field_widget.name || '';
			return _t("Create: ") + title;
		},
		get_form_popup_infos: function() {
			var infos = {
				view_id: false,
				title: this.name,
			};
			if (!(_.isUndefined(this.ViewManager))) {
				infos.view_id = this.ViewManager.get_view_id('form');
			}
			return infos;
		},
		slow_create: function(data){
			
			var self = this;
			var defaults = {};
			
			_.each(data, function(val, field_name) {
				defaults['default_' + field_name] = val;
			});
			
			var pop_infos = self.get_form_popup_infos();
			var pop = new instance.staff_management.FormOpenPopup(this);
			var context = new instance.web.CompoundContext(this.dataset.context, defaults);
			pop.show_element(this.dataset.model, null, this.dataset.get_context(defaults), {
				title: this.get_title(),
				disable_multiple_selection: true,
				view_id: pop_infos.view_id,
				// Ensuring we use ``self.dataset`` and DO NOT create a new one.
				create_function: function(data, options) {
					return self.dataset.create(data, options).done(function(r) {
					}).fail(function (r, event) {
					   if (!r.data.message) { //else manage by openerp
							throw new Error(r);
					   }
					});
				},
				read_function: function(id, fields, options) {
					return self.dataset.read_ids.apply(self.dataset, arguments).done(function() {
					}).fail(function (r, event) {
						if (!r.data.message) { //else manage by openerp
							throw new Error(r);
						}
					});
				},
			});
			pop.on('closed', self, function() {
				self.$calendar.fullCalendar('unselect');
			});
			pop.on('create_completed', self, function(id) {
				self.$calendar.fullCalendar('unselect');
				self.$calendar.fullCalendar('refetchEvents');
			});
			
		},
		
		open_event_staff: function(id, title) {
			var self = this;
			if (! this.open_popup_action) {
				var index = this.dataset.get_id_index(id);
				this.dataset.index = index;
				if (this.write_right) {
					this.do_switch_view('form', null, { mode: "edit" });
				} else {
					this.do_switch_view('form', null, { mode: "view" });
				}
			}
			else {
				var pop = new instance.staff_management.FormOpenPopup(this);
				pop.show_element(this.dataset.model, id, this.dataset.get_context(), {
					title: _.str.sprintf(_t("View: %s"),title),
					view_id: +this.open_popup_action,
					res_id: id,
					target: 'new',
				});

				var form_controller = pop.view_form;
				form_controller.on("load_record", self, function(){
					button_delete = _.str.sprintf("<button class='oe_button oe_bold delme'><span> %s </span></button>",_t("Delete"));
					
					pop.$el.closest(".modal").find(".modal-footer").prepend(button_delete);
					
					$('.delme').click(
						function() {
							$('.oe_form_button_cancel').trigger('click');
							self.remove_event(id);
						}
					);
				});
			
				pop.on("saved", self, function(){
					self.$calendar.fullCalendar('refetchEvents');
				});
			
			}
			return false;
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
						obj = self.view_form.set_values({'meal_included': true});
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
	
	/*
	instance.web.views.add('staff_booking_form', 'instance.web.StaffFormView');
	
	instance.web.StaffFormView = instance.web.FormView.extend({
		
	});
	*/
	
};
