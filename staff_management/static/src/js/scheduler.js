odoo.define('staff_management.Scheduler', function (require) {
"use strict";

var core = require('web.core');
var time = require('web.time');
var Model = require('web.DataModel');
var form_common = require('web.form_common');
var GeneralScheduler = require('staff_management.GeneralScheduler');

var form_common = require('web.form_common');

var _t = core._t;

var Scheduler = GeneralScheduler.extend({
	init:function(parent, dataset, view_id, options){
		this._super.apply(this, arguments);

		this.set_nbrOfHeaderLines(2);
		this.loadSchedulerData = true;
	},

	update_datas: function(datas, original){
		if(!this.loadSchedulerData || original){
			var ret = this._super.apply(this, arguments);
			if(this.isQuickAssignEnabled() && this.quick_asign){
				this.quick_asign.applyQuickAssign();
			}
			return ret;
		}

		var self = this;
		var def_workratio = $.Deferred();
		var def_booking = $.Deferred();

		// Get number of assigned on number of availabilities for the month of this.range_start

		var list_userID = [];
		this.work_ratio = {};
		for(var i in datas){
			list_userID.push(datas[i].lineID);
			this.work_ratio[i] = [5,10];
		}
		var date_from = new Date(this.range_start.getFullYear(), this.range_start.getMonth(), 1);
		var date_to = new Date(this.range_start.getFullYear(), this.range_start.getMonth() + 1, 0);
		var model = new Model("staff.scheduler");
		model.call("countActivitie",[list_userID, time.date_to_str(date_from), time.date_to_str(date_to)]).then(function(res){
			self.work_ratio = {};
			for(var i in res){
				self.work_ratio[i] = res[i];
			}
			def_workratio.resolve();
		});

		// Get the number of people in reservation for each days between this.range_start and this.range_stop

		var list_dates = [];
		this.booking_numbers = {};
		for(var d = new Date(this.range_start) ; d<=this.range_stop ; d = this.getNextDate(d)){
			list_dates.push(time.date_to_str(d));
			this.booking_numbers[d] = 10;
		}
		var booking = new Model('staff.booking');

		booking.call("count_nbr_people",list_dates).then(function(res) {
			self.booking_numbers = {};
			for(var d = new Date(self.range_start) ; d<=self.range_stop ; d = self.getNextDate(d)){
				self.booking_numbers[d] = res[time.date_to_str(d)];
			}
			def_booking.resolve();
		});

		// Call the super method when all new data are loaded
		$.when(def_workratio, def_booking).then(function(){
			self.update_datas(datas, true);
		});
	},

	set_button_actions: function(){
		this._super.apply(this, arguments);
		this.$('.fc-export-buttons').css({'display': 'none'});
	},

	renderHeaderCellLeft: function(th, lineID){
		if(lineID == 1){
			return th.text('Utilisateur');
		}
		else if(lineID == 2){
			return th.text('Réservations');
		}
	},

	renderHeaderCell: function(th, lineID, cdate){
		if(lineID == 1){
			th.text(this.format_date(cdate, "ddd dd MMM"));
		}
		else if(lineID == 2){
			return th.addClass('light-weight').text(this.booking_numbers[cdate]);
		}
		return th;
	},

	renderCellLeft: function(th, data){
		var userID = data.lineID;
		return th.append($('<span>').text(data['username'])).append($('<span>').addClass('light-weight').text(' '+this.work_ratio[userID][0]+'/'+this.work_ratio[userID][1]));
	},

	renderCell: function(td, cellDataList){
		td = this._super.apply(this,arguments);
		if(cellDataList.length == 1){
			var userID = cellDataList[0].event.user_id[0];
			td.addClass('clickable evt_user_'+userID);
		}
		return td;
	},

	cellClicked: function(lineID, date, cellDataList){
		var self = this;
		if(cellDataList.length == 1){

			if(this.isQuickAssignEnabled()){
				if(this.quick_asign.isUserIDAuthorized(cellDataList[0].event.user_id[0]) == true){
					this.apply_quickAssignToEvent(cellDataList[0].event);
				}
				return;
			}

			var evt = cellDataList[0]['event'];

			var dialog = new form_common.FormViewDialog(this, {
				res_model: this.dataset.model,
				res_id: evt.id,
				context: this.dataset.get_context(),
				title: _t("Edit Assignment"),
				view_id: +this.open_popup_action,
				readonly: false,
				buttons: [
					{text: _t("Save"), classes: 'btn-primary', close: true, click: function() {
						this.view_form.save();
					}},
					{text: _t("Remove"), close: true, click: function() {
						self.dataset.write(evt.id, {'task_id': false}, {}).done(function() {
							self.refresh_events();
						});
					}},
					{text: _t("Close"), close: true}
				],
				write_function: function(id, data, _options) {
					return self.dataset.write(id, data, {}).done(function() {
						self.refresh_events();
					});
				}
			}).open();
		}
	},

	view_loading: function (fv) {
		this._super.apply(this, arguments);
		this.load_quickAssign();
	},

	apply_quickAssignToEvent: function(event){
		var self = this;
		var data = {
			'task_id': this.quick_asign.get_value(),
			'hour_from': this.quick_asign_hour_start.get_value(),
			'hour_to': this.quick_asign_hour_stop.get_value(),
		};
		this.dataset.write(event.id, data, {}).done(function() {
			//instance.staff_management.tooltip.hide();
			self.refresh_events();
		});
	},

	isQuickAssignEnabled: function(){
		return this.$('.quickassignCheckbox').is(':checked');
	},

	load_quickAssign: function(){
		var self = this;

		var table = $('<table>').addClass('quickassign');
		var tr = $('<tr>');

		var input = $('<input>').attr('type', 'checkbox').attr('id', 'quickassignInput').addClass('quickassignCheckbox');
		var td = $('<td>').append(input);
		td.append($('<label>').attr('for', 'quickassignInput').text(_t('Quick assign')));
		tr.append(td);

		var dfm_mine = new form_common.DefaultFieldManager(self);
		dfm_mine.extend_field_desc({
			quicktask: {
				relation: "account.analytic.account",
			},
		});

		var QuickAssignFloat = core.form_widget_registry.get('quick_assign');
		this.quick_asign = new QuickAssignFloat(dfm_mine, // task select
			{
			attrs: {
				name: "quicktask",
				type: "many2one",
				widget: "many2one",
				domain: [],
				context: {},
				modifiers: '',
				},
			}
		);

		var td_task_title = $('<td>').addClass('text hidden qa_hide').text(_t('Task'));
		tr.append(td_task_title);
		var td_task = $('<td>').addClass('taskcell hidden qa_hide');
		this.quick_asign.prependTo(td_task);
		tr.append(td_task);

		var FieldFloat = core.form_widget_registry.get('float');

		this.quick_asign_hour_start = new FieldFloat(dfm_mine, // start hour
			{
			attrs: {
				name: "hour_start",
				type: "char",
				widget: "float_time",
				domain: [],
				context: {},
				modifiers: '',
				},
			}
		);

		var td_start_title = $('<td>').addClass('text hidden qa_hide').text(_t('Start hour'));
		tr.append(td_start_title);
		var td_start = $('<td>').addClass('hidden qa_hide');
		this.quick_asign_hour_start.prependTo(td_start);
		tr.append(td_start);

		this.quick_asign_hour_stop = new FieldFloat(dfm_mine, // end hour
			{
			attrs: {
				name: "hour_start",
				type: "char",
				widget: "float_time",
				domain: [],
				context: {},
				modifiers: '',
				},
			}
		);

		var td_end_title = $('<td>').addClass('text hidden qa_hide').text(_t('End hour'));
		tr.append(td_end_title);
		var td_end = $('<td>').addClass('hidden qa_hide');
		this.quick_asign_hour_stop.prependTo(td_end);
		tr.append(td_end);



		input.click(function(){
			if($(this).is(':checked')){
				$('.quickassign .qa_hide').removeClass('hidden');
			}
			else{
				$('.quickassign .qa_hide').addClass('hidden');
				self.quick_asign.set_value(""); // reset task selection when quit quick assign
			}
		});

		table.append(tr);
		this.$('.stimeline_header').append(table);
	}
});

core.view_registry.add('calendar_scheduler', Scheduler);

return Scheduler;
});
