openerp_staff_management_scheduler = function(instance) {
	var _t = instance.web._t; // For text translations
	
	instance.web.views.add('calendar_scheduler', 'instance.staff_management.Scheduler');
	
	instance.staff_management.Scheduler = instance.staff_management.GeneralScheduler.extend({


		renderCell: function(td, cellDataList){
			td = this._super.apply(this,arguments);
			if(cellDataList.length == 1){
				td.addClass('clickable');
			}
			return td;
		},

		cellClicked: function(lineID, date, cellDataList){
			var self = this;
			if(cellDataList.length == 1){
				
				var evt = cellDataList[0]['event'];

				var pop = new instance.web.form.FormOpenPopup(this);
				pop.show_element(this.dataset.model, evt.id, this.dataset.get_context(), {
					title: _t("Edit Assignment"),
					res_id: evt.id,
					target: 'new',
					readonly:false,
					write_function: function(id, data, _options) {
						return self.dataset.write(id, data, {}).done(function() {
							self.refresh_events();
						});
					},
				});

				var form_controller = pop.view_form;
				form_controller.on("load_record", self, function(){
					button_remove = _.str.sprintf("<button class='oe_button oe_bold oe_highlight removeme'><span> %s </span></button>",_t("Remove Assignment"));
					
					pop.$el.closest(".modal").find(".modal-footer").prepend(button_remove);
					
					$('.removeme').click(function() {
						$('.oe_form_button_cancel').trigger('click');
						//self.remove_event(id);
						alert('not ready');
					});
				});

			}
		},


	});
}
