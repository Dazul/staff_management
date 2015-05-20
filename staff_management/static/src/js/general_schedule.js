openerp_staff_management_general_schedule = function(instance) {
	
	instance.web.views.add('calendar_general', 'instance.staff_management.GeneralScheduler');
	
	instance.staff_management.GeneralScheduler = instance.staff_management.Timeline.extend({
		
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
			var format = instance.web.date_to_str;
			
			extend_domain = [[this.date_field, '>=', format(start.clone())],
					 [this.date_field, '<=', format(end.clone())]];

			return new instance.web.CompoundDomain(domain, extend_domain);
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
			model = new instance.web.Model("staff.scheduler");
			model.call("getPersonalInfo",[users_id]).then(function(res){
				self.user_information = res;
			});

			this._super.apply(this, arguments);
		},

		load_all_users: function(lines, domain){
			var self = this;
			// load all other users
			var Users = new instance.web.Model('res.users');
			// check if there is a filter on user
			var user_domain = new Array();			
			for(i=0 ; i<domain.length ; i++){
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
		
		renderCell: function(td, cellDataList){
			var self = this;
			if(cellDataList.length == 1){
				var evt = cellDataList[0].event;

				if(evt.task_id){
					td.addClass('staff_assigned');
					td.text(this.format_hour(evt.hour_from)+' '+evt.task_id[1]);
					td.mouseenter(evt, function(evt){
						instance.staff_management.tooltip.show($(this), self.get_tooltip_content(evt.data));
					}).mouseleave(instance.staff_management.tooltip.hide);
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
				userID = evt.data.lineID;

				if(self.user_information[userID]){
					info = self.user_information[userID];

					mobile = info.mobile;
					if(mobile == false || mobile == 'false'){
						mobile = '-';
					}
					auths = info.auths.join(', ');
					if(info.auths.length == 0){
						auths = '-';
					}

					instance.staff_management.tooltip.show_left($(this), '<div><span style="font-weight: bold;">'+info.name+'</span>'+'</div><div style="height: 130px;"><img src="data:image/png;base64,'+info.image+'"/></div>'+'<div>'+mobile+'</div><div>'+auths+'</div>');
				}

			}).mouseleave(instance.staff_management.tooltip.hide);

				

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

}
