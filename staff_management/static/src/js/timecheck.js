odoo.define('staff_management.SalaryTimeline', function (require) {
"use strict";

var core = require('web.core');
var data = require('web.data');
var time = require('web.time');
var Model = require('web.DataModel');
var Scheduler = require('staff_management.Scheduler');

var CompoundDomain = data.CompoundDomain;

var _t = core._t;

var TimeCheck = Scheduler.extend({

	init:function(parent, dataset, view_id, options){
		var self = this;
		var views = new Model('ir.ui.view');
		views.query('id').filter([['model', '=', 'staff.scheduler'], ['name', '=', 'timecheck_popup']]).first().then(function(result){
			self.form_timecheck_id = result.id;
		});	
		this._super.apply(this, arguments);	
		this.set_nbrOfHeaderLines(1);
		this.loadSchedulerData = false;
	},

	get_range_domain: function(domain, start, end) {
		var format = time.date_to_str;
		
		var extend_domain = [
			[this.date_field, '>=', format(start)],
			[this.date_field, '<=', format(end)],
			['task_id', '!=', null]
		];

		return new CompoundDomain(domain, extend_domain);
	},


	renderCellLeft: function(th, data){
		return th.append($('<span>').text(data['username']));
	},

	renderCell: function(td, cellDataList){
		var self = this;
		if(cellDataList.length == 1){
			var evt = cellDataList[0].event;
			if(evt.confirm){
				td.addClass('staff_assigned');
				td.text(self.format_hour(evt.work_time));
				td.addClass('clickable');
				// TODO - Refactor Tooltip
				/*
				td.mouseenter(evt, function(evt){
					instance.staff_management.tooltip.show($(this), self.get_tooltip_content(evt.data));
				}).mouseleave(instance.staff_management.tooltip.hide);
				*/
			}
			else if(evt.task_id){
				td.addClass('staff_available');
				td.text(self.format_hour(evt.hour_from)+' à '+self.format_hour(evt.hour_to));
				td.addClass('clickable');
				// TODO - Refactor Tooltip
				/*
				td.mouseenter(evt, function(evt){
					instance.staff_management.tooltip.show($(this), self.get_tooltip_content(evt.data));
				}).mouseleave(instance.staff_management.tooltip.hide);
				*/
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
		// TODO - Check how to use FormOpenPopup
		alert('not ready');
		/*
		var self = this;
		if(cellDataList.length == 1){
			var evt = cellDataList[0].event;
			
			if(this.isQuickAssignEnabled()){
				this.apply_quickAssignToEvent(evt);
				return;
			}
			
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
		*/
	},
	
	apply_quickAssignToEvent: function(event){
		var self = this;
		var data = {
			'work_time': this.quick_asign_work_time.get_value(),
			'confirm': true,
		};
		this.dataset.write(event.id, data, {}).done(function() {
			instance.staff_management.tooltip.hide();
			self.refresh_events();
		});
		
	},
	
	load_quickAssign: function(){
		// TODO - refactor method
		/*
		var self = this;
		
		dfm_mine = new instance.web.form.DefaultFieldManager(this);
		dfm_mine.extend_field_desc({
			quicktask: {
				relation: "account.analytic.account",
			},
		});

		var table = $('<table>').addClass('quickassign');
		var tr = $('<tr>');

		var input = $('<input>').attr('type', 'checkbox').attr('id', 'quickassignInput').addClass('quickassignCheckbox');
		var td = $('<td>').append(input);
		td.append($('<label>').attr('for', 'quickassignInput').text(_t('Quick assign')));
		tr.append(td);

		this.quick_asign_work_time = new instance.web.form.FieldFloat(dfm_mine, // start hour
			{
			attrs: {
				name: "work_time",
				type: "char",
				widget: "float_time",
				domain: [],
				context: {},
				modifiers: '',
				},
			}
		);

		var td_start_title = $('<td>').addClass('text hidden qa_hide').text(_t('Worked time'));
		tr.append(td_start_title);
		var td_start = $('<td>').addClass('hidden qa_hide');
		this.quick_asign_work_time.prependTo(td_start);
		tr.append(td_start);
		
		tr.append($('<td>').css({'width': '50%'}));

		input.click(function(){
			if($(this).is(':checked')){
				$('.quickassign .qa_hide').removeClass('hidden');
			}
			else{
				$('.quickassign .qa_hide').addClass('hidden');
				self.quick_asign_work_time.set_value(""); // reset task selection when quit quick assign
			}
		});

		table.append(tr);
		$('.stimeline_header').append(table);
		*/
	},

});

core.view_registry.add('calendar_timecheck', TimeCheck);

return TimeCheck;
});
