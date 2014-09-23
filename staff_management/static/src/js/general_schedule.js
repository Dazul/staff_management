openerp_staff_management_general_schedule = function(instance) {
	
	instance.web.views.add('calendar_general', 'instance.staff_management.GeneralScheduler');
	
	instance.staff_management.GeneralScheduler = instance.staff_management.Timeline.extend({
		
	});

}
