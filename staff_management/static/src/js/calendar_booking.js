odoo.define('staff_management.BookingCalendar', function (require) {
"use strict";

var core = require('web.core');
var form_common = require('web.form_common');
var StaffCalendar = require('staff_management.StaffCalendar');
var Tooltip = require('staff_management.Tooltip');

var _t = core._t;

var BookingCalendar = StaffCalendar.extend({

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
				self.open_event_staff(event.id,event.booking_name);
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

				var color = self.color_palette[0];
				if(event.meal_included){
					color = self.color_palette[1];
				}

				element.text(self.format_hour(event.hour_from)+' '+event.booking_name);
				element.css({'background': color});
				element.css({'border-color': color});

				element.mouseenter(event, function(evt){
					Tooltip.show($(this), self.get_tooltip_content(evt.data));
				}).mouseleave(Tooltip.hide);

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
		return _t("Create booking");
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

		var dialog = new form_common.FormViewDialog(this, {
			res_model: this.dataset.model,
			context: defaults,
			title: this.get_title(),
			view_id: pop_infos.view_id,
			readonly: false,
			disable_multiple_selection: true
		}).open();
		dialog.on('record_saved', this, function(){
			self.$calendar.fullCalendar('refetchEvents');
			self.$calendar.fullCalendar('unselect');
		});
		dialog.on('closed', this, function(){
			self.$calendar.fullCalendar('unselect');
		});
		dialog.view_form.on("load_record", this, function(){
			self.setPopupFieldsAction(dialog);
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
			var dialog = new form_common.FormViewDialog(this, {
				res_model: this.dataset.model,
				res_id: id,
				context: this.dataset.get_context(),
				title: _.str.sprintf(_t("View: %s"),title),
				view_id: +this.open_popup_action,
				readonly: false,
				buttons: [
					{text: _t("Save"), classes: 'btn-primary', close: true, click: function() {
						this.view_form.save();
					}},
					{text: _t("Remove"), close: true, click: function() {
						self.remove_event(id);
					}},
					{text: _t("Close"), close: true}
				],
				write_function: function(id, data, _options) {
					return self.dataset.write(id, data, {}).done(function() {
						self.$calendar.fullCalendar('refetchEvents');
					});
				}
			}).open();
			dialog.view_form.on("load_record", this, function(){
				self.setPopupFieldsAction(dialog);
			});
		}
		return false;
	},

	setPopupFieldsAction: function(pop){
		var self = this;
		var jdom = pop.$el;

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

		var field_values = {};

		for(var i in fields){
			var field = fields[i];
			field_values[field] = this.getPopupFieldValue(pop, field);
			jdom.find('.'+field+' input').keyup({'pop': pop, 'field': field}, function(evt){
				if(evt.data.field.indexOf('staff_meal_price') == 0){
					if(self.getPopupFieldValue(evt.data.pop, evt.data.field) != field_values[evt.data.field]){
						evt.data.pop.view_form.set_values({'meal_included': true});
						field_values[evt.data.field] = self.getPopupFieldValue(evt.data.pop, evt.data.field);
					}
				}
				self.updatePopupTotalPrice(evt.data.pop);
			});
		}

		// meal checkbox
		jdom.find('.staff_meal_included input').change(pop, function(evt){
			self.updatePopupTotalPrice(evt.data);
		});

		// meal observation for the checkbox
		var old_field_value = self.getPopupFieldValue(pop, 'staff_meal_observation');
		jdom.find('.staff_meal_observation textarea').keyup(pop, function(evt){
			if($(this).val() != old_field_value){
				evt.data.view_form.set_values({'meal_included': true});
				old_field_value = $(this).val();
			}
		});

	},

	updatePopupTotalPrice: function(pop){
		var totalPrice = 0;

		var nbr_adult = this.getPopupFieldValue(pop, 'staff_nbr_adult');
		var price_adult = this.getPopupFieldValue(pop, 'staff_price_adult');
		totalPrice += nbr_adult * price_adult;

		var nbr_child = this.getPopupFieldValue(pop, 'staff_nbr_child');
		var price_child = this.getPopupFieldValue(pop, 'staff_price_child');
		totalPrice += nbr_child * price_child;

		var nbr_wheelchair = this.getPopupFieldValue(pop, 'staff_nbr_wheelchair');
		var price_wheelchair = this.getPopupFieldValue(pop, 'staff_price_wheelchair');
		totalPrice += nbr_wheelchair * price_wheelchair;

		if(pop.$el.find('.staff_meal_included input').is(':checked')){
			var meal_price_adult = this.getPopupFieldValue(pop, 'staff_meal_price_adult');
			totalPrice += nbr_adult * meal_price_adult;

			var meal_price_child = this.getPopupFieldValue(pop, 'staff_meal_price_child');
			totalPrice += nbr_child * meal_price_child;
		}

		pop.view_form.set_values({'total_price': totalPrice});
	},

	getPopupFieldValue: function(pop, fieldClass){
		var val = parseFloat(pop.$el.find('.'+fieldClass+' input').val());
		if(isNaN(val)){
			return 0;
		}
		return val;
	},
});

core.view_registry.add('calendar_booking', BookingCalendar);

return BookingCalendar;
});
