openerp_staff_management_scheduler = function(instance) {
	var _t = instance.web._t; // For text translations
	
	instance.web.views.add('calendar_scheduler', 'instance.staff_management.Scheduler');
	
	instance.staff_management.Scheduler = instance.staff_management.Calendar.extend({
	
		template: "SchedulerView",	
		
		// Init, backup all function of original DHTMLXscheduler
		init:function(parent, dataset, view_id, options){
			init_scheduler_timeline_ext(); // import timeline extension
			
			this.backup = {};
			
			this.backup.dhx_cal_data = scheduler._click.dhx_cal_data;
			this.backup._on_mouse_move = scheduler._on_mouse_move;
			this.backup._on_mouse_up = scheduler._on_mouse_up;
			this.backup._on_mouse_down = scheduler._on_mouse_down;
			this.backup._on_dbl_click = scheduler._on_dbl_click;
			this.backup._on_dbl_click = scheduler._on_dbl_click;
			this.backup.day_start = scheduler.date.day_start;
			this.backup._locate_cell_timeline = scheduler._locate_cell_timeline;
			this.backup.set_sizes = scheduler.set_sizes;
					
			// call parent init function
			this._super.apply(this, arguments);
		},
		
		// Destroy, restore all function of original DHTMLXscheduler
		destroy:function(){		
			scheduler._click.dhx_cal_data = this.backup.dhx_cal_data;
			scheduler._on_mouse_move = this.backup._on_mouse_move;
			scheduler._on_mouse_up = this.backup._on_mouse_up;
			scheduler._on_mouse_down = this.backup._on_mouse_down;
			scheduler._on_dbl_click = this.backup._on_dbl_click;
			scheduler._on_dbl_click = this.backup._on_dbl_click;
			scheduler.date.day_start = this.backup.day_start;
			scheduler._locate_cell_timeline = this.backup._locate_cell_timeline;
			scheduler.set_sizes = this.backup.set_sizes;
			
			var res_events = [];
			scheduler.clearAll();
			this._super();
		},
		
		
		set_staff_tooltip_content_no_event: function(src){
			//$('.staff_tooltip').html('<div>hello</div>');
			return false; // not ready yet
		},
		
		// Load the user list (to create the view) before load the calendar
		view_loading: function(r) {
			this.init_timeline([]);
			this.load_calendar(r);
		},
		
		// When events are loaded
		events_loaded: function() {
			if(scheduler._mode != 'matrix'){
				return;
			}
			this._super.apply(this,arguments);
			this.isRerendering = false; // allow mouse actions when events are loaded
			if($('#staff_quickassign').is(':checked') && this.quick_asign != null){ // set cell css if quick assign mode
				this.quick_asign.applyQuickAssign();
			}
		},
		
		// load the quick assign form
		load_calendar: function(data) {
			data.arch.attrs.mode = 'matrix'; // load matrix only
			this._super.apply(this,arguments);
			this.load_quickassign();
		},
		
		// Load the quickassign form
		load_quickassign: function(){
			dfm_mine = new instance.web.form.DefaultFieldManager(this);
			dfm_mine.extend_field_desc({
				quicktask: {
					relation: "account.analytic.account",
				},
			});
			this.quick_asign = new instance.staff_management.QuickAssign(dfm_mine, // task select
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
			this.quick_asign_hour_start = new instance.web.form.FieldFloat(dfm_mine, // start hour
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
			this.quick_asign_hour_stop = new instance.web.form.FieldFloat(dfm_mine, // end hour
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
			var self = this;
			// add form in html
			this.has_been_loaded.then(function(){
				self.quick_asign.prependTo(self.$el.find('.staff_management_quick_assign_task'));
				self.quick_asign_hour_start.prependTo(self.$el.find('.staff_management_quick_assign_hour_start'));
				self.quick_asign_hour_stop.prependTo(self.$el.find('.staff_management_quick_assign_hour_stop'));
				$('#staff_quickassign').click(function(){
					var $this = $(this);
					if($this.is(':checked')){
						$('.staff_quickassign_form').removeClass('hidden');
					}
					else{
					   	$('.staff_quickassign_form').addClass('hidden');
					   	self.quick_asign.set_value(""); // reset task selection when quit quick assign
					}
				});
			});
		},
		
		// Get the event under the mouse
		staff_get_event: function(e){
			var pos = scheduler._locate_cell_timeline(e);
			if(!pos){
				return false;
			}
			var obj = scheduler.matrix[scheduler._mode];
			if (!obj || obj.render != "cell")
				return false;
			var evs = obj._matrix[pos.y][pos.x];
			if(evs){
				return evs[0];
			}
			return false;
		},
		
		// Override ranged_search to update the lines of timeline
		ranged_search: function() {
			var self = this;
			this.isRerendering = true; // disable mouse action
			scheduler.clearAll();
			$.when(this.has_been_loaded, this.ready).done(function() {
				if(self.last_search[1]['usershow'] || self.last_search[1]['default_task_id']){ // events only filter is active
					self.update_timeline_users_filtered();
				}
				else{
					self.update_timeline_users();	
				}
			});
		},
		
		// Load users (only with event) and do ranged_search for events
		update_timeline_users_filtered: function(){
			var self = this;
			var Users = new instance.web.Model('staff.scheduler');
			var format = instance.web.date_to_str;
			
			Users.query(['user_id','date']).filter(self.get_range_domain()).order_by('user_id').all().then(function(users){
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
		
		// Load users (all) and do ranged_search for events
		update_timeline_users: function(){
			var self = this;
			var Users = new instance.web.Model('res.users');
			// check if there is a filter on user
			var user_filter = new Array();			
			for(i=0 ; i<self.last_search[0].length ; i++){
				if(self.last_search[0][i][0] == 'user_id'){
					if(!self.last_search[1]['usershow']){
						if($.isNumeric(self.last_search[0][i][2])){
							user_filter.push(['id', self.last_search[0][i][1], self.last_search[0][i][2]]);
						}
						else{
							user_filter.push(['name', self.last_search[0][i][1], self.last_search[0][i][2]]);
						}
					}
				}
			}			
			user_filter.push(['active', '=', true]);
			Users.query(['id', 'name']).filter(user_filter).order_by('name').all().then(function(users){
				var sections = [];	
				for(var i=0 ; i<users.length ; i++){
					sections[i] = {key:users[i].id, label:users[i].name};
				}
				self.rerender_timeline(sections);
				self.ranged_event_search();
			});
		},
		
		// Ranged_search for events
		ranged_event_search: function(){
			var self = this;
			this.dataset.read_slice(_.keys(this.fields), {
				offset: 0,
				domain: this.get_range_domain(),
				context: this.last_search[1]
			}).done(function(events) {
				self.dataset_events = events;
				self.events_loaded(events);
			});
		},
		
		// Set the range date to the week
		update_range_dates: function(date) {
			this.range_start = scheduler.date.week_start(date.clone());
			this.range_stop = this.range_start.clone().addWeeks(1).addSeconds(-1);
		},
		
		/*
		 * override get_range_domain
		 * don't load events before date or after date
		 * this is bescause there is a prerender when changing view (next or previous week)
		 * and during this prerender dhtmlx try to draw the events that are already loaded
		 * But if the timeline view don't show all the lines (users), there is a javascript error
		 * because the line don't exist
		 */
		get_range_domain: function() {
			var format = instance.web.date_to_str,
				domain = this.last_search[0].slice(0);
			domain.unshift([this.date_start, '>=', format(this.range_start)]);
			domain.unshift([this.date_start, '<=', format(this.range_stop)]);
			return domain;
		},
		
		// Add datas for quick assign
		get_event_data: function(event_obj) {
			//event_obj.start_date.addHours(-event_obj.start_date.getTimezoneOffset()/60); // fix...
			var data = this._super.apply(this, arguments);
			data['task_id'] = event_obj.task_id;
			data['hour_from'] = event_obj.hour_start;
			data['hour_to'] = event_obj.hour_stop;
			return data;
		},
		
		// Set the new lines for the timeline
		rerender_timeline:function(sections){
			obj = scheduler.matrix['matrix'];
			if(sections.length == 0){
				sections[0] = {key:0, label: _t("No User")};
			}
			obj.y_unit = this.sort_sections(sections);
			// rewrite order
			obj.order = {};
			for(var i=0; i<obj.y_unit.length;i++)
				obj.order[obj.y_unit[i].key]=i;
		},
		
		// quick save & reload event
		quick_save: function(event_id, event_obj) {
			var self = this;
			var data = this.get_event_data(event_obj);
			delete(data.name);
			var index = this.dataset.get_id_index(event_id);
			if (index !== null) {
				event_id = this.dataset.ids[index];
				this.dataset.write(event_id, data, {}).then(function(){
					self.reload_event(event_id);
				});
			}
		},
		
		// For sorting the section (by username)
		sort_sections: function(sections){		
			sections.sort(function(a,b){
				return a.label.toLowerCase().localeCompare(b.label.toLowerCase());
			});
			return sections;
		},
		
		init_weekcal_headband: function(){
			var left = scheduler.matrix["matrix"].dx;
			var nbCol = scheduler.matrix["matrix"].x_size;
			
			var summ = scheduler._x-left-18;
						
			var parent = $('<div></div>')
			
			weekDay = scheduler.date.week_start(new Date()).getDay(); // 1 for french, 0 for english
			
			for(var i=0 ; i<nbCol ; i++){
				var width = Math.floor(summ / (nbCol-i));
				if(i==0){
					width-1;
				}
				
				var d = $('<div></div>');
				d.addClass('staff_weekcal_headband_block staff_weekcal_'+weekDay);
				d.css('width', width-1+'px');
				d.css('left', left-1+'px');
				d.appendTo(parent);
				
				summ -= width;
				left += width;
				weekDay = (weekDay + 1) % 7;
			}
			
			$('.staff_weekcal_headband').empty();
			$('.staff_weekcal_headband').append(parent);
			
		},
		
		// draw the timeline & override timelines functions
		init_timeline:function(sections) {
			var self = this;
			
			$(window).resize(function(){
				this.resize_timeout = setTimeout(function(){
					if($('#staff_quickassign').is(':checked') && self.quick_asign != null){ // set cell css if quick assign mode
						self.quick_asign.applyQuickAssign();
					}
				}, 200);
			});
			
			this.isRerendering = false;
			var locate_cell = scheduler._locate_cell_timeline;
			var self = this;
			scheduler._locate_cell_timeline = function(e){
				if(self.isRerendering){
					return false;
				}
				return locate_cell(e);
			}
			
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
								if($('#staff_quickassign').is(':checked')){	
									evs[i].task_id = self.quick_asign.get_value();
									evs[i].hour_start = self.quick_asign_hour_start.get_value();
									evs[i].hour_stop = self.quick_asign_hour_stop.get_value();
									self.quick_save(evs[i].id, evs[i]);
								}
								else{
									self.open_event(evs[i].id);
								}
							}
						}
					
					}	
				}
				return false;
			}
			
			// disative mouses actions for drag&drop
			scheduler._on_mouse_move=function(e){
				this._drag_id = null;
				this._drag_mode=null;
				this._drag_pos=null;
				return false;
			}
			scheduler._on_mouse_up=function(e){
				this._drag_id = null;
				this._drag_mode=null;
				this._drag_pos=null;
				return false;
			}
			scheduler._on_mouse_down=function(e){
				this._drag_id = null;
				this._drag_mode=null;
				this._drag_pos=null;
				return false;
			}
			
			// create the timeLine
			scheduler.locale.labels.matrix_tab = "Matrix"
			scheduler.locale.labels.section_custom="Section";
			scheduler.config.details_on_create=true;
			scheduler.config.details_on_dblclick=true;
			scheduler.config.xml_date="%Y-%m-%d %H:%i";
			scheduler.config.multi_day = true;
			brief_mode = true; 
			
			if(sections.length == 0){
				sections[0] = {key:0, label:'No User'};
			}
			
			// create timeline
			scheduler.createTimelineView({
				name:	"matrix",
				x_unit:	"day",
				x_date:	"%l %d %M",
				x_step:	1,
				x_size: 7,
				y_unit:	this.sort_sections(sections),
				y_property:	"user_id",
				dy:20,
			});
			
			
			// Load the counter (assigned/available) and display it
			// the counter is for the month of the first day of the week currently displayed
			scheduler.templates["matrix_scale_label"] = function(section_id, section_label, section_options){
			
				var format = instance.web.date_to_str;
				var user_id = section_id;
				
				date_from = self.range_start.clone().moveToFirstDayOfMonth(); // first day of month
				date_to = date_from.clone().addMonths(1).addSeconds(-1); // last day of month
				
				model = new instance.web.Model("staff.scheduler");
				model.call("countActivitie",[section_id, format(date_from), format(date_to)]).then(function(res) {
					// When the counter is loaded, display it
					var text = res;
				   	$('.user_label_'+user_id).each(function(id, elem){
					   	$(elem).text(text);
				   	});
				 });
				return section_label+' <span class="user_add user_label_'+section_id+'"></span>'; // prepare display emplacement
			}

			// Set classes for the cells
			scheduler.templates.matrix_cell_class = function(evs,x,y){
				if (!evs) {
					return "gray_cell";
				}
				if(evs[0].task){
					return "assigned staff_tooltip_show evt_user_"+evs[0].user_id;
				}			
				if (evs.length>0){
					return "available evt_user_"+evs[0].user_id;
				}
				return "red_cell";
			};
			
			// Don't display time from here
			scheduler.templates.event_date=function(d){
				return "";
			}
			
			// Value of cell
			scheduler.templates.matrix_cell_value = function(evs){
				if(evs){
					if(evs[0].task){
						return self.convert_hour(evs[0].hour_from)+' '+scheduler.templates.event_bar_date(evs[0].start_date, evs[0].end_date, evs[0])+evs[0].task[1];
					}
				}
				return '';
			};
			
			// Start the timeline at week start
			scheduler.date.day_start=function(date){
				return scheduler.date.week_start(date);
			}
			
			scheduler._click.dhx_cal_next_month_button = function(e){				
				date = scheduler.date[scheduler._mode+"_start"](scheduler._date); // get date
				date = scheduler.date.add(scheduler.date.week_start(date),6,"day"); // get last day of week
				date = scheduler.date.add(scheduler.date.month_start(date),1,"month"); // get next month
				date = scheduler.date.month_start(date); // ensure to set first day of month
				
				scheduler.setCurrentView(date);
			}
			
			scheduler._click.dhx_cal_prev_month_button = function(e){
				date = scheduler.date[scheduler._mode+"_start"](scheduler._date); // get date
				date = scheduler.date.add(scheduler.date.week_start(date),6,"day"); // get last day of week
				date = scheduler.date.add(scheduler.date.month_start(date),-1,"month"); // get previous month
				date = scheduler.date.month_start(date); // ensure to set first day of month
				
				scheduler.setCurrentView(date);
			}
			
			scheduler.set_sizes=function(){
				var staff_headband = $('.staff_weekcal_headband').get(0);
				var headband_height = 22;
				if(staff_headband == undefined){
					headband_height = 0;
				}
				var replacedNavHeight = this.xy.nav_height - headband_height;
			
				var w = this._x = this._obj.clientWidth-this.xy.margin_left;
				var h = this._y = this._obj.clientHeight-this.xy.margin_top;
				
				//not-table mode always has scroll - need to be fixed in future
				var scale_x=this._table_view?0:(this.xy.scale_width+this.xy.scroll_width);
				var scale_s=this._table_view?-1:this.xy.scale_width;
				
				this.set_xy(this._els["dhx_cal_navline"][0],w,this.xy.nav_height,0,0);
				this.set_xy(this._els["dhx_cal_header"][0],w-scale_x,this.xy.scale_height,scale_s,replacedNavHeight+(this._quirks?-1:1));
				//to support alter-skin, we need a way to alter height directly from css
				var actual_height = this._els["dhx_cal_navline"][0].offsetHeight + $('.staff_weekcal_headband').height();
				if (actual_height > 0) this.xy.nav_height = actual_height;
				
				var data_y=this.xy.scale_height+this.xy.nav_height-headband_height+(this._quirks?-2:0);
				
				if(staff_headband != undefined){
					self.init_weekcal_headband();									
					this.set_xy(staff_headband,w,headband_height,0,data_y+2);
				}
				this.set_xy(this._els["dhx_cal_data"][0],w,h-(data_y+2)-headband_height,0,data_y+headband_height+2);
			}
			
			dateHeadFiller = scheduler.templates["matrix_scale_date"];
			scheduler.templates["matrix_scale_date"] = function(date){
				// Do nothing if the headband is not present
				var staff_headband = $('.staff_weekcal_headband').get(0);
				if(staff_headband == undefined){
					return dateHeadFiller(date);
				}

				$('.staff_weekcal_'+date.getDay()).text();
				var format = instance.web.date_to_str;
				var weekDay = date.getDay();
				var booking = new instance.web.Model('staff.booking');	
				booking.call("count_nbr_people",[format(date)]).then(function(res) {
					// When the counter is loaded, display it
					var text = res;
				   	$('.staff_weekcal_'+weekDay).each(function(id, elem){
					   	$(elem).text(text);
				   	});
				 });
				
				
				return dateHeadFiller(date);
			}
			
			scheduler.templates["matrix_scaley_class"] = function(key, label, data){
				return 'staff_tooltip_show uid_'+key;
			}
			
		}
		
	});
	
	// extend a FieldMany2One for the quick assign function
	instance.staff_management.QuickAssign = instance.web.form.FieldMany2One.extend({
		// color the cells
		applyQuickAssign: function(){
			if(this.quickAssignAuth && this.get_value() !== false){
				$('.available,.assigned').addClass('unselectable');
				
				for(var i=0 ; i<this.quickAssignAuth.length ; i++){
					auth_class = 'evt_user_'+this.quickAssignAuth[i].user_id;
					$('.'+auth_class).removeClass('unselectable');
				}
			}
		},
		
		// change value, reload autorisations
		internal_set_value: function(value_) {
			this._super.apply(this, arguments);
			if(value_ === false){
				$('.unselectable').removeClass('unselectable');
				return;
			}
			var authorization = new instance.web.Model('staff.authorization');		
			var filter = new Array();
			filter.push(['task_id', '=', this.get_value()]);
			var self = this;			
			authorization.query(['task_id', 'user_id']).filter(filter).all().then(function(auth){
				self.quickAssignAuth = auth;
				self.applyQuickAssign();
			});
		},
		
		// instanciation
		initialize_field: function() {
			this.is_started = true;
			instance.web.form.ReinitializeFieldMixin.initialize_field.call(this);
		},
		
	});

};
