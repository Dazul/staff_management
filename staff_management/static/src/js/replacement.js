odoo.define('staff_management.Replacement', function (require) {
"use strict";

var core = require('web.core');
var GeneralScheduler = require('staff_management.GeneralScheduler');
var Model = require('web.DataModel');
var time = require('web.time');

var _t = core._t;


var Replacement = GeneralScheduler.extend({
	do_search: function(domain, context, _group_by) {
		var self = this;
		this.lastSearch = {
			'domain': domain,
			'context': context,
			'_group_by': _group_by
		};

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

			self.update_datas(lines);

		});
	},

	set_button_actions: function(){
		this._super.apply(this, arguments);
		this.$('.fc-export-buttons').css({'display': 'none'});
	},

	renderCell: function(td, cellDataList){
		td = this._super.apply(this,arguments);
		if(cellDataList.length == 1){
			td.addClass('clickable');
		}
		return td;
	},

	cellClicked: function(lineID, date, cellDataList){
		var self = this;
		if(cellDataList.length == 1){
			if (confirm(_t("Do you really want to replace this task ?"))) {
				var task_id = cellDataList[0].event.id;
				var model = new Model("staff.scheduler");
				model.call("swapUidTask",[task_id]).then(function(res){
					self.refresh_events();
				});
			}
		}
	},
});

core.view_registry.add('replacement', Replacement);

return Replacement;
});
