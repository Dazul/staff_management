openerp_staff_management_calendar = function(instance) {
	var _t = instance.web._t;

	function get_fc_defaultOptions() {
        shortTimeformat = Date.CultureInfo.formatPatterns.shortTime;
        return {
            weekNumberTitle: _t("W"),
            allDayText: _t("All day"),
            buttonText : {
                today:    _t("Today"),
                month:    _t("Month"),
                week:     _t("Week"),
                day:      _t("Day")
            },
            monthNames: Date.CultureInfo.monthNames,
            monthNamesShort: Date.CultureInfo.abbreviatedMonthNames,
            dayNames: Date.CultureInfo.dayNames,
            dayNamesShort: Date.CultureInfo.abbreviatedDayNames,
            firstDay: Date.CultureInfo.firstDayOfWeek,
            weekNumbers: false,
            axisFormat : shortTimeformat.replace(/:mm/,'(:mm)'),
            timeFormat : {
               // for agendaWeek and agendaDay               
               agenda: shortTimeformat + '{ - ' + shortTimeformat + '}', // 5:00 - 6:30
                // for all other views
                '': shortTimeformat.replace(/:mm/,'(:mm)')  // 7pm
            },
            weekMode : 'liquid',
            aspectRatio: 1.8,
            snapMinutes: 15,
        };
    }

	instance.staff_management.Calendar = instance.web_calendar.CalendarView.extend({
		init:function(){
			this._super.apply(this,arguments);
		},
		
		// No slidebar
		init_calendar: function() {
            var self = this;
            
            self.$calendar.fullCalendar(self.get_fc_init_options());
            
            return $.when();
        },
		
		get_fc_init_options: function () {
            //Documentation here : http://arshaw.com/fullcalendar/docs/
            var self = this;
            return  $.extend({}, get_fc_defaultOptions(), {
                
                defaultView: "month",
                header: {
                    left: 'prev,next today',
                    center: 'title',
                    right: '' // 'month' Nothing, only one view
                },
                selectable: !this.options.read_only_mode && this.create_right,
                selectHelper: true,
                editable: !this.options.read_only_mode,
                droppable: false,
                disableDragging: true,

                // callbacks

                eventDrop: function (event, _day_delta, _minute_delta, _all_day, _revertFunc) {
                    var data = self.get_event_data(event);
                    self.proxy('update_record')(event._id, data); // we don't revert the event, but update it.
                },
                eventResize: function (event, _day_delta, _minute_delta, _revertFunc) {
                    var data = self.get_event_data(event);
                    self.proxy('update_record')(event._id, data);
                },
                eventRender: function (event, element, view) {
                    element.find('.fc-event-title').html(event.title);
                },
                eventAfterRender: function (event, element, view) {
                    if ((view.name !== 'month') && (((event.end-event.start)/60000)<=30)) {
                        //if duration is too small, we see the html code of img
                        var current_title = $(element.find('.fc-event-time')).text();
                        var new_title = current_title.substr(0,current_title.indexOf("<img")>0?current_title.indexOf("<img"):current_title.length);
                        element.find('.fc-event-time').html(new_title);
                    }
                },
                eventClick: function (event) { self.open_event(event._id,event.title); },
                select: function (start_date, end_date, all_day, _js_event, _view) {
                    var data_template = self.get_event_data({
                        start: start_date,
                        end: end_date,
                        allDay: all_day,
                    });
                    self.open_quick_create(data_template);

                },

                unselectAuto: false,
				height: $('.oe_view_manager_body').height() - 5,
	            handleWindowResize: true,
	            windowResize: function(view) {
			        self.$calendar.fullCalendar('option', 'height', $('.oe_view_manager_body').height() - 5);
			    }

            });
        },
		
		zeroPad: function(num, places) {
			var zero = places - num.toString().length + 1;
			return Array(+(zero > 0 && zero)).join("0") + num;
		}
		
	});

};

/*
openerp_staff_management_calendar = function(instance) {

	instance.staff_management.Calendar = instance.web_calendar.CalendarView.extend({
		
		init:function(parent, dataset, view_id, options){
			$(window).resize(function(){
				h_tot = $(window).height() - $('.announcement_bar').height() - $('.oe_topbar').height() - $('.oe_header_row').height() - $('.staff_management_quick_assign_container').height() - $('.dhx_cal_navline staff_mngmt_special_nav').height() - 20;
				$('.oe_calendar').height(h_tot);
			});
			
			scheduler.xy.bar_height=25;
			
			this.backup.render_data = scheduler.render_data;
			scheduler.old_render_data = scheduler.render_data;
			scheduler.render_data = function(evs, hold){
				scheduler.old_render_data(evs, hold);
				$('.dhx_cal_event_clear span').trunk8();
			}
			
			// call parent init function
			this._super.apply(this, arguments);
		},
		
		destroy:function(){
			scheduler.render_data = this.backup.render_data;
			this._super();
		},
		
		// Load the tooltip
		load_calendar: function(data) {
			h_tot = $(window).height() - $('.announcement_bar').height() - $('.oe_topbar').height() - $('.oe_header_row').height() - $('.staff_management_quick_assign_container').height() - $('.dhx_cal_navline staff_mngmt_special_nav').height() - 20;
			$('.oe_calendar').height(h_tot);
			this._super.apply(this,arguments);
			this.init_staff_tooltip();
		},
		
		// Get the event under the mouse
		staff_get_event: function(e){
			var date = scheduler.getActionData(e).date;
			var events = scheduler.getEvents(date,scheduler.date.add(date,1,"day"));
			if(events.length > 0){
				return events[0];
			}	
			return false;
		},
		
		
		
		// Init tooltip
		init_staff_tooltip: function(){
			var self = this;
			this.has_been_loaded.then(function(){
				// hide tooltip when mouse on it
				$('.staff_tooltip').bind('mouseover', function(e){
					 $('.staff_tooltip').css({
						 display: 'none'
					 });
				});
				dhtmlxEvent(scheduler._els["dhx_cal_data"][0], "mouseover", function(e){
					display = false;
					if (self.staff_get_event(e)){
						var e = e || event;
						var src = e.target||e.srcElement;
						var evt = self.staff_get_event(e);
						
						if(evt){
							if($(src).parent().hasClass('staff_tooltip_show')){
								src = $(src).parent();
							}
							if($(src).hasClass('staff_tooltip_show')){
								// display tooltip
								display = true;
								position = $(src).offset();
								self.set_staff_tooltip_content(evt);
								
								var left = position.left + $(src).width()/2 - $('.staff_tooltip').width()/2;
								if(left + $('.staff_tooltip').width() + 15 > $(window).width()){
									left = $(window).width() - $('.staff_tooltip').width() - 15;
								}
								
								$('.staff_tooltip').css({
									left:  left,
									top:   position.top - $('.staff_tooltip').height() - 10,
									display: 'block',
									visibility: 'visible',
								});
							}
						}	
					}
					else{
						var e = e || event;
						var src = e.target||e.srcElement;
						
						if($(src).parent().hasClass('staff_tooltip_show')){
							src = $(src).parent();
						}
						if($(src).hasClass('staff_tooltip_show')){
							var isTooltip = self.set_staff_tooltip_content_no_event(src);
							if(isTooltip){
								display = true;
								position = $(src).offset();
								
								var left = position.left + $(src).width()/2 - $('.staff_tooltip').width()/2;
								if(left + $('.staff_tooltip').width() + 15 > $(window).width()){
									left = $(window).width() - $('.staff_tooltip').width() - 15;
								}
								
								$('.staff_tooltip').css({
									left:  left,
									top:   position.top - $('.staff_tooltip').height() - 10,
									display: 'block',
									visibility: 'visible',
								});
							}
						}
					}
					// hide tooltip if not displayed
					if(!display){
						$('.staff_tooltip').css({
							display: 'none'
						});
					}
				});
				
			});
		},
		
		set_staff_tooltip_content_no_event: function(src){
			return false;
		},
		
		set_staff_tooltip_content: function(evt){
			comment = evt.comment ? evt.comment : '';
			$('.staff_tooltip').html('<div>'+this.convert_hour(evt.hour_from)+' - '+this.convert_hour(evt.hour_to)+'</div>'+
				'<div>'+evt.task[1]+'</div>'+
				'<div>'+comment+'</div>'
			);
		},
	
		// Format number for hour
		FormatNumberLength: function(num, length) {
			var r = "" + num;
			while (r.length < length) {
				r = "0" + r;
			}
			return r;
		},
	
		// convert hour from 9.5 to 09:30
		convert_hour: function(hour){
			hour = parseFloat(hour);
			if(hour == undefined || isNaN(hour)){
				return '00:00';
			}
			var h = Math.floor(hour);          
			var m = Math.round((hour-h) * 60);
			return this.FormatNumberLength(h, 2)+':'+this.FormatNumberLength(m, 2);
		},
		
		convert_hour_duration: function(hour_start, hour_end){
			hour_start = parseFloat(hour_start);
			hour_end = parseFloat(hour_end);
			if(isNaN(hour_start)){
				hour_start = 0;
			}
			if(isNaN(hour_end)){
				hour_end = 0;
			}
			return this.convert_hour(hour_end-hour_start);
		},
	
		
		// convert an event from databse to an event for the DHTMLXscheduler
		convert_event: function(evt) {
			var date_start = instance.web.str_to_datetime(evt[this.date_start]),
				date_stop = this.date_stop ? instance.web.str_to_datetime(evt[this.date_stop]) : null,
				date_delay = evt[this.date_delay] || 1.0,
				res_text = '';
			
			// remove hours
			//date_start = instance.web.str_to_datetime(date_start.toString('yyyy-MM-dd')+' 00:00:00');
						
			// remove timezone offset
			//date_start.addHours(date_start.getTimezoneOffset()/60);
						
			if (this.info_fields) {
				res_text = _.map(this.info_fields, function(fld) {
					if(evt[fld] instanceof Array)
						return evt[fld][1];
					return evt[fld];
				});
			}
			date_stop = date_start.clone();
			
			
			var user_id = evt.user_id.join(',').split(',',1);
			
			var r = {
				'start_date': date_start.toString('yyyy-MM-dd'),
				'end_date': date_stop.toString('yyyy-MM-dd'),
				'text': res_text.join(', '),
				'id': evt.id,
				'user_id': user_id,
				'task': evt.task_id,
				'comment': evt.comment,
				'work_time': evt.work_time,
				'confirm': evt.confirm
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
	});

};
*/