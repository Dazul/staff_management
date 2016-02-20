odoo.define('staff_management.StaffCalendar', function (require) {
"use strict";

var core = require('web.core');
var time = require('web.time');
var CalendarView = require('web_calendar.CalendarView');

var _t = core._t;

// TODO - Check differences between old get_fc_defaultOptions & new
/*
function get_fc_defaultOptions() {
	shortTimeformat = Date.CultureInfo.formatPatterns.shortTime;
	return {
		weekNumberTitle: _t("W"),
		allDayText: _t("All day"),
		buttonText : {
			today:	_t("Today"),
			month:	_t("Month"),
			week:	_t("Week"),
			day:	_t("Day")
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
*/

function get_fc_defaultOptions() {
    var dateFormat = time.strftime_to_moment_format(_t.database.parameters.date_format);

    // adapt format for fullcalendar v1.
    // see http://fullcalendar.io/docs1/utilities/formatDate/
    var conversions = [['YYYY', 'yyyy'], ['YY', 'y'], ['DDDD', 'dddd'], ['DD', 'dd']];
    _.each(conversions, function(conv) {
        dateFormat = dateFormat.replace(conv[0], conv[1]);
    });

    return {
        weekNumberTitle: _t("W"),
        allDayText: _t("All day"),
        buttonText : {
			today:	_t("Today"),
			month:	_t("Month"),
			week:	_t("Week"),
			day:	_t("Day")
		},
        monthNames: moment.months(),
        monthNamesShort: moment.monthsShort(),
        dayNames: moment.weekdays(),
        dayNamesShort: moment.weekdaysShort(),
        firstDay: moment._locale._week.dow,
        weekNumbers: true,
        titleFormat: {
            month: 'MMMM yyyy',
            week: "W",
            day: dateFormat,
        },
        columnFormat: {
            month: 'ddd',
            week: 'ddd ' + dateFormat,
            day: 'dddd ' + dateFormat,
        },
        weekMode : 'liquid',
        snapMinutes: 15,
    };
}


var StaffCalendar = CalendarView.extend({

	color_palette: [
		'#804040',
		'#008080',
		'#004080',
		'#8080FF',
		'#800040',
		'#FF0080',
		'#804000',
		'#FF8000',
		'#008000',
		'#008040',
		'#0000FF',
		'#000040',
		'#800080',
		'#8000FF',
		'#400040',
		'#808000',
		'#004040',
		'#800000'
	],

	init:function(){
		this._super.apply(this,arguments);
	},
	
	// No slidebar
	init_calendar: function() {
		var self = this;
		
		self.$calendar.fullCalendar(self.get_fc_init_options());

		$('.fc-button-next').empty().text('Mois').append($('<span>').addClass('fc-text-arrow').text('»'));
		$('.fc-button-prev').empty().append($('<span>').addClass('fc-text-arrow').text('«')).append('Mois');
		
		return $.when();
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
	format_hour: function(hour){
		hour = parseFloat(hour);
		if(hour == undefined || isNaN(hour)){
			return '00:00';
		}
		var h = Math.floor(hour);          
		var m = Math.round((hour-h) * 60);
		return this.FormatNumberLength(h, 2)+':'+this.FormatNumberLength(m, 2);
	},
	
	format_hour_duration: function(hour_start, hour_end){
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
	
	get_fc_init_options: function () {
		//Documentation here : http://arshaw.com/fullcalendar/docs/
		var self = this;
		return  $.extend({}, get_fc_defaultOptions(), {
			
			defaultView: "month",
			header: {
				left: 'prev,today,next',
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


return StaffCalendar;
});

/*
alert('hello');
openerp_staff_management_calendar = function(instance) {
	var _t = instance.web._t;

	function get_fc_defaultOptions() {
		shortTimeformat = Date.CultureInfo.formatPatterns.shortTime;
		return {
			weekNumberTitle: _t("W"),
			allDayText: _t("All day"),
			buttonText : {
				today:	_t("Today"),
				month:	_t("Month"),
				week:	_t("Week"),
				day:	_t("Day")
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

		color_palette: [
			'#804040',
			'#008080',
			'#004080',
			'#8080FF',
			'#800040',
			'#FF0080',
			'#804000',
			'#FF8000',
			'#008000',
			'#008040',
			'#0000FF',
			'#000040',
			'#800080',
			'#8000FF',
			'#400040',
			'#808000',
			'#004040',
			'#800000'
		],

		init:function(){
			this._super.apply(this,arguments);
		},
		
		// No slidebar
		init_calendar: function() {
			var self = this;
			
			self.$calendar.fullCalendar(self.get_fc_init_options());

			$('.fc-button-next').empty().text('Mois').append($('<span>').addClass('fc-text-arrow').text('»'));
			$('.fc-button-prev').empty().append($('<span>').addClass('fc-text-arrow').text('«')).append('Mois');
			
			return $.when();
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
		format_hour: function(hour){
			hour = parseFloat(hour);
			if(hour == undefined || isNaN(hour)){
				return '00:00';
			}
			var h = Math.floor(hour);          
			var m = Math.round((hour-h) * 60);
			return this.FormatNumberLength(h, 2)+':'+this.FormatNumberLength(m, 2);
		},
		
		format_hour_duration: function(hour_start, hour_end){
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
		
		get_fc_init_options: function () {
			//Documentation here : http://arshaw.com/fullcalendar/docs/
			var self = this;
			return  $.extend({}, get_fc_defaultOptions(), {
				
				defaultView: "month",
				header: {
					left: 'prev,today,next',
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

*/