openerp_staff_management_general_schedule = function(instance) {
	
	instance.web.views.add('calendar_general', 'instance.staff_management.GeneralScheduler');
	
	instance.staff_management.GeneralScheduler = instance.staff_management.Timeline.extend({
		
		init:function(parent, dataset, view_id, options){
			this._super.apply(this, arguments);
			
			this.dataset = dataset;
			
			this.view_id = view_id;
			this.view_type = 'calendar';
			
			this.set_interval('day', 1);
			this.set_nbrOfHeaderLines(2);

			var now = new Date();
			var firstday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + Date.CultureInfo.firstDayOfWeek );
			var lastday = new Date(firstday.getFullYear(), firstday.getMonth(), firstday.getDate() + 6);

			this.set_range_dates(firstday, lastday);
		},
		
		get_range_domain: function(domain, start, end) {
			var format = instance.web.date_to_str;
			
			extend_domain = [[this.date_field, '>=', format(start.clone())],
					 [this.date_field, '<=', format(end.clone())]];

			return new instance.web.CompoundDomain(domain, extend_domain);
		},
		
		do_search: function(domain, context, _group_by) {
			var self = this;
			
			this.dataset.read_slice(_.keys(this.fields), {
				offset: 0,
				domain: this.get_range_domain(domain, this.range_start, this.range_stop),
				context: context,
			}).done(function(events) {
			
				var lines = {};
				
				 _.each(events, function(e){

					 var event_date = instance.web.auto_str_to_date(e[self.date_field]);
					 
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
		
		view_loading: function (fv) {		
			var attrs = fv.arch.attrs;
			if (!attrs.date_start) {
				throw new Error("Calendar view has not defined 'date_start' attribute.");
			}
		
			this.fields = fv.fields;
			this.date_field = attrs.date_start;
		},
		
		renderCell: function(td, cellDataList){
			if(cellDataList.length == 1){
				return td.append($('<div>').text('hi'));
			}
			return td;
		},
		
		renderLeftCell: function(th, data){
			return th.append(data['username']);
		},
		
		renderHeaderCell: function(th, lineID, cdate){
			
			if(lineID == 1){
				
				th.append(instance.web.date_to_str(cdate));
			}
			return th;
		},

		cellClicked: function(lineID, date, cellDataList){
			if(cellDataList.length >= 1){
				alert('clicked!!! '+date);
			}
		},
		
	});

}
