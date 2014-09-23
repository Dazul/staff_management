openerp_staff_management_timeline_base = function(instance) {
	var _t = instance.web._t;

	instance.staff_management.Timeline = instance.web.View.extend({
	
		template: "staff_timeline",
		
		init:function(parent, dataset, view_id, options){
			this._super.apply(this, arguments);
		},
		
		destroy:function(){
			this._super();
		},
		
	});

};
