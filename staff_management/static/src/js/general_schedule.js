odoo.define('staff_management.GeneralScheduler', function (require) {
"use strict";

var core = require('web.core');
var data = require('web.data');
var time = require('web.time');
var Model = require('web.DataModel');
var Timeline = require('staff_management.Timeline');
var Tooltip = require('staff_management.Tooltip');

var CompoundDomain = data.CompoundDomain;

var _t = core._t;


var GeneralScheduler = Timeline.extend({
	user_information: {},

	init:function(parent, dataset, view_id, options){
		this._super.apply(this, arguments);

		this.dataset = dataset;

		this.view_id = view_id;
		this.view_type = 'calendar';

		this.set_interval('day', 1);
		this.set_nbrOfHeaderLines(1);

		var now = new Date();
		var firstday = this.get_week_start(now);
		var lastday = new Date(firstday.getFullYear(), firstday.getMonth(), firstday.getDate() + 6);

		this.set_range_dates(firstday, lastday);
	},

	get_range_domain: function(domain, start, end) {
		var format = time.date_to_str;

		var extend_domain = [[this.date_field, '>=', format(start)],
				 [this.date_field, '<=', format(end)]];

		return new CompoundDomain(domain, extend_domain);
	},

	do_search: function(domain, context, _group_by) {
		this._super.apply(this, arguments);
		var self = this;

		this.dataset.read_slice(_.keys(this.fields), {
			offset: 0,
			domain: this.get_range_domain(domain, this.range_start, this.range_stop),
			context: context,
		}).done(function(events) {

			var lines = {};

			_.each(events, function(e){

				var event_date = time.auto_str_to_date(e[self.date_field]);

				var event_data = {
					'date': event_date,
					'event': e,
				};

				var lid = e['user_id'][0];
				if(lid in lines){
					lines[lid]['cells'].push(event_data);
				}
				else{
					lines[lid] = {
						'cells': [event_data],
						'lineID': lid,
						'username': e['user_id'][1],
					};
				}

			});

			if(!context['usershow'] && !context['default_task_id']){
				self.load_all_users(lines, domain);
			}
			else{
				self.update_datas(lines);
			}

		});
	},

	update_datas: function(datas){
		var users_id = [];
		for(var k in datas){
			users_id.push(parseInt(k));
		}
		var self = this;
		var model = new Model("staff.scheduler");
		model.call("getPersonalInfo",[users_id]).then(function(res){
			self.user_information = res;
		});

		this._super.apply(this, arguments);
	},

	load_all_users: function(lines, domain){
		var self = this;
		// load all other users
		var Users = new Model('res.users');
		// check if there is a filter on user
		var user_domain = new Array();
		for(var i=0 ; i<domain.length ; i++){
			if(domain[i][0] == 'user_id'){
				if($.isNumeric(domain[i][2])){
					user_domain.push(['id', domain[i][1], domain[i][2]]);
				}
				else{
					user_domain.push(['name', domain[i][1], domain[i][2]]);
				}
			}
		}
		user_domain.push(['active', '=', true]);

		Users.query(['id', 'name']).filter(user_domain).order_by('name').all().then(function(users){
			for(var i=0 ; i<users.length ; i++){
				var u = users[i];
				if(!(u.id in lines)){
					lines[u.id] = {
						'cells': [],
						'lineID': u.id,
						'username': u.name,
					};
				}
			}
			self.update_datas(lines);
		});

	},

	view_loading: function (fv) {
		this._super.apply(this,arguments);
		var attrs = fv.arch.attrs;
		if (!attrs.date_start) {
			throw new Error("Calendar view has not defined 'date_start' attribute.");
		}

		this.fields = fv.fields;
		this.date_field = attrs.date_start;
	},

	set_button_actions: function(){
		this._super.apply(this, arguments);
		var self = this;

		this.$('.fc-export-buttons').css({'display': 'inline'});

		this.$('.fc-button-export-pdf').click(function(e){
			var d = self.get_export_table_data();
			var title = self.format_date(self.range_start, "dd MMM yyyy");
			title += ' - ' + self.format_date(self.range_stop, "dd MMM yyyy");
			self.generate_pdf(d.columns, d.data, 'l', title);
		});
		this.$('.fc-button-export-pdf-today').click(function(e){
			var d = self.get_export_table_data();
			var date = new Date();
			var week_start = self.get_week_start(date);
			var diff_day = Math.floor((date.getTime() - week_start.getTime())/86400000);
			var column = diff_day + 1;
			columns = [];
			columns.push(d.columns[0]);
			columns.push(d.columns[column]);

			var date = self.get_week_start(new Date());
			date.setDate(date.getDate()+diff_day);
			var title = self.format_date(date, "dd MMM yyyy");
			self.generate_pdf(columns, d.data, 'p', title);
		});
		this.$('.fc-button-export-print').click(function(e){
			window.print();
		});
		this.$('.fc-button-export-print-today').click(function(e){
			var date = new Date();
			var week_start = self.get_week_start(date);
			var diff_day = Math.floor((date.getTime() - week_start.getTime())/86400000);
			var column = diff_day + 1;
			self.generate_export_table(column);
			self.before_print_generated = true; // do not erase print html
			window.print();
		});


	},

	render_timeline: function(){
		var self = this;
		this._super.apply(this, arguments);
		var today = new Date();
		today = new Date(today.getFullYear(), today.getMonth(), today.getDate());
		if(this.range_start <= today && today <= this.range_stop){
			this.$('.fc-button-export-pdf-today').css({'display': 'inline-block'});
			this.$('.fc-button-export-print-today').css({'display': 'inline-block'});
		}
		else{
			this.$('.fc-button-export-pdf-today').css({'display': 'none'});
			this.$('.fc-button-export-print-today').css({'display': 'none'});
		}
	},

	renderCell: function(td, cellDataList){
		var self = this;
		if(cellDataList.length == 1){
			var evt = cellDataList[0].event;

			if(evt.task_id){
				td.addClass('staff_assigned');
				td.text(this.format_hour(evt.hour_from)+' '+evt.task_id[1]);
				td.mouseenter(evt, function(evt){
					Tooltip.show($(this), self.get_tooltip_content(evt.data));
				}).mouseleave(Tooltip.hide);
			}
			else{
				td.addClass('staff_available');
			}

		}
		return td;
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


	renderHeaderCellLeft: function(th, lineID){
		return th.text('Utilisateur');
	},

	renderCellLeft: function(th, data){
		var self = this;

		th.mouseenter(data, function(evt){
			var userID = evt.data.lineID;

			if(self.user_information[userID]){
				var info = self.user_information[userID];

				var mobile = info.mobile;
				if(mobile == false || mobile == 'false'){
					mobile = '-';
				}
				var auths = info.auths.join(', ');
				if(info.auths.length == 0){
					auths = '-';
				}

				Tooltip.show_left($(this), '<div><span style="font-weight: bold;">'+info.name+'</span>'+'</div><div style="height: 130px;"><img src="data:image/png;base64,'+info.image+'"/></div>'+'<div>'+mobile+'</div><div>'+auths+'</div>');
			}

		}).mouseleave(Tooltip.hide);



		return th.text(data['username']);
	},

	renderHeaderCell: function(th, lineID, cdate){
		th.text(this.format_date(cdate, "ddd dd MMM"));
		return th;
	},

	renderTitle: function(elmt, date_start, date_stop){

		var txt = this.format_date(date_start, "dd MMM yyyy");
		txt += ' - ' + this.format_date(date_stop, "dd MMM yyyy");


		elmt.text(txt);
	},

	cellClicked: function(lineID, date, cellDataList){
		// no click action
	},

});

core.view_registry.add('calendar_general', GeneralScheduler);

return GeneralScheduler;
});
