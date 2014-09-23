openerp_staff_management_scheduler = function(instance) {
	var _t = instance.web._t; // For text translations
	
	instance.web.views.add('calendar_scheduler', 'instance.staff_management.Scheduler');
	
	instance.staff_management.Scheduler = instance.staff_management.GeneralScheduler.extend({
	});
}
