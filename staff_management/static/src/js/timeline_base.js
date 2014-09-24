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
		
		headerCellContent: function(lineID, date){
			return $('<span>').text('-');
		},
		
		renderCell: function(cellDataList){
			return $('<span>');
		},
		
		set_range_dates: function(date_start, date_stop) {
			this.range_start = new Date(date_start);
			this.range_stop = new Date(date_stop);
		},
		
		update_range_dates: function(date_start, date_stop) {
			this.set_range_dates(date_start, date_stop);
			this.render_timeline();
		},
		
		getNextDate: function(date){
			var d = new Date(date.getTime());
			if(this.interval_mode == 'day'){
				d.setDate(d.getDate() + this.interval_nbr);
			}
			else if(this.interval_mode == 'month'){
				d.setMonth(d.getMonth() + this.interval_nbr);
			}
			else if(this.interval_mode == 'year'){
				d.setFullYear(d.getFullYear() + this.interval_nbr);
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
			
			var table = $('<table>').attr('width', '100%');
			var thead = $('<thead>');
			var tbody = $('<tbody>');
			var tfoot = $('<tfoot>');
			
			thead = this.header_rendering(thead);
			tbody = this.body_rendering(tbody);
						
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
				var th = $('<th>').addClass('stimeline_leftcol');
				th.text('Titre');
				tr.append(th);
				
				for(var cdate=this.range_start ; cdate<=this.range_stop ; cdate=this.getNextDate(cdate)){
					var th = $('<th>');
					
					th.append(this.headerCellContent(lineID, cdate));
					
					tr.append(th);
				}
				
				thead.append(tr);
				
			}
			return thead;
		},
		
		body_rendering: function(tbody){
			
			for(var i=0 ; i<this.datas.length ; i++){
				var data = this.datas[i];
				
				var tr = $('<tr>');
				var th = $('<th>').addClass('stimeline_leftcol');
				th.append(data['html']);
				tr.append(th);
				
				for(var cdate=this.range_start ; cdate<=this.range_stop ; cdate=this.getNextDate(cdate)){
					var td = $('<td>');
					
					var cellDataList = [];
					for(var j=0 ; j<data['cells'].length ; j++){
						if(this.isSameDate(data['cells'][j]['date'], cdate)){
							cellDataList.push(data['cells'][j]);
						}
					}
					
					td.append(this.renderCell(cellDataList));
					
					
					tr.append(td);
				}
				
				tbody.append(tr);
				
			}
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
				}
			});	
			
			
			var realTbodyHeight = $('.stimeline_table tbody').height();
			if(realTbodyHeight < tbodyHeight){
				nbrLines = (this.datas.length == 0) ? 1 : this.datas.length;
				var tr_height = tbodyHeight / nbrLines - 1;
				$('.stimeline_table tbody tr').each(function(i, e){
					$(e).height(tr_height);
				});	
			}
			
		},
		
		
		
		
	});

};
