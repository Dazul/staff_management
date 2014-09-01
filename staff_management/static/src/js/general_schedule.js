openerp_staff_management_general_schedule = function(instance) {
	
	instance.web.views.add('calendar_general', 'instance.staff_management.GeneralScheduler');
	
	instance.staff_management.GeneralScheduler = instance.staff_management.Scheduler.extend({
		
		template: "GenrealScheduleView",
		
		// Do not load quick assign form
		load_quickassign: function(){
			return false;
		},
		
		set_staff_tooltip_content_no_event: function(src){
			return false;
		},
		
		// draw the timeline & override timelines functions
		init_timeline:function(sections) {
			this._super.apply(this, arguments);
			// rewrite click action
			scheduler._click.dhx_cal_data = function(e){
				return false;
			}
			
			
			// Load the counter (assigned/available) and display it
			// the counter is for the month of the first day of the week currently displayed
			scheduler.templates["matrix_scale_label"] = function(section_id, section_label, section_options){
				return section_label;
			}
			
		},
		
		
	});

}