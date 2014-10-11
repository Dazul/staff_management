openerp_staff_management_timecheck = function(instance) {
	var _t = instance.web._t; // For text translations
	
	instance.web.views.add('calendar_timecheck', 'instance.staff_management.TimeCheck');
	
	instance.staff_management.TimeCheck = instance.staff_management.Scheduler.extend({


		init:function(parent, dataset, view_id, options){
			var self = this;
			var views = new instance.web.Model('ir.ui.view');
			views.query('id').filter([['model', '=', 'staff.scheduler'], ['name', '=', 'timecheck_popup']]).first().then(function(result){
				self.form_timecheck_id = result.id;
			});	
			this._super.apply(this, arguments);	
		},

		get_range_domain: function(domain, start, end) {
			var format = instance.web.date_to_str;
			
			extend_domain = [
				[this.date_field, '>=', format(start.clone())],
				[this.date_field, '<=', format(end.clone())],
				['task_id', '!=', null]
			];

			return new instance.web.CompoundDomain(domain, extend_domain);
		},


		renderCell: function(td, cellDataList){
			var self = this;
			if(cellDataList.length == 1){
				var evt = cellDataList[0].event;
				if(evt.confirm){
					td.addClass('staff_assigned');
					td.text(self.format_hour(evt.work_time));
					td.addClass('clickable');
					td.mouseenter(evt, function(evt){
						instance.staff_management.tooltip.show($(this), self.get_tooltip_content(evt.data));
					}).mouseleave(instance.staff_management.tooltip.hide);
				}
				else if(evt.task_id){
					td.addClass('staff_available');
					td.text(self.format_hour(evt.hour_from)+' à '+self.format_hour(evt.hour_to));
					td.addClass('clickable');
					td.mouseenter(evt, function(evt){
						instance.staff_management.tooltip.show($(this), self.get_tooltip_content(evt.data));
					}).mouseleave(instance.staff_management.tooltip.hide);
				}
			}
			return td;
		},

		get_tooltip_content: function(event){
			var div = $('<div>');
			div.append($('<div>').text(this.format_hour(event.hour_from)+' - '+this.format_hour(event.hour_to)+' ('+_t('duration')+' '+this.format_hour_duration(event.hour_from, event.hour_to)+')'));
			div.append($('<div>').text(event.task_id[1]));
			if(event.confirm){
				div.append($('<div>').text(_t("Entered:")+' '+this.format_hour(event.work_time)));
			}
			else{
				div.append($('<div>').text(_t("No hour entered")+' ('+this.format_hour(event.work_time)+')'));
			}
			if(event.comment){
				div.append($('<div>').text(event.comment));
			}
			return div;
		},

		cellClicked: function(lineID, date, cellDataList){
			var self = this;
			if(cellDataList.length == 1){
				var evt = cellDataList[0].event;
				if(evt.task_id){
					var pop = new instance.web.form.FormOpenPopup(this);
					pop.show_element(this.dataset.model, evt.id, this.dataset.get_context(), {
						title: _t("Edit working time"),
						view_id: this.form_timecheck_id,
						res_id: evt.id,
						target: 'new',
						readonly:false,
						write_function: function(id, data, _options) {
							return self.dataset.write(id, data, {}).done(function() {
								self.refresh_events();
							});
						},
					});

					
				}
			}
		},


	});
}
