odoo.define('staff_management.QuickAssign', function (require) {
"use strict";

var core = require('web.core');
var Model = require('web.DataModel');
var common = require('web.form_common');

var FieldMany2One = core.form_widget_registry.get('many2one');

var FieldQuickAssign = FieldMany2One.extend({
	// color the cells
	applyQuickAssign: function(){
		if(this.quickAssignAuth && this.get_value() !== false){
			$('.staff_assigned,.staff_available').addClass('unselectable');

			for(var i=0 ; i<this.quickAssignAuth.length ; i++){
				auth_class = 'evt_user_'+this.quickAssignAuth[i].user_id;
				$('.'+auth_class).removeClass('unselectable');
			}
		}
	},

	isUserIDAuthorized: function(userID){
		var ret = false;
		if(this.quickAssignAuth && this.get_value() !== false){
			for(var i in this.quickAssignAuth){
				if(this.quickAssignAuth[i].user_id[0] == userID){
					ret = true;
					break;
				}
			}
		}
		else{
			ret = true; // Allow to remove an assignation quickly.
		}
		return ret;
	},

	// change value, reload autorisations
	internal_set_value: function(value_) {
		this._super.apply(this, arguments);
		if(value_ === false){
			$('.unselectable').removeClass('unselectable');
			return;
		}
		var authorization = new Model('staff.authorization');
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
		common.ReinitializeFieldMixin.initialize_field.call(this);
	},
});



core.form_widget_registry.add('quick_assign', FieldQuickAssign);

return FieldQuickAssign;
});
