openerp_staff_management_personal_schedule = function(instance) {
	var _t = instance.web._t; // For text translations
	
	instance.web.views.add('calendar_personal', 'instance.staff_management.PersonalSchedule');
	
	instance.staff_management.PersonalSchedule = instance.staff_management.Calendar.extend({
	
		template: "PersonalScheduleView",
		
		// init, backup scheduler fonctions
		init:function(){
			this.backup = {};
			this.backup.dhx_cal_data = scheduler._click.dhx_cal_data;
			this.backup._on_mouse_move = scheduler._on_mouse_move;
			this.backup._on_mouse_up = scheduler._on_mouse_up;
			this.backup._on_mouse_down = scheduler._on_mouse_down;
			this.backup._on_dbl_click = scheduler._on_dbl_click;
			this.backup.render_data = scheduler.render_data;
			this._super.apply(this,arguments);
			this.init_custom_calendar();
		},
		
		// destroy, restore scheduler fonctions
		destroy:function(){
			scheduler._click.dhx_cal_data = this.backup.dhx_cal_data;
			scheduler._on_mouse_move = this.backup._on_mouse_move;
			scheduler._on_mouse_up = this.backup._on_mouse_up;
			scheduler._on_mouse_down = this.backup._on_mouse_down;
			scheduler._on_dbl_click = this.backup._on_dbl_click;
			scheduler.render_data = this.backup.render_data;
			this._super();
		},
		
		set_staff_tooltip_content: function(evt){
			comment = evt.comment ? evt.comment : '';
			if(evt.confirm){
				$('.staff_tooltip').html('<div>'+this.convert_hour(evt.hour_from)+' - '+this.convert_hour(evt.hour_to)+'</div>'+
					'<div>'+evt.task[1]+'</div>'+
					'<div>'+_t('Worktime entered:')+' '+this.convert_hour(evt.work_time)+'</div>'+
					'<div>'+comment+'</div>'
				);
			}
			else{
				$('.staff_tooltip').html('<div>'+this.convert_hour(evt.hour_from)+' - '+this.convert_hour(evt.hour_to)+'</div>'+
					'<div>'+evt.task[1]+'</div>'+
					'<div>'+comment+'</div>'
				);
			}
		},
		
		// load month when switching
		load_calendar: function(data) {
			data.fields.task_id.selectable = false;
			data.arch.attrs.mode = 'month';
			this._super.apply(this,arguments);	
		},
		
		// load external/sepcials events and display in calendar
		load_staff_events: function(){
			var self = this;
	   		var format = instance.web.date_to_str;
		   	var filter = new Array();
		   	filter.push(['date', '>=', format(this.range_start)]);
		   	filter.push(['date', '<=', format(this.range_stop)]);
			var staffEvents = new instance.web.Model('staff.events');	
			staffEvents.query(['event_name','date', 'hour_from', 'hour_to']).filter(filter).all().then(function(staffEvts){
				for(i=0 ; i<staffEvts.length ; i++){
					classname = 'day'+staffEvts[i].date.toString();
					$('.'+classname+' .dhx_month_head').each(function(index, elem){
						
						date = new Date(staffEvts[i].date);
						
						$(elem).html('<span class="staff_event">'+staffEvts[i].event_name+'</span><span class="staff_event_date">'+date.toString('dd')+'</span>');
					});
					
				}
			});
		},
		
		// override to reload event if delete fail
		delete_event: function(event_id, event_obj) {
			// dhtmlx sends this event even when it does not exist in openerp.
			// Eg: use cancel in dhtmlx new event dialog
			var self = this;
			var index = this.dataset.get_id_index(event_id);
			if (index !== null) {			
				this.dataset.unlink(event_id).fail(function(){
					self.reload_event(event_id);
					self.load_staff_events();
				}).then(function(){
					self.reload_event(event_id);
					self.load_staff_events();
				});
			}
		},
		
		// delete event from view if create fail (don't open popup)
		quick_create: function(event_id, event_obj) {
			var self = this;
			var data = this.get_event_data(event_obj);
			
			if(!this.quick_create_error){
				this.quick_create_error = false;
			}
			
			this.dataset.create(data).done(function(r) {
				var id = r;
				self.dataset.ids.push(id);
				scheduler.changeEventId(event_id, id);
				self.reload_event(id);
			}).fail(function(r, event) {
				if(self.quick_create_error){
					event.preventDefault(); // don't show multiple warning messages
				}
				else{
					self.quick_create_error = true;
					setTimeout(function(){self.quick_create_error = false},200);
				}
				scheduler.deleteEvent(event_id);
			});
		},
		
		// remove all filters except user_id
		do_search: function(domain, context, group_by) {			
			for(i=0 ; i<domain.length ; i++){
				if(domain[i][0] != 'user_id'){
					domain.pop(i);
					i--;
				}
			}
	        this._super.apply(this,arguments);
	    },
		
		// Init the custom calendar & rewrite scheduler functions
		init_custom_calendar:function(){
			
			// For loading external events when the calender is (re)rendererd
			var self = this;
			scheduler.render_data_old = scheduler.render_data;
			scheduler.render_data = function(evs, hold){
				this.render_data_old(evs, hold);
				self.load_staff_events();
			}
			
			// disable double click
			scheduler.config.dblclick_create=0;
			
			// Set classes in cells
			scheduler.templates.month_date_class=function(date,today){
				if(scheduler.date.isDayEvent(date)){
					return "with_events day"+date.toString("yyyy-MM-dd"); 
				}
				return "day"+date.toString("yyyy-MM-dd");
			}
			
			// Text in events
			scheduler.templates.event_bar_text=function(start,end,ev){
				if(ev.task){
					return "<span>"+self.convert_hour(ev.hour_from)+" "+ev.task[1]+"</span>";
				}
				return "";
			}
			
			// Don't display time from here
			scheduler.templates.event_date=function(d){
				return "";
			}
			
			// class in events
			scheduler.templates.event_class=function(start,end,ev){
				if(ev.task){
					return "assigned staff_tooltip_show";
				}
				return "event_hidden";
			}
			
			// Add a event on a day (only one event per day)
			scheduler.date.addDayEvent=function(date){
				if(!scheduler.date.isDayEvent(date)){
					var day = scheduler.date.date_part(date);
					var start = scheduler.date.add(date, 8, 'hour');
					var stop = scheduler.date.add(date, 17, 'hour');
					scheduler.addEvent(start, stop, "event");
				}
			}
			
			// Check if there is an event in the day
			scheduler.date.isDayEvent=function(date){
				var day = scheduler.date.date_part(date);			
				var events = scheduler.getEvents(day,scheduler.date.add(day,1,"day"));
				return (events.length > 0);
			}
			
			// Delete all events of a day
			scheduler.date.deleteDayEvent=function(date){
				var day = scheduler.date.date_part(date);
				var events = scheduler.getEvents(day,scheduler.date.add(day,1,"day"));
				if(events.length > 0){
					for (var a in events) {
						var ev = events[a];
						if(!ev.task){
							scheduler.deleteEvent(ev.id);
						}
					}
				}
			}
			
			// Modify click action for calendar
			scheduler._click.dhx_cal_data=function(e){
				e = e || event;
				// get date of the click
				var date = scheduler.getActionData(e).date;
				// check if there is allready an event
				var events = scheduler.getEvents(date,scheduler.date.add(date,1,"day"));
				if(events.length > 0){
					scheduler.date.deleteDayEvent(date);
					scheduler.update_view();
				}
				else{				
					scheduler.date.addDayEvent(date);
				}
			}
			
			// Modify mouse move action for quick add/remove availabilites
			scheduler._on_mouse_move=function(e){
				if (scheduler._drag_mode){
					var date = scheduler.getActionData(e).date;
					var start, end;
					if (scheduler._drag_mode=="create"){
						start=date;
						if (!scheduler._drag_start){
							scheduler._drag_start=start;
							return; 
						}
						end = start;
						if (end==scheduler._drag_start){
							return;
						}
						scheduler._drag_mode="new-size";
						scheduler.update_view();	
					}
					if (scheduler._drag_mode == "new-size") {
						start = scheduler._drag_start;
						end = date;
						if(end < start){
							var temp = start;
							start = end;
							end = temp;
						}
						scheduler.update_view(); // clear all draging classes
						for(var i=start ; i<=end ; i = scheduler.date.add(i,1,'day')){
							if(scheduler.date.date_part(i) && scheduler._scales[+scheduler.date.date_part(i)]){
								var divElmt = scheduler._scales[+scheduler.date.date_part(i)].parentNode;
								//divElmt.className = 'staffdragevent';	
								$(divElmt).addClass('staffdragevent');	
							}
						}	
					}
				}
			}
			
			// Modify mouse up action for quick add/remove availabilites
			scheduler._on_mouse_up=function(e){
				if (scheduler._drag_mode && scheduler._drag_mode == "new-size"){
					var date = scheduler.getActionData(e).date;
					start = scheduler._drag_start;
					end = date;
					if(end < start){
						var temp = start;
						start = end;
						end = temp;
					}
					var addMode = true;
					if(scheduler.date.isDayEvent(start)){
						addMode = false;
					}
					for(var i=start ; i<=end ; i = scheduler.date.add(i,1,'day')){
						if(addMode){
							scheduler.date.addDayEvent(i);
						}
						else{
							scheduler.date.deleteDayEvent(i);
						}
					}
					//scheduler.update_view(); // clear all draging classes	
					$('.staffdragevent').removeClass('staffdragevent'); // fix bug when drag before today
				}
				this._drag_id = null;
				this._drag_mode=null;
				this._drag_pos=null;
			};
			
			
			// Active mouse down on more elements
			scheduler._on_mouse_down=function(e,src){
				if (this.config.readonly || this._drag_mode) return;
				src = src||(e.target||e.srcElement);
				var classname = src.className && src.className.split(" ")[0];
				switch (classname) {
					case "dhx_event_move":
					case "dhx_wa_ev_body":
						this._drag_mode="move";
						break;
					case "dhx_event_resize":
						this._drag_mode="resize";
						break;
					case "dhx_scale_holder":
					case "dhx_scale_holder_now":
					case "dhx_month_body":	// add this to original function
					case "staff_event":		// add this to original function
					case "dhx_cal_event_line":	// move this here
					case "dhx_cal_event_clear": // move this here
					case "dhx_month_head":
					case "dhx_matrix_cell":
					case "dhx_marked_timespan":
						this._drag_mode="create";
						this.unselect(this._select_id);
						break;
					case "":
						if (src.parentNode)
							return scheduler._on_mouse_down(e,src.parentNode);
					default:
						if (scheduler.checkEvent("onMouseDown") && scheduler.callEvent("onMouseDown", [classname])) {
							if (src.parentNode && src != this) {
								return scheduler._on_mouse_down(e,src.parentNode);
							}
						}
						this._drag_mode=null;
						this._drag_id=null;
						break;
				}
				if (this._drag_mode){
					var id = this._locate_event(src);
					if (!this.config["drag_"+this._drag_mode] || !this.callEvent("onBeforeDrag",[id, this._drag_mode, e]))
						this._drag_mode=this._drag_id=0;
					else {
						this._drag_id= id;
						this._drag_event = scheduler._lame_clone(this.getEvent(this._drag_id) || {});
					}
				}
				this._drag_start=null;
			};
			 
			// Disable double click
			scheduler._on_dbl_click=function(e,src){
				return;
			}
	
		},
		
		
	});
	

};
