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
					self.toggle_availabilities(event.start, event.start);
				},
				select: function (start_date, end_date, all_day, _js_event, _view) {
					self.toggle_availabilities(start_date, end_date);
				},
				eventRender: function(event, element) {			        
					var strDate = $.fullCalendar.formatDate(event.start, "yyyy-MM-dd");
					$('.fc-day[data-date|="'+strDate+'"]').addClass('staff_available');
					// TODO display event when there is a task
					element.css({'display': 'none'});
				},
				eventDestroy: function(event, element, view){
					var strDate = $.fullCalendar.formatDate(event.start, "yyyy-MM-dd");
					$('.fc-day[data-date|="'+strDate+'"]').removeClass('staff_available');
				}
			});
		},
		
		toggle_availabilities: function(start_date, end_date){
			
			
			//start_day = new Date(Date.UTC(start_date.getFullYear(),start_date.getMonth(),start_date.getDate()));
			start_day = start_date;
			stop_day = end_date;
			if (end_date == null || _.isUndefined(end_date)) {
				stop_day = start_day;
			}
			//stop_day = new Date(Date.UTC(end_date.getFullYear(),end_date.getMonth(),end_date.getDate()));
			
			
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
				this.remove_event(parseInt(eventData.id)).then(function(){
					var strDate = $.fullCalendar.formatDate(eventData.start, "yyyy-MM-dd");
					self.$calendar.fullCalendar('unselect');
					$('.fc-day[data-date|="'+strDate+'"]').removeClass('staff_available');
				});
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
					var strDate = $.fullCalendar.formatDate(date, "yyyy-MM-dd");
					$('.fc-day[data-date|="'+strDate+'"]').removeClass('staff_available');
					self.$calendar.fullCalendar('unselect');
				});
			
		},
		
		
	});
	
	
};