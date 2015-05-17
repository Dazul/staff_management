openerp_staff_management_personal_schedule = function(instance) {
	var _t = instance.web._t; // For text translations
	
	instance.web.views.add('calendar_personal', 'instance.staff_management.PersonalSchedule');
	
	instance.staff_management.PersonalSchedule = instance.staff_management.Calendar.extend({
	
		template: "PersonalScheduleView",
		
		init:function(){
			this._super.apply(this,arguments);
			this.options.confirm_on_delete = false;
		},
		
		// destroy, restore scheduler fonctions
		destroy:function(){
			this._super();
		},
		
		get_fc_init_options: function () {
			//Documentation here : http://arshaw.com/fullcalendar/docs/
			var self = this;
			return  $.extend({}, this._super(), {
				eventClick: function (event){
					self.toggle_replacement(event);
				},
				select: function (start_date, end_date, all_day, _js_event, _view) {
					self.toggle_availabilities(start_date, end_date);
				},
				eventRender: function(event, element) {
					var strDate = $.fullCalendar.formatDate(event.start, "yyyy-MM-dd");
					$('.fc-day[data-date|="'+strDate+'"]').addClass('staff_available');
					if(event.task_id){

						color = self.color_palette[event.task_id[0]%self.color_palette.length];

						replacementText = '';
						if(event.replaceable){
							replacementText = _t('Waiting replacement');
						}

						element.html('<div>'+self.format_hour(event.hour_from)+' '+event.task_id[1]+'</div>'+'<div>'+replacementText+'</div>');
						element.css({'background': color});
						element.css({'border-color': color});
						element.mouseenter(event, function(evt){
							instance.staff_management.tooltip.show($(this), self.get_tooltip_content(evt.data));
						}).mouseleave(instance.staff_management.tooltip.hide);
					}else{
						element.css({'display': 'none'});
					}
				},
				eventDestroy: function(event, element, view){
					var strDate = $.fullCalendar.formatDate(event.start, "yyyy-MM-dd");
					$('.fc-day[data-date|="'+strDate+'"]').removeClass('staff_available');
				}
			});
		},
		
		get_tooltip_content: function(event){

			var div = $('<div>');
			div.append($('<div>').text(this.format_hour(event.hour_from)+' - '+this.format_hour(event.hour_to)));
			div.append($('<div>').text(event.task_id[1]));
			if(event.comment){
				div.append($('<div>').text(event.comment));
			}

			return div;
		},

		toggle_availabilities: function(start_date, end_date){
			start_day = start_date;
			stop_day = end_date;
			if (end_date == null || _.isUndefined(end_date)) {
				stop_day = start_day;
			}			
			
			for (var d=start_day; d<=stop_day; d.setDate(d.getDate() + 1)){
				this.toggle_availability(d);
			}
		},
		
		toggle_availability: function(date){
			var self = this;
		
			var isAlreadyAnEvent = false;
			var eventData = {};
			this.$calendar.fullCalendar('clientEvents', function(event) {
				var d1 = $.fullCalendar.formatDate(event.start, "yyyy-MM-dd");
				var d2 = $.fullCalendar.formatDate(date, "yyyy-MM-dd");
				if(d1 == d2){
					isAlreadyAnEvent = true;
					eventData = event;
				}
			});
			
			if(isAlreadyAnEvent){
				if(eventData.task_id){
					this.toggle_replacement(eventData);
					return;
				}
				this.remove_availability(eventData);
				return;  
			}
						
			data = {
				date: $.fullCalendar.formatDate(date, "yyyy-MM-dd"),
				name: "Available"
			};
			
				
			this.dataset.create(data)
				.then(function(id) {
					self.refresh_event(id);
					self.$calendar.fullCalendar('unselect');
				}).fail(function(r, event) {				
					if(self.quick_create_error){
						event.preventDefault(); // don't show multiple warning messages
					}
					else{
						self.quick_create_error = true;
						setTimeout(function(){self.quick_create_error = false},200);
					}
					self.$calendar.fullCalendar('unselect');
				});
			
		},

		event_data_transform: function(evt) {
			var r = this._super.apply(this,arguments);
			r.task_id = evt.task_id;
			r.comment = evt.comment;
			r.hour_from = evt.hour_from;
			r.hour_to = evt.hour_to;
			r.replaceable = evt.replaceable;
			return r;
		},

		remove_availability: function(eventData) {
			var self = this;
			this.dataset.unlink([eventData.id]).then(function() {
				self.$calendar.fullCalendar('removeEvents', eventData.id);
				var strDate = $.fullCalendar.formatDate(eventData.start, "yyyy-MM-dd");
				self.$calendar.fullCalendar('unselect');
				$('.fc-day[data-date|="'+strDate+'"]').removeClass('staff_available');
			}).fail(function(r, event) {				
				if(self.quick_create_error){
					event.preventDefault(); // don't show multiple warning messages
				}
				else{
					self.quick_create_error = true;
					setTimeout(function(){self.quick_create_error = false},200);
				}
				self.$calendar.fullCalendar('unselect');
			});
		},

		toggle_replacement: function(eventData){
			this.update_record(eventData.id, {'replaceable': !eventData.replaceable});
		},
		
		
	});
	
	
};