odoo.define('staff_management.Timeline', function (require) {
"use strict";

var core = require('web.core');

var View = require('web.View');

var _t = core._t;


var Timeline = View.extend({
	template: "staff_timeline",

	init:function(parent, dataset, view_id, options){
		this._super.apply(this, arguments);

		this.before_print_generated = false;
		var self = this;
		if (window.matchMedia) {
			var mediaQueryList = window.matchMedia('print');
			mediaQueryList.addListener(function(mql) {
				if (mql.matches) {
					self.beforePrint();
				}
			});
		}
		window.onbeforeprint = function(){
			self.beforePrint();
		};
	},

	destroy:function(){
		this._super();
	},

	beforePrint: function(){
		if(this.before_print_generated == false){
			this.generate_export_table();
		}
		this.before_print_generated = false;
	},

	format_date: function(date, format){
		return $.fullCalendar.formatDate(date, format, {
			monthNames: moment.months(),
			monthNamesShort: moment.monthsShort(),
			dayNames: moment.weekdays(),
			dayNamesShort: moment.weekdaysShort(),
		});
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
		return this.format_hour(hour_end-hour_start);
	},

	get_week_start: function(date){
		// TODO - Check first day of week (not sure about "moment._locale._week.dow")
		var d = new Date(date);
		if(d.getDay() == 0 && moment._locale._week.dow > 0){
			d.setDate(d.getDate()-7);
		}
		return new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay() + moment._locale._week.dow);
	},

	view_loading: function (fv) {
		var self = this;

		this.$('.fc-header-left .fc-button').hover(
			function () {
				$(this).addClass('fc-state-hover');
			},
			function () {
				$(this).removeClass('fc-state-hover');
			}
		);
		this.$('.fc-header-right .fc-button').hover(
			function () {
				$(this).addClass('fc-state-hover');
			},
			function () {
				$(this).removeClass('fc-state-hover');
			}
		);
		this.set_button_actions();
	},

	set_button_actions: function() {
		var self = this;
		this.$('.fc-export-buttons').css({'display': 'none'});
		this.$('.fc-button-prev-month').click(function(){
			var firstday = new Date(self.range_stop.getFullYear(), self.range_stop.getMonth() - 1, 1);
			firstday = self.get_week_start(firstday);
			var lastday = new Date(firstday.getFullYear(), firstday.getMonth(), firstday.getDate() + 6);
			self.update_range_dates(firstday, lastday);
		});
		this.$('.fc-button-next-month').click(function(){
			var firstday = new Date(self.range_stop.getFullYear(), self.range_stop.getMonth() + 1, 1);
			firstday = self.get_week_start(firstday);
			var lastday = new Date(firstday.getFullYear(), firstday.getMonth(), firstday.getDate() + 6);
			self.update_range_dates(firstday, lastday);
		});

		this.$('.fc-button-prev-week').click(function(){
			var firstday = new Date(self.range_start.getFullYear(), self.range_start.getMonth(), self.range_start.getDate() - 7);
			var lastday = new Date(firstday.getFullYear(), firstday.getMonth(), firstday.getDate() + 6);
			self.update_range_dates(firstday, lastday);
		});
		this.$('.fc-button-next-week').click(function(){
			var firstday = new Date(self.range_start.getFullYear(), self.range_start.getMonth(), self.range_start.getDate() + 7);
			var lastday = new Date(firstday.getFullYear(), firstday.getMonth(), firstday.getDate() + 6);
			self.update_range_dates(firstday, lastday);
		});

		this.$('.fc-button-today').click(function(){
			if(!$(this).hasClass('fc-state-disabled')){
				var now = new Date();
				var firstday = self.get_week_start(now);
				var lastday = new Date(firstday.getFullYear(), firstday.getMonth(), firstday.getDate() + 6);
				self.update_range_dates(firstday, lastday);
			}
		});
	},

	/*
		interval_mode: day | month | year
		interval_nbr: nbr of day, month or year to add by step
	*/
	set_interval: function(interval_mode, interval_nbr){
		this.interval_mode = interval_mode;
		this.interval_nbr = interval_nbr;
	},

	/*
		datas = [{
			 'cells': [event_data],
			 'lineID': lid,
			 'username': e['user_id'][1],
		 };
	*/
	update_datas: function(datas){
		this.datas = datas;
		this.render_timeline();
	},

	set_nbrOfHeaderLines: function(nbrOfHeaderLines){
		this.nbrOfHeaderLines = nbrOfHeaderLines;
	},

	set_nbrOfRightCells: function(nbrOfRightCells){
		this.nbrOfRightCells = nbrOfRightCells;
	},

	set_nbrOfFooterLines: function(nbrOfFooterLines){
		this.nbrOfFooterLines = nbrOfFooterLines;
	},

	set_range_dates: function(date_start, date_stop) {
		this.range_start = new Date(date_start);
		this.range_stop = new Date(date_stop);
	},

	do_search: function(domain, context, _group_by) {
		this.lastSearch = {
			'domain': domain,
			'context': context,
			'_group_by': _group_by
		};
	},

	update_range_dates: function(date_start, date_stop) {
		this.set_range_dates(date_start, date_stop);
		this.do_search(this.lastSearch.domain, this.lastSearch.context, this.lastSearch._group_by);
	},

	getNextDate: function(date, index){
		var index = (typeof index === "undefined") ? 1 : index;

		var d = new Date(date.getTime());
		if(this.interval_mode == 'day'){
			d.setDate(d.getDate() + this.interval_nbr * index);
		}
		else if(this.interval_mode == 'month'){
			d.setMonth(d.getMonth() + this.interval_nbr * index);
		}
		else if(this.interval_mode == 'year'){
			d.setFullYear(d.getFullYear() + this.interval_nbr * index);
		}
		return d;
	},

	isSameDate: function(d1, d2){
		var format = "yyyy-MM-dd";
		if(this.interval_mode == 'month'){
			format = "yyyy-MM";
		}
		else if(this.interval_mode == 'year'){
			format = "yyyy";
		}
		var d1_str = $.fullCalendar.formatDate(d1, format);
		var d2_str = $.fullCalendar.formatDate(d2, format);
		return (d1_str == d2_str);
	},

	refresh_events: function(){
		this.do_search(this.lastSearch.domain, this.lastSearch.context, this.lastSearch._group_by);
	},
	/*
	refresh_event: function(lineID, eventList, date){
		// replace eventlist in datas
		var data = this.datas[i];
		var colNumber = 0;
		for(var cdate=this.range_start ; cdate<=this.range_stop ; cdate=this.getNextDate(cdate)){
			colNumber ++;
			for(var j=0 ; j<data['cells'].length ; j++){
				if(this.isSameDate(data['cells'][j]['date'], cdate)){
					this.datas[i]['cells'][j] = eventList;
				}
			}
		}

		// refresh event view
		var lineNumber = this.lineIndex.indexOf(lineID);
		var tr = $('.stimeline_table table tbody tr').item(lineNumber);
		var td = tr.find('td').item(colNumber);

		td.empty();
		td.append('BOOM');
	},
	*/

	render_timeline: function(){
		var self = this;

		var today = new Date();
		today = new Date(today.getFullYear(), today.getMonth(), today.getDate());
		if(this.range_start <= today && today <= this.range_stop){
			$('.fc-button-today').addClass('fc-state-disabled');
		}
		else{
			$('.fc-button-today').removeClass('fc-state-disabled');
		}

		var titleElmt = $('.fc-header-title h2');
		this.renderTitle(titleElmt, this.range_start, this.range_stop);

		var table = $('<table>').attr('width', '100%');
		var thead = $('<thead>');
		var tbody = $('<tbody>');
		var tfoot = $('<tfoot>');

		thead = this.header_rendering(thead);
		tbody = this.body_rendering(tbody);
		tfoot = this.footer_rendering(tfoot);

		table.append(thead);
		table.append(tbody);
		table.append(tfoot);

		$('.stimeline_table').empty();
		$('.stimeline_table').append(table);

		this.final_table_rendering(table);
	},

	header_rendering: function(thead){

		for(var lineID=1 ; lineID<=this.nbrOfHeaderLines ; lineID ++){

			var tr = $('<tr>');
			if(lineID == 1){
				tr.addClass('firstHeaderLine');
			}
			if(lineID == this.nbrOfHeaderLines){
				tr.addClass('lastHeaderLine');
			}
			var th = $('<th>').addClass('stimeline_leftcol');
			th = this.renderHeaderCellLeft(th, lineID);
			tr.append(th);

			for(var cdate=this.range_start ; cdate<=this.range_stop ; cdate=this.getNextDate(cdate)){
				var th = $('<th>');

				th = this.renderHeaderCell(th, lineID, cdate);

				tr.append(th);
			}

			if(this.nbrOfRightCells){
				for(var i=1; i<=this.nbrOfRightCells; i++){
					var th = $('<th>');
					th = this.renderHeaderCellRight(th, lineID, i);
					tr.append(th);
				}
			}

			thead.append(tr);

		}
		return thead;
	},

	body_rendering: function(tbody){
		var self = this;
		var line_nbr = 0;

		for(var i in this.datas){
			var data = this.datas[i];
			line_nbr ++;

			var tr = $('<tr>');
			var th = $('<th>').addClass('stimeline_leftcol');
			th = this.renderCellLeft(th, data);
			tr.append(th);

			for(var cdate=this.range_start ; cdate<=this.range_stop ; cdate=this.getNextDate(cdate)){
				var td = $('<td>');

				var cellDataList = [];
				for(var j=0 ; j<data['cells'].length ; j++){
					if(this.isSameDate(data['cells'][j]['date'], cdate)){
						cellDataList.push(data['cells'][j]);
					}
				}

				td = this.renderCell(td, cellDataList, cdate);

				td.bind('click', {cellDataList: cellDataList, date: cdate, lineID: i}, function(e){
					self.cellClicked(e.data.lineID, e.data.date, e.data.cellDataList);
				});

				tr.append(td);
			}

			if(this.nbrOfRightCells){
				for(var i=1; i<=this.nbrOfRightCells; i++){
					var td = $('<td>');
					td = this.renderCellRight(td, i, data);
					tr.append(td);
				}
			}

			tbody.append(tr);

		}

		this.line_number = line_nbr;

		return tbody;
	},

	footer_rendering: function(tfoot){
		if(this.nbrOfFooterLines && this.nbrOfFooterLines > 0){

			for(var lineID=1 ; lineID<=this.nbrOfFooterLines ; lineID ++){

				var tr = $('<tr>');
				if(lineID == 1){
					tr.addClass('firstFooterLine');
				}
				if(lineID == this.nbrOfFooterLines){
					tr.addClass('lastFooterLine');
				}
				var th = $('<th>').addClass('stimeline_leftcol');
				th = this.renderFooterCellLeft(th, lineID);
				tr.append(th);

				for(var cdate=this.range_start ; cdate<=this.range_stop ; cdate=this.getNextDate(cdate)){
					var td = $('<td>');
					td = this.renderFooterCell(td, lineID, cdate);
					tr.append(td);
				}

				if(this.nbrOfRightCells){
					for(var i=1; i<=this.nbrOfRightCells; i++){
						var td = $('<td>');
						td = this.renderFooterCellRight(td, lineID, i);
						tr.append(td);
					}
				}

				tfoot.append(tr);

			}

		}
		return tfoot;
	},

	final_table_rendering: function(table){

		var viewHeight = $('.openerp_webclient_container').height() - $('.announcement_bar').height() - $('.oe_topbar').height() - $('.oe_view_manager_header').height();


		var tableHeight = viewHeight - $('.stimeline_header').height();

		var tbodyHeight = tableHeight - $('.stimeline_table thead').height() - $('.stimeline_table tfoot').height() - 10;

		var width = $(window).width() - $('.oe_leftbar').width() - 1;
		$('.salary_timeline').css({
			'width': width,
		});

		var dynamicTable = table.dataTable({
			"searching": false,
			"info": false,
			"paging":   false,
			"order": [[ 0, "asc" ]],
			"scrollY": tbodyHeight,
			"scrollX": true,
			"language": {
				"emptyTable":     _t("No data available"),
			},
			"bSortCellsTop": true,
		});

		var realTbodyHeight = $('.stimeline_table tbody').height();
		if(realTbodyHeight < tbodyHeight){
			var nbrLines = (this.line_number == 0) ? 1 : this.line_number;
			var tr_height = tbodyHeight / nbrLines - 2;
			$('.stimeline_table tbody tr').each(function(i, e){
				$(e).height(tr_height);
			});
		}

		this.align_cols();

	},

	align_cols: function(){

		var head_tr = $('.stimeline_table .dataTables_scrollHeadInner thead tr'); // get the clone from datatable displayed
		var body_tr = $('.stimeline_table tbody tr');
		var foot_tr = $('.stimeline_table .dataTables_scrollFootInner tfoot tr'); // get the clone from datatable displayed

		var tds_head = head_tr.find('th, td');
		var tds_body = body_tr.find('th, td');
		var tds_foot = foot_tr.find('th, td');

		var nbr_tds = tds_head.length;

		for(var i=1 ; i<nbr_tds ; i++){
			var maxWidth = tds_head.eq(i).width();
			if(tds_body.eq(i).width() > maxWidth){
				maxWidth = tds_body.eq(i).width();
			}
			if(tds_foot.eq(i).width() > maxWidth){
				maxWidth = tds_foot.eq(i).width();
			}

			maxWidth += 2;

			tds_head.eq(i).css({'width': maxWidth, 'min-width': maxWidth, 'max-width': maxWidth});
			tds_body.eq(i).css({'width': maxWidth, 'min-width': maxWidth, 'max-width': maxWidth});
			tds_foot.eq(i).css({'width': maxWidth, 'min-width': maxWidth, 'max-width': maxWidth});
			//tds_foot.eq(i).width(maxWidth);

		}

	},


	generate_export_table: function(column){
		if(!column){
			column = -1;
		}
		var table = $('<table>');

		var date = new Date();
		var caption = $('<caption>').text(_t('Date of data export:')+' '+this.format_date(date, "dd MMM yyyy, HH:mm"));

		table.append(caption);

		var thead = $('<thead>');
		$('.stimeline_table .dataTables_scrollHead thead tr').each(function(i){
			var tr = $('<tr>');
			var cell = 0;
			$.each(this.cells, function(){
				if(column < 0 || column == cell || cell == 0){
					tr.append($('<th>').text($(this).text()));
				}
				cell++;
			});
			thead.append(tr);
		});
		table.append(thead);

		var tbody = $('<tbody>');
		$('.stimeline_table .dataTables_scrollBody tbody tr').each(function(i){
			var nbrData = 0;
			var tr = $('<tr>');
			var cell = 0;
			$.each(this.cells, function(){
				if(column < 0 || column == cell || cell == 0){
					if($(this).text() != ''){
						nbrData ++;
					}
					tr.append($('<td>').text($(this).text()));
				}
				cell++;
			});
			if(nbrData >= 2){
				tbody.append(tr);
			}
		});
		table.append(tbody);

		var tfoot = $('<tfoot>');
		$('.stimeline_table .dataTables_scrollFoot tfoot tr').each(function(i){
			var tr = $('<tr>');
			var cell = 0;
			$.each(this.cells, function(){
				if(column < 0 || column == cell || cell == 0){
					tr.append($('<td>').text($(this).text()));
				}
				cell++;
			});
			tfoot.append(tr);
		});
		table.append(tfoot);

		$('.stimeline_table_export').remove();
		table.addClass('stimeline_table_export');
		$('.staff_timeline').append(table);
	},

	get_export_table_data: function(column){
		var columns = [];
		var data = [];

		var line = 0;
		$('.stimeline_table .dataTables_scrollHead thead tr').each(function(i){
			var cell = 0;
			$.each(this.cells, function(){
				if(line == 0){
					columns.push({title: $(this).text(), key: cell});
				}
				cell ++;
			});
			line ++;
		});

		$('.stimeline_table .dataTables_scrollBody tbody tr').each(function(i){
			var nbrData = 0;
			var cell = 0;
			var lineData = {};
			$.each(this.cells, function(){
				if($(this).text() != ''){
					nbrData ++;
				}
				lineData[cell] = $(this).text();
				cell ++;
			});
			if(nbrData >= 2){
				data.push(lineData);
			}
		});

		$('.stimeline_table .dataTables_scrollFoot tfoot tr').each(function(i){
			var cell = 0;
			var lineData = {};
			$.each(this.cells, function(){
				lineData[cell] = $(this).text();
				cell ++;
			});
			data.push(lineData);
		});

		return {columns: columns, data: data};
	},

	generate_pdf: function(columns, data, mode, title){
		if(!mode){
			mode = 'l';
		}
		var doc = new jsPDF(mode, 'pt');
		var header = function (x, y, width, height, key, value, settings) {
			doc.setFillColor(150, 150, 150);
			doc.setTextColor(255, 255, 255);
			doc.setFontStyle('bold');
			doc.rect(x, y, width, height, 'F');
			doc.setLineWidth(0.5);
			doc.setDrawColor(30);
			doc.rect(x, y, width, height, 's');
			y += settings.lineHeight / 2 + doc.internal.getLineHeight() / 2;
			doc.text('' + value, x + settings.padding, y);
		};
		var cell = function (x, y, width, height, key, value, row, settings) {
			// See path-painting operators in the PDF spec, examples are
			// 'S' for stroke, 'F' for fill, 'B' for both stroke and fill
			var style = 'S';

			if (key === 0) {
				style = 'B';
				doc.setFillColor(240);
			}

			doc.setLineWidth(0.5);
			doc.setDrawColor(30);

			doc.rect(x, y, width, height, style);

			y += settings.lineHeight / 2 + doc.internal.getLineHeight() / 2 - 2.5;
			doc.text('' + value, x + settings.padding, y);
			doc.setTextColor(50);
		};

		doc.setFontSize(22);
		doc.text(title, 40, 60);
		var date = new Date();
		var caption = _t('Date of data export:')+' '+this.format_date(date, "dd MMM yyyy, HH:mm");
		doc.setFontSize(12);
		doc.text(caption, 40, 80);

		doc.autoTable(columns, data, {startY: 90, renderCell: cell, renderHeaderCell: header, padding: 2, lineHeight: 14, fontSize: 10});

		doc.save('planing.pdf');
	},


});


return Timeline;
});
