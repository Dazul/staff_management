odoo.define('staff_management.SalaryTimeline', function (require) {
"use strict";

var core = require('web.core');
var data = require('web.data');
var time = require('web.time');
var Model = require('web.DataModel');
var Timeline = require('staff_management.Timeline');
var Tooltip = require('staff_management.Tooltip');

var CompoundDomain = data.CompoundDomain;

var _t = core._t;

var SalaryTimeline = Timeline.extend({

	init:function(parent, dataset, view_id, options){
		this._super.apply(this, arguments);

		this.dataset = dataset;

		this.view_id = view_id;
		this.view_type = 'calendar';

		this.set_interval('day', 1);
		this.set_nbrOfHeaderLines(1);
		this.set_nbrOfRightCells(2);
		this.set_nbrOfFooterLines(1);

		var now = new Date();
		var firstday = new Date(now.getFullYear(), now.getMonth(), 1);
		var lastday = new Date(firstday.getFullYear(), firstday.getMonth() + 1, 0);

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

		this.sumCols = {};

		this.dataset.call("get_month_salaries",[[], this.get_range_domain(domain, this.range_start, this.range_stop)]).then(function(datas) {
			self.datas_loaded(datas);
		});
	},

	datas_loaded: function(datas){
		var lines = {};
		for(uid in datas){
			var eventist = [];
			for(day in datas[uid]){
				eventist.push({
					'date': new Date(this.range_start.getFullYear(), this.range_start.getMonth(), day),
					'event': datas[uid][day],
				});
			}
			lines[uid] = {
				'cells': eventist,
				'lineID': uid,
				'username': datas[uid].name,
			};
		}
		this.update_datas(lines);
	},

	view_loading: function (fv) {
		var self = this;
		this._super.apply(this,arguments);
		var attrs = fv.arch.attrs;
		if (!attrs.date_start) {
			throw new Error("Calendar view has not defined 'date_start' attribute.");
		}

		this.fields = fv.fields;
		this.date_field = attrs.date_start;
	},

	set_button_actions: function() {
		var self = this;
		this.$('.fc-export-buttons').css({'display': 'none'});
		this.$('.fc-button-prev-month').click(function(){
			var firstday = new Date(self.range_start.getFullYear(), self.range_start.getMonth() - 1, 1);
			var lastday = new Date(firstday.getFullYear(), firstday.getMonth()+1, 0);
			self.update_range_dates(firstday, lastday);
		});
		this.$('.fc-button-next-month').click(function(){
			var firstday = new Date(self.range_start.getFullYear(), self.range_start.getMonth() + 1, 1);
			var lastday = new Date(firstday.getFullYear(), firstday.getMonth()+1, 0);
			self.update_range_dates(firstday, lastday);
		});

		this.$('.fc-button-prev-week').css({'display': 'none'});
		this.$('.fc-button-next-week').css({'display': 'none'});

		this.$('.fc-button-today').click(function(){
			if(!$(this).hasClass('fc-state-disabled')){
				var now = new Date();
				var firstday = new Date(now.getFullYear(), now.getMonth(), 1);
				var lastday = new Date(firstday.getFullYear(), firstday.getMonth() + 1, 0);
				self.update_range_dates(firstday, lastday);
			}
		});

	},

	renderTitle: function(elmt, date_start, date_stop){
		elmt.text(this.format_date(date_start, "MMMM yyyy"));
	},

	renderHeaderCellLeft: function(th, lineID){
		return th.text('Utilisateur');
	},

	renderCellLeft: function(th, data){
		return th.append(data['username']);
	},

	renderHeaderCell: function(th, lineID, cdate){
		if(lineID == 1){
			th.append(this.format_date(cdate, "dd"));
		}
		return th;
	},

	addColSum: function(key, sumPositive, sumNegative, sumTimework){
		if(key in this.sumCols){
			this.sumCols[key]['sumPositive'] += sumPositive;
			this.sumCols[key]['sumNegative'] += sumNegative;
			this.sumCols[key]['sumTimework'] += sumTimework;
		}else{
			this.sumCols[key] = {
				'sumPositive': sumPositive,
				'sumNegative': sumNegative,
				'sumTimework': sumTimework,
			};
		}
	},

	renderCell: function(td, cellDataList, date){
		var self = this;
		if(cellDataList.length == 1){
			var data = cellDataList[0].event;

			var sumPositive = 0;
			var sumNegative = 0;
			var sumTimework = 0;

			for(i in data.amounts){
				var amount = data.amounts[i];
				if(amount > 0){
					sumPositive += amount;
				}
				else{
					sumNegative += amount;
				}
			}
			for(i in data.timework){
				sumTimework += parseFloat(data.timework[i]);
			}

			this.renderSalaryCell(td, sumPositive, sumNegative, sumTimework);
			td.addClass('staff_available');
			this.addColSum(date, sumPositive, sumNegative, sumTimework);
		}
		return td;
	},

	renderHeaderCellRight: function(th, lineID, colID){
		return th.text('Solde');
	},

	renderCellRight: function(td, colID, lineData){
		var self = this;
		var sumPositive = 0;
		var sumNegative = 0;
		var sumTimework = 0;
		var cells = lineData.cells;
		for(var i in cells){
			var evt = cells[i].event;
			for(var j in evt.amounts){
				var amount = parseFloat(evt.amounts[j]);
				if(amount > 0){
					sumPositive += amount;
				}
				else{
					sumNegative += amount;
				}
			}
			for(i in evt.timework){
				sumTimework += parseFloat(evt.timework[i]);
			}
		}
		if(colID == 1){
			this.renderSalaryCell(td, sumPositive, sumNegative, sumTimework);
			this.addColSum(colID, sumPositive, sumNegative, sumTimework);
		}
		else if(colID == 2){
			var sumLine = sumPositive + sumNegative;
			var clazz = (sumLine > 0) ? 'red' : (sumLine == 0) ? 'black' : 'green';
			sumLineText = sprintf("%.2f", Math.abs(sumLine));
			td.append($('<span>').addClass(clazz).text(sumLineText));
			td.addClass('lightCell clickable text_link');
			td.bind('click', {lineData: lineData}, function(e){
				var data = e.data.lineData;
				var userID = data.lineID;
				self.open_popup(userID);
			});

			this.addColSum(colID, sumLine, sumLine, sumTimework);
		}
		return td;
	},

	renderFooterCellLeft: function(th, lineID){
		return th.text('Total');
	},

	renderFooterCell: function(td, lineID, cdate){
		if(cdate in this.sumCols){
			var sumPositive = this.sumCols[cdate]['sumPositive'];
			var sumNegative = this.sumCols[cdate]['sumNegative'];
			var sumTimework = this.sumCols[cdate]['sumTimework'];

			this.renderSalaryCell(td, sumPositive, sumNegative, sumTimework);
		}
		return td;
	},

	renderFooterCellRight: function(td, lineID, colID){
		if(colID in this.sumCols){
			var sumPositive = this.sumCols[colID]['sumPositive'];
			var sumNegative = this.sumCols[colID]['sumNegative'];
			var sumTimework = this.sumCols[colID]['sumTimework'];

			if(colID == 1){
				this.renderSalaryCell(td, sumPositive, sumNegative, sumTimework);
			}
			else if(colID == 2){
				var sumTotal = sumPositive;
				var clazz = (sumTotal > 0) ? 'red' : (sumTotal == 0) ? 'black' : 'green';
				sumTotalText = sprintf("%.2f", Math.abs(sumTotal));
				td.append($('<span>').addClass(clazz).text(sumTotalText));
			}
		}
		else if(colID == 2){
			td.append($('<span>').addClass('black').text(0));
		}
		return td;
	},



	renderSalaryCell: function(td, sumPositive, sumNegative, sumTimework){
		var self = this;
		if(sumPositive > 0){
			td.append($('<span>').addClass('red').text(sprintf("%.0f", Math.abs(sumPositive))));
		}
		if(sumPositive > 0 && sumNegative < 0){
			td.append($('<br>'));
		}
		if(sumNegative < 0){
			td.append($('<span>').addClass('green').text(sprintf("%.0f", Math.abs(sumNegative))));
		}

		var tooltip_data = {
			'sumPositive': sumPositive,
			'sumNegative': sumNegative,
			'sumTimework': sumTimework,
		};

		td.mouseenter(tooltip_data, function(evt){
			Tooltip.show($(this), self.get_tooltip_content(evt.data));
		}).mouseleave(Tooltip.hide);
	},


	cellClicked: function(lineID, date, cellDataList){
		// nothing
	},


	open_popup: function(userID){
		// TODO - Check how to use FormOpenPopup
		alert('not ready');
		/*
		var self = this;

		var format = time.date_to_str;
		var date = this.range_stop;
		if(this.range_stop > Date.today()){
			date = Date.today();
		}

		this.dataset.call("get_form_context",[userID, format(date)]).then(function(context) {
			var defaults = {};
			_.each(context, function(val, field_name) {
				defaults['default_' + field_name] = val;
			});


			var pop = new instance.web.form.FormOpenPopup(self);
			var pop_infos = self.get_form_popup_infos();
			pop.show_element(self.dataset.model, null, self.dataset.get_context(defaults), {
				title: _.str.sprintf(_t("Create: %s"), pop_infos.title),
				disable_multiple_selection: true,
				view_id: pop_infos.view_id,
			});
			pop.on('closed', self, function() {

			});
			pop.on('create_completed', self, function(id) {
				self.refresh_events();
			});
		});
		*/
	},

	// TODO - rewrite method
	/*
	get_form_popup_infos: function() {
		var parent = this.getParent();
		var infos = {
			view_id: false,
			title: this.name,
		};
		if (parent instanceof instance.web.ViewManager) {
			infos.view_id = parent.get_view_id('form');
			if (parent instanceof instance.web.ViewManagerAction && parent.action && parent.action.name) {
				infos.title = parent.action.name;
			}
		}
		return infos;
	},
	*/

	get_tooltip_content: function(data){
		var div = $('<div>');

		if(data.sumPositive > 0){
			div.append($('<div>').append($('<span>').text(_t('Amount due:')+' ')).append($('<span>').addClass('red').text(sprintf("%.2f", Math.abs(data.sumPositive)))));
		}
		if(data.sumNegative < 0){
			div.append($('<div>').append($('<span>').text(_t('Versed amount:')+' ')).append($('<span>').addClass('green').text(sprintf("%.2f", Math.abs(data.sumNegative)))));
		}

		// TODO - add working time

		if(data.sumTimework > 0){
			div.append($('<div>').append($('<span>').text(_t('Working time:')+' ')).append($('<span>').text(this.format_hour(data.sumTimework))));
		}

		return div;
	},


});

core.view_registry.add('salary_timeline', SalaryTimeline);

return SalaryTimeline;
});
