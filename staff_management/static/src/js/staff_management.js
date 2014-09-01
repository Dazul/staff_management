
openerp.staff_management = function(instance) {

	openerp_staff_management_calendar(instance); // import calendar (parent class)
	
	openerp_staff_management_personal_schedule(instance); // import personnal schedule
	openerp_staff_management_scheduler(instance); // import scheduler
	openerp_staff_management_general_schedule(instance); // import general schedule
	openerp_staff_management_timecheck(instance); // import timecheck
	
	openerp_staff_management_calendar_booking(instance); // import calendar booking
	
	//openerp_staff_management_resource(instance);
	
	openerp_staff_management_salary_timeline(instance);

};
