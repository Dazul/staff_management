openerp_staff_management_timecheck = function(instance) {
	var _t = instance.web._t; // For text translations
	
	instance.web.views.add('calendar_timecheck', 'instance.staff_management.TimeCheck');
	
	instance.staff_management.TimeCheck = instance.staff_management.Scheduler.extend({
	});
}
