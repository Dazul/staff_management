openerp_staff_management_timeline_base = function(instance) {
	var _t = instance.web._t;

	instance.staff_management.Timeline = instance.web.View.extend({
	
		template: "staff_timeline",
		
		init:function(parent, dataset, view_id, options){
			this._super.apply(this, arguments);			
		},
		
		destroy:function(){
			this._super();
		},
		

		format_date: function(date, format){
			return $.fullCalendar.formatDate(date, format, {
				monthNames: Date.CultureInfo.monthNames,
				monthNamesShort: Date.CultureInfo.abbreviatedMonthNames,
				dayNames: Date.CultureInfo.dayNames,
				dayNamesShort: Date.CultureInfo.abbreviatedDayNames,
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
			return this.convert_hour(hour_end-hour_start);
		},

		get_week_start: function(date){
			var d = new Date(date);
			if(d.getDay() == 0 && Date.CultureInfo.firstDayOfWeek > 0){
				d.setDate(d.getDate()-7);
			}
			return new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay() + Date.CultureInfo.firstDayOfWeek);
		},

		view_loading: function (fv) {		
			var self = this;
			$('.fc-header-left .fc-button').hover(
				function () {
					$(this).addClass('fc-state-hover');
				}, 
				function () {
					$(this).removeClass('fc-state-hover');
				}
			);

			$('.fc-button-prev-month').click(function(){
				// TODO - review
				var firstday = new Date(self.range_stop.getFullYear(), self.range_stop.getMonth() - 1, 1);
				firstday = self.get_week_start(firstday);
				var lastday = new Date(firstday.getFullYear(), firstday.getMonth(), firstday.getDate() + 6);
				self.update_range_dates(firstday, lastday);
			});
			$('.fc-button-next-month').click(function(){
				// TODO - review
				var firstday = new Date(self.range_stop.getFullYear(), self.range_stop.getMonth() + 1, 1);
				firstday = self.get_week_start(firstday);
				var lastday = new Date(firstday.getFullYear(), firstday.getMonth(), firstday.getDate() + 6);
				self.update_range_dates(firstday, lastday);
			});

			$('.fc-button-prev-week').click(function(){
				var firstday = new Date(self.range_start.getFullYear(), self.range_start.getMonth(), self.range_start.getDate() - 7);
				var lastday = new Date(firstday.getFullYear(), firstday.getMonth(), firstday.getDate() + 6);
				self.update_range_dates(firstday, lastday);
			});
			$('.fc-button-next-week').click(function(){
				var firstday = new Date(self.range_start.getFullYear(), self.range_start.getMonth(), self.range_start.getDate() + 7);
				var lastday = new Date(firstday.getFullYear(), firstday.getMonth(), firstday.getDate() + 6);
				self.update_range_dates(firstday, lastday);
			});

			$('.fc-button-today').click(function(){
				if(!$(this).hasClass('fc-state-disabled')){
					var now = new Date();
					var firstday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + Date.CultureInfo.firstDayOfWeek );
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
			data: {
				date: {
					'html': jqueryDom,
					'tooltip': jqueryDom,
					'line_id': id,
				},
				...
			}
		*/
		update_datas: function(datas){
			this.datas = datas;
			this.render_timeline();
		},
		
		
		update_lines: function(lineDatas){
			this.set_line(lineDatas);
			this.render_timeline();
		},
		
		/*
			lineDatas: [
				{
					'html': jqueryDom,
					'lineID': id,
					'cells': [
						{ // lineID
							'html': jqueryDom,
							'tooltip': jqueryDom,
							'date': date,
						},
					],
				},
				...
			]
		*/
		set_lines: function(lineDatas){
			this.lineDatas = lineDatas;
		},
		
		
		set_nbrOfHeaderLines: function(nbrOfHeaderLines){
			this.nbrOfHeaderLines = nbrOfHeaderLines;
		},
		
		set_range_dates: function(date_start, date_stop) {
			this.range_start = new Date(date_start);
			this.range_stop = new Date(date_stop);
		},
		
		update_range_dates: function(date_start, date_stop) {
			this.set_range_dates(date_start, date_stop);
			this.render_timeline();
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
		
		render_timeline: function(){
			var self = this;

			var today = new Date();
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
						
			table.append(thead);
			table.append(tbody);
			table.append(tfoot);


			table.find('td').click(function(){

				var i = $(this).parent().index();
				var lineID = self.lineIndex[parseInt($(this).parent().index())];
				var date = self.getNextDate(self.range_start, parseInt($(this).index())-1);

				var data = self.datas[lineID];
				var cellDataList = [];
				for(var j=0 ; j<data['cells'].length ; j++){
					if(self.isSameDate(data['cells'][j]['date'], date)){
						cellDataList.push(data['cells'][j]);
					}
				}
				self.cellClicked(lineID, date, cellDataList);
			});

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
				tr.append(th);
				
				for(var cdate=this.range_start ; cdate<=this.range_stop ; cdate=this.getNextDate(cdate)){
					var th = $('<th>');
					
					th = this.renderHeaderCell(th, lineID, cdate);
					
					tr.append(th);
				}
				
				thead.append(tr);
				
			}
			return thead;
		},
		
		body_rendering: function(tbody){
			var self = this;
			var line_nbr = 0;
			
			this.lineIndex = [];

			for(var i in this.datas){
				this.lineIndex .push(i);
				var data = this.datas[i];
				line_nbr ++;
				
				var tr = $('<tr>');
				var th = $('<th>').addClass('stimeline_leftcol');
				th = this.renderLeftCell(th, data);
				tr.append(th);
				
				for(var cdate=this.range_start ; cdate<=this.range_stop ; cdate=this.getNextDate(cdate)){
					var td = $('<td>');
					
					var cellDataList = [];
					for(var j=0 ; j<data['cells'].length ; j++){
						if(this.isSameDate(data['cells'][j]['date'], cdate)){
							cellDataList.push(data['cells'][j]);
						}
					}
					
					td = this.renderCell(td, cellDataList);
					
					tr.append(td);
				}
				
				tbody.append(tr);
				
			}
			
			this.line_number = line_nbr;
			
			return tbody;
		},
		
		
		final_table_rendering: function(table){
		
			var viewHeight = $('.openerp_webclient_container').height() - $('.announcement_bar').height() - $('.oe_topbar').height() - $('.oe_view_manager_header').height();
			
			
			var tableHeight = viewHeight - $('.stimeline_header').height();
			
			var tbodyHeight = tableHeight - $('.stimeline_table thead').height() - $('.stimeline_table tfoot').height() - 10;
			
			width = $(window).width() - $('.oe_leftbar').width() - 1;
			$('.salary_timeline').css({
				'width': width,
			});
		
			table.dataTable({
				"searching": false,
				"info": false,
				"paging":   false,
				"order": [[ 0, "asc" ]],
				"scrollY": tbodyHeight,
				"scrollX": true,
				"language": {
					"emptyTable":     _t("No data available"),
				},
				"bSortCellsTop": true
			});	
			
			
			var realTbodyHeight = $('.stimeline_table tbody').height();
			if(realTbodyHeight < tbodyHeight){
				nbrLines = (this.line_number == 0) ? 1 : this.line_number;
				var tr_height = tbodyHeight / nbrLines - 2;
				$('.stimeline_table tbody tr').each(function(i, e){
					$(e).height(tr_height);
				});	
			}
			
		},
		
		
		
		
	});

};
