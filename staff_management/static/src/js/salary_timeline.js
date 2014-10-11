
openerp_staff_management_salary_timeline = function(instance) {
	var _t = instance.web._t; // For text translations
	
	instance.web.views.add('salary_timeline', 'instance.staff_management.SalaryTimeline');
	
	instance.staff_management.SalaryTimeline = instance.staff_management.Timeline.extend({


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
			var format = instance.web.date_to_str;
			
			extend_domain = [[this.date_field, '>=', format(start.clone())],
					 [this.date_field, '<=', format(end.clone())]];

			return new instance.web.CompoundDomain(domain, extend_domain);
		},
		
		do_search: function(domain, context, _group_by) {
			this._super.apply(this, arguments);
			var self = this;

			this.sumCols = {};

			this.dataset.call("get_month_salaries",[this.get_range_domain(domain, this.range_start, this.range_stop)]).then(function(datas) {
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
			$('.fc-button-prev-month').click(function(){
				var firstday = new Date(self.range_start.getFullYear(), self.range_start.getMonth() - 1, 1);
				var lastday = new Date(firstday.getFullYear(), firstday.getMonth()+1, 0);
				self.update_range_dates(firstday, lastday);
			});
			$('.fc-button-next-month').click(function(){
				var firstday = new Date(self.range_start.getFullYear(), self.range_start.getMonth() + 1, 1);
				var lastday = new Date(firstday.getFullYear(), firstday.getMonth()+1, 0);
				self.update_range_dates(firstday, lastday);
			});

			$('.fc-button-prev-week').css({'display': 'none'});
			$('.fc-button-next-week').css({'display': 'none'});

			$('.fc-button-today').click(function(){
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

		addColSum: function(key, sumPositive, sumNegative){
			if(key in this.sumCols){
				this.sumCols[key]['sumPositive'] += sumPositive;
				this.sumCols[key]['sumNegative'] += sumNegative;
			}else{
				this.sumCols[key] = {
					'sumPositive': sumPositive,
					'sumNegative': sumNegative,
				};
			}
		},

		renderCell: function(td, cellDataList, date){
			var self = this;
			if(cellDataList.length == 1){
				var data = cellDataList[0].event;
				
				var sumPositive = 0;
				var sumNegative = 0;

				for(i in data.amounts){
					var amount = data.amounts[i];
					if(amount > 0){
						sumPositive += amount;
					}
					else{
						sumNegative += amount;
					}
				}
				this.renderSalaryCell(td, sumPositive, sumNegative);
				td.addClass('staff_available');
				this.addColSum(date, sumPositive, sumNegative);
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
			}
			if(colID == 1){
				this.renderSalaryCell(td, sumPositive, sumNegative);
				this.addColSum(colID, sumPositive, sumNegative);
			}
			else if(colID == 2){
				var sumLine = sumPositive + sumNegative;
				var clazz = (sumLine > 0) ? 'red' : (sumLine == 0) ? 'black' : 'green';
				td.append($('<span>').addClass(clazz).text(sumLine));
				td.addClass('lightCell clickable text_link');
				td.click(function(){
					var data = self.getLineData($(this).parent());
					var userID = data.lineID;
					self.open_popup(userID);
				});
				this.addColSum(colID, sumLine, sumLine);
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

				this.renderSalaryCell(td, sumPositive, sumNegative);
			}
			return td;
		},

		renderFooterCellRight: function(td, lineID, colID){
			if(colID in this.sumCols){
				var sumPositive = this.sumCols[colID]['sumPositive'];
				var sumNegative = this.sumCols[colID]['sumNegative'];

				if(colID == 1){
					this.renderSalaryCell(td, sumPositive, sumNegative);
				}
				else if(colID == 2){
					var sumTotal = sumPositive;
					var clazz = (sumTotal > 0) ? 'red' : (sumTotal == 0) ? 'black' : 'green';
					td.append($('<span>').addClass(clazz).text(sumTotal));
				}
			}
			else if(colID == 2){
				td.append($('<span>').addClass('black').text(0));
			}
			return td;
		},



		renderSalaryCell: function(td, sumPositive, sumNegative){
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
			};

			td.mouseenter(tooltip_data, function(evt){
				instance.staff_management.tooltip.show($(this), self.get_tooltip_content(evt.data));
			}).mouseleave(instance.staff_management.tooltip.hide);

		},


		cellClicked: function(lineID, date, cellDataList){
			// nothing
		},


		open_popup: function(userID){
			var self = this;

			var format = instance.web.date_to_str;
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

		},

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

		get_tooltip_content: function(data){
			var div = $('<div>');

			if(data.sumPositive > 0){
				div.append($('<div>').append($('<span>').text(_t('Amount due:')+' ')).append($('<span>').addClass('red').text(sprintf("%.2f", Math.abs(data.sumPositive)))));
			}
			if(data.sumNegative < 0){
				div.append($('<div>').append($('<span>').text(_t('Versed amount:')+' ')).append($('<span>').addClass('green').text(sprintf("%.2f", Math.abs(data.sumNegative)))));
			}

			// TODO - add working time

			return div;
		},


	});
}

/*
openerp_staff_management_salary_timeline = function(instance) {
	var _t = instance.web._t; // For text translations
	
	instance.web.views.add('salary_timeline', 'instance.staff_management.SalaryTimeline');
	
	instance.staff_management.SalaryTimeline = instance.web.View.extend({
	
		template: "SalaryTimeline",	
		
		init:function(parent, dataset, view_id, options){
			this.view_type = 'form'; // create an other view_type ?
			// call parent init function
			this._super.apply(this, arguments);
			
			this.update_range_dates(Date.today());
			
			this.table_datas = [];
			this.last_search = [];
			
			var self = this;
			$(window).resize(function(){
				self.render_table_content(self.table_datas);
			});
			
		},
		
		// Destroy, restore all function of original DHTMLXscheduler
		destroy:function(){
			this._super();
		},
		
		view_loading: function(r) {
			this.init_buttons();
			this.update_view();
		},
		
		init_buttons: function() {
			var self = this;
			$('.salary_timeline .button_prev').click(function(){
				self.update_range_dates(self.range_start.addMonths(-1));
				self.update_view();
			});
			$('.salary_timeline .button_next').click(function(){
				self.update_range_dates(self.range_start.addMonths(1));
				self.update_view();
			});
			$('.salary_timeline .button_today').click(function(){
				self.update_range_dates(Date.today());
				self.update_view();
			});
			
		},
		
		do_search: function(domain, context, group_by) {
			this.last_search = arguments;
			this.update_view();
		},
		
		daysInMonth:function(date) {
			return new Date(date.getYear(), date.getMonth()+1, 0).getDate();
		},
		
		update_view: function(){
		
			var date = this.range_start;
		
			var monthNames = [ _t("January"), _t("February"), _t("March"), _t("April"), _t("May"), _t("June"), _t("July"), _t("August"), _t("September"), _t("October"), _t("November"), _t("December") ];
		
			$('.salary_timeline .current_date').text(monthNames[date.getMonth()]+' '+date.toString("yyyy"));
			this.load_datas();
		},
		
		update_range_dates: function(date) {
			this.range_start = date.clone().moveToFirstDayOfMonth();
			this.range_stop = this.range_start.clone().addMonths(1).addSeconds(-1);			
		},
		
		get_range_domain: function() {
			var format = instance.web.date_to_str;
			if(this.last_search[0]){
				var domain = this.last_search[0].slice(0);
			}
			else{
				var domain = [];
			}
			domain.unshift(['date', '>=', format(this.range_start)]);
			domain.unshift(['date', '<=', format(this.range_stop)]);
			return domain;
		},
		
		load_datas: function(){			
			var self = this;
			this.dataset.call("get_month_salaries",[this.get_range_domain()]).then(function(datas) {
				self.datas_loaded(datas);
			});
		},
		
		datas_loaded: function(datas){
			this.table_datas = datas;
			this.render_table_content(datas);
		},
		
		strip_number: function(number) {
			return (parseFloat(number.toPrecision(12)));
		},
		
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
		slow_create: function(userId) {
			var self = this;

			var format = instance.web.date_to_str;
			var date = this.range_stop;
			if(this.range_stop > Date.today()){
				date = Date.today();
			}
			
			
			this.dataset.call("get_form_context",[userId, format(date)]).then(function(context) {
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
					self.update_view();
				});
			});
		},
		
		
		add_cell_amount: function(dom_tr, positive, negative, worktime, style){
			textPos = (positive > 0) ? '<span class="red">'+sprintf("%.0f", Math.abs(positive))+'</span>' : '';
			textNeg = (negative < 0) ? '<span class="green">'+sprintf("%.0f", Math.abs(negative))+'</span>' : '';
		
			if(textPos != '' && textNeg != ''){
				text = textPos+'<br/>'+textNeg;
			}
			else{
				text = textPos+''+textNeg;
			}
			
			if(text != ''){
				var clazz = (style ? 'with_events' : '');
			
				dom_tr.append($('<td>').attr('sp', positive).attr('sn', negative).attr('wt', worktime).addClass(clazz+' show_tooltip').html(text));
			}
			else{
				dom_tr.append($('<td>'));
			}
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
		
		render_table_content: function(datas){
			var self = this;
			
			nbDays = this.daysInMonth(this.range_start);
			
			table = $('<table>').attr('width', '100%');
			thead = $('<thead>');
			tbody = $('<tbody>');
			tfoot = $('<tfoot>');
			
			// build header
			dom_tr = $('<tr>').addClass('header');
			dom_tr.append($('<td>').addClass('leftcol').text(_t("User")));
			for(var j=1 ; j<=nbDays ; j++){
				dom_tr.append($('<td>').text(j));
			}
			dom_tr.append($('<td>').addClass('rightcol1').text(_t("Balance")));
			dom_tr.append($('<td>').addClass('rightcol').text(_t("Balance")));
			thead.append(dom_tr);
			
			// build content
			var nbUsers = 0;
			for(user in datas){
				if(user == 'nd'){
					continue;
				}
				nbUsers ++;
				
				uData = datas[user];
				
				sumUserPositive = 0;
				sumUserNegative = 0;
				sumUserTimework = 0;
				
				dom_tr = $('<tr>').addClass('user').attr('username', uData['name']);
				
				
				dom_tr.append($('<td>').addClass('username leftcol').text(uData['name']));
				
				for(var j=1 ; j<=nbDays ; j++){
				
					dkey = (j < 10) ? '0'+j : j;
				
					sumPositive = 0;
					sumNegative = 0;
					sumTimework = 0;
					if(uData[dkey] != undefined){
						listAmount = uData[dkey]['amounts'];
						for(var k=0; k<listAmount.length ; k++){
							var amount = parseFloat(listAmount[k]);
							if(amount > 0){
								sumPositive += amount;
							}
							else{
								sumNegative += amount;
							}
						}
						listTimeWork = uData[dkey]['timework'];
						for(var k=0; k<listTimeWork.length ; k++){
							sumTimework += parseFloat(listTimeWork[k]);
						}
					}
					
					
					sumUserPositive += sumPositive;
					sumUserNegative += sumNegative;
					sumUserTimework += sumTimework;
					
					
					this.add_cell_amount(dom_tr, sumPositive, sumNegative, sumTimework, true);

				}
				
				this.add_cell_amount(dom_tr, sumUserPositive, sumUserNegative, sumUserTimework, false);
				
				var sumUser = sumUserPositive + sumUserNegative;
				
				link = $('<a>').html('<span class="'+(sumUser == 0 ? 'black' : (sumUser < 0 ? 'green' : 'red'))+'">'+sprintf("%.2f", Math.abs(sumUser))+'</span>');
				link.attr('uid', user);
				link.click(function(){
					self.slow_create($(this).attr('uid'));
				});
				
				dom_tr.append($('<td>').addClass('sumUser rightcol').append(link));
				
				tbody.append(dom_tr);
			}
			
			
			// build total
			dom_tr = $('<tr>').addClass('footer');
			dom_tr.append($('<td>').addClass('leftcol').text(_t("Total")));
			var sumTotalPositive = 0;
			var sumTotalNegative = 0;
			var sumTotalTimework = 0;
			for(var j=1 ; j<=nbDays ; j++){
				var sumPositive = 0;
				var sumNegative = 0;
				var sumTimework = 0;
				dkey = (j < 10) ? '0'+j : j;
				for(uid in datas){
					if(uid == 'nd'){
						continue;
					}
					if(datas[uid][dkey] != undefined){
						var listAmount = datas[uid][dkey]['amounts'];
						for(var k=0; k<listAmount.length ; k++){
							
							if(listAmount[k] > 0){
								sumPositive = this.strip_number(sumPositive + this.strip_number(listAmount[k]));
							}
							else{
								sumNegative = this.strip_number(sumNegative + this.strip_number(listAmount[k]));
							}
						}
						var listWorktime = datas[uid][dkey]['timework'];
						for(var k=0; k<listWorktime.length ; k++){
							sumTimework += parseFloat(listWorktime[k]);
						}
					}
				}
				
				sumTotalPositive = this.strip_number(sumTotalPositive + sumPositive);
				sumTotalNegative = this.strip_number(sumTotalNegative + sumNegative);
				sumTotalTimework += sumTimework;
				this.add_cell_amount(dom_tr, sumPositive, sumNegative, sumTimework, false);

			}
						
			this.add_cell_amount(dom_tr, sumTotalPositive, sumTotalNegative, sumTotalTimework, false);
			sumTotal = this.strip_number(sumTotalPositive + sumTotalNegative);
			
			dom_tr.append($('<td>').addClass('rightcol').html('<span class="'+(sumTotal == 0 ? 'black' : (sumTotal < 0 ? 'green' : 'red'))+'">'+sprintf("%.2f", Math.abs(sumTotal))+'</span>'));
			tfoot.append(dom_tr);
			
			
			table.append(thead);
			table.append(tbody);
			table.append(tfoot);

			$('.stimeline_table').empty();
			$('.stimeline_table').append(table);
			
			
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
				nbUsers = (nbUsers == 0) ? 1 : nbUsers;
				var tr_height = tbodyHeight / nbUsers - 1;
				$('.stimeline_table tbody tr').each(function(i, e){
					$(e).height(tr_height);
				});	
			}
			
			
			this.align_cols();
			
			$('.show_tooltip').mouseover(function(){
				
				
				html = [];
				
				if($(this).attr('sp')){
					val = parseFloat($(this).attr('sp'));
					if(val != 0){
						html.push(_t('Amount due:')+' <span class="red">'+sprintf("%.2f", Math.abs(val))+'</span>');
					}
				}
				if($(this).attr('sn')){
					val = parseFloat($(this).attr('sn'));
					if(val != 0){
						html.push(_t('Versed amount:')+' <span class="green">'+sprintf("%.2f", Math.abs(val))+'</span>');
					}
				}
				if($(this).attr('spn')){
					val = parseFloat($(this).attr('spn'));
					if(val != 0){
						
						if(val > 0){
							html.push(_t('Amount due:')+' <span class="red">'+sprintf("%.2f", Math.abs(val))+'</span>');
						}
						else{
							html.push(_t('Versed amount:')+' <span class="green">'+sprintf("%.2f", Math.abs(val))+'</span>');
						}
						
					}
				}
				
				if($(this).attr('wt')){
					val = $(this).attr('wt');
					if(val != 0){
						html.push(_t('Working time:')+' '+self.convert_hour(val));
					}
				}
				
				$('.staff_tooltip').html(html.join('<br/>'));
								
				var offset = $(this).offset();
				
								
				var left = offset.left - ($('.staff_tooltip').width() - $(this).width())/ 2;
				var top = offset.top - $('.staff_tooltip').height() - 10;
				
				
				if(left + $('.staff_tooltip').width() + 15 > $(document).width()){
					left = $(document).width() - $('.staff_tooltip').width() - 15;
				}
				
				
				$('.staff_tooltip').css({
					left: left,
					top: top,
					display: 'block',
					visibility: 'visible',
				});
			});
			
			$('.show_tooltip').mouseout(function(){
				$('.staff_tooltip').css({
					display: 'none',
				});
			});
			$('.staff_tooltip').mouseover(function(){
				$('.staff_tooltip').css({
					display: 'none',
				});
			});
			
			
		},
		
		align_cols: function(){
			
			var head_tr = $('.stimeline_table .dataTables_scrollHeadInner thead tr').eq(0); // get the clone from datatable displayed
			var body_tr = $('.stimeline_table tbody tr').eq(0);
			var foot_tr = $('.stimeline_table .dataTables_scrollFootInner tfoot tr').eq(0); // get the clone from datatable displayed
			
			var tds_head = $(head_tr).find('td');
			var tds_body = $(body_tr).find('td');
			var tds_foot = $(foot_tr).find('td');
						
			nbr_tds = tds_head.length;
			
			for(var i=0 ; i<nbr_tds ; i++){
				var maxWidth = tds_head.eq(i).width();
				if(tds_body.eq(i).width() > maxWidth){
					maxWidth = tds_body.eq(i).width();
				}
				if(tds_foot.eq(i).width() > maxWidth){
					maxWidth = tds_foot.eq(i).width();
				}
				
				tds_head.eq(i).css({'width': maxWidth, 'min-width': maxWidth, 'max-width': maxWidth});
				tds_body.eq(i).css({'width': maxWidth, 'min-width': maxWidth, 'max-width': maxWidth});
				tds_foot.eq(i).css({'width': maxWidth, 'min-width': maxWidth, 'max-width': maxWidth});
				tds_foot.eq(i).width(maxWidth);
				
			}
			
			
		}
		
				
	});
	

};
*/