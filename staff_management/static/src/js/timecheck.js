openerp_staff_management_timecheck = function(instance) {
	var _t = instance.web._t; // For text translations
	
	instance.web.views.add('calendar_timecheck', 'instance.staff_management.TimeCheck');
	
	instance.staff_management.TimeCheck = instance.staff_management.Scheduler.extend({
		
		template: "TimecheckView",
		
		init:function(parent, dataset, view_id, options){
			var self = this;
			var views = new instance.web.Model('ir.ui.view');
			views.query('id').filter([['model', '=', 'staff.scheduler'], ['name', '=', 'timecheck_popup']]).first().then(function(result){
				self.form_timecheck_id = result.id;
			});
		
			// call parent init function
			this._super.apply(this, arguments);
		},

		
		// Load the quickassign form
		load_quickassign: function(){
			dfm_mine = new instance.web.form.DefaultFieldManager(this);
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

			var self = this;
			// add form in html
			this.has_been_loaded.then(function(){
				self.quick_asign_work_time.prependTo(self.$el.find('.staff_management_quick_assign_work_time'));
				$('#staff_quickassign').click(function(){
					var $this = $(this);
					if($this.is(':checked')){
						$('.staff_quickassign_form').removeClass('hidden');
					}
					else{
					   	$('.staff_quickassign_form').addClass('hidden');
					   	self.quick_asign_work_time.set_value(0); // reset task selection when quit quick assign
					}
				});
			});
		},
		
		// draw the timeline & override timelines functions
		init_timeline:function(sections) {
			this._super.apply(this, arguments);

			var self = this;
			// rewrite click action
			scheduler._click.dhx_cal_data = function(e){
				var obj = scheduler.matrix[scheduler._mode];
				var pos = scheduler._locate_cell_timeline(e);
				if (pos){
					if(obj._trace_x[pos.x]){
						date = obj._trace_x[pos.x];
						evs = scheduler.getEvents(date,scheduler.date.add(date,1,"day"));
						for(var i=0 ; i<evs.length ; i++){
							if(evs[i][obj.y_property] == obj.y_unit[pos.y].key){
								if(evs[i].task != false){
									if($('#staff_quickassign').is(':checked')){	
										evs[i].work_time = self.quick_asign_work_time.get_value();
										self.quick_save(evs[i].id, evs[i]);
									}
									else{
										self.open_event(evs[i].id);
									}
								}
							}
						}
					
					}	
				}
				return false;
			}
			
			// Load the counter (assigned/available) and display it
			// the counter is for the month of the first day of the week currently displayed
			scheduler.templates["matrix_scale_label"] = function(section_id, section_label, section_options){
				return section_label;
			}
			
			// Set classes for the cells
			scheduler.templates.matrix_cell_class = function(evs,x,y){
				if (!evs) {
					return "gray_cell";
				}				
				if(evs[0].confirm){
					return "assigned staff_tooltip_show evt_user_"+evs[0].user_id;
				}
				if(evs[0].task){
					return "available staff_tooltip_show evt_user_"+evs[0].user_id;
				}			
				if (evs.length>0){
					return "gray_cell";
				}
				return "red_cell";
			};
			
			// Value of cell
			scheduler.templates.matrix_cell_value = function(evs){
				if(evs){
					if(evs[0].confirm){
						return self.convert_hour(evs[0].work_time);
					}
					if(evs[0].task){
						return self.convert_hour(evs[0].hour_from)+' à '+self.convert_hour(evs[0].hour_to);
					}
				}
				return '';
			};
			
		},
		
		// Load users (only with event) and do ranged_search for events
		update_timeline_users_filtered: function(){
			var self = this;
			var Users = new instance.web.Model('staff.scheduler');
			var format = instance.web.date_to_str;
			
			var domain = this.get_range_domain();
			
			domain.unshift(['task_id', '!=', null]);
			
			Users.query(['user_id','date']).filter(domain).order_by('user_id').all().then(function(users){
				var usersid = [];
				var sections = [];
				var j=0;
				for(var i=0 ; i<users.length ; i++){
					if(!usersid[users[i]['user_id'][0]]){
						usersid[users[i]['user_id'][0]] = true;
						sections[j++] = {key:users[i]['user_id'][0], label:users[i]['user_id'][1]};
					}
				}
				self.rerender_timeline(sections);
				self.ranged_event_search();
			});
		},
		
		set_staff_tooltip_content: function(evt){
			comment = evt.comment ? evt.comment : '';
			if(evt.confirm){
				$('.staff_tooltip').html('<div>'+this.convert_hour(evt.hour_from)+' - '+this.convert_hour(evt.hour_to)+' ('+_t('duration')+' '+this.convert_hour_duration(evt.hour_from, evt.hour_to)+')</div>'+
					'<div>'+evt.task[1]+'</div>'+
					'<div>'+_t("Entered:")+' '+this.convert_hour(evt.work_time)+'</div>'+
					'<div>'+comment+'</div>'
				);
			}
			else{
				$('.staff_tooltip').html('<div>'+this.convert_hour(evt.hour_from)+' - '+this.convert_hour(evt.hour_to)+' ('+_t('duration')+' '+this.convert_hour_duration(evt.hour_from, evt.hour_to)+')</div>'+
					'<div>'+evt.task[1]+'</div>'+
					'<div>'+_t("No hour entered")+' ('+this.convert_hour(evt.work_time)+')</div>'+
					'<div>'+comment+'</div>'
				);
			}
		},
		
		// Add datas for quick assign
		get_event_data: function(event_obj) {
			var data = this._super.apply(this, arguments);
			data['work_time'] = event_obj.work_time;
			data['confirm'] = true;
			return data;
		},
		
		
		
		get_form_popup_infos: function() {
	        var infos = {
	            view_id: this.form_timecheck_id, // matching table ir_ui_view name == 'timecheck_popup' && model == 'staff.scheduler'
	            title: this.name,
	        };
	        return infos;
	    },
		
		
	});

}