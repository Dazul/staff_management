openerp_staff_management_scheduler = function(instance) {
	var _t = instance.web._t; // For text translations
	
	instance.web.views.add('calendar_scheduler', 'instance.staff_management.Scheduler');
	
	instance.staff_management.Scheduler = instance.staff_management.GeneralScheduler.extend({

		init:function(parent, dataset, view_id, options){
			this._super.apply(this, arguments);

			this.set_nbrOfHeaderLines(2);
			this.loadSchedulerData = true;
		},

		update_datas: function(datas, original){
			if(!this.loadSchedulerData || original){
				return this._super.apply(this, arguments);
			}

			var self = this;
			var def_workratio = $.Deferred();
			var def_booking = $.Deferred();

			// Get number of assigned on number of availabilities for the month of this.range_start
			
			list_userID = [];
			this.work_ratio = {};
			for(var i in datas){
				list_userID.push(datas[i].lineID);
				this.work_ratio[i] = [5,10];
			}
			var date_from = new Date(this.range_start.getFullYear(), this.range_start.getMonth(), 1);
			var date_to = new Date(this.range_start.getFullYear(), this.range_start.getMonth() + 1, 0);
			model = new instance.web.Model("staff.scheduler");
			model.call("countActivitie",[list_userID, instance.web.date_to_str(date_from), instance.web.date_to_str(date_to)]).then(function(res){
				self.work_ratio = {};
				for(var i in res){
					self.work_ratio[i] = res[i];
				}
				def_workratio.resolve();
			});

			// Get the number of people in reservation for each days between this.range_start and this.range_stop
			
			var list_dates = [];
			this.booking_numbers = {};
			for(var d = new Date(this.range_start) ; d<=this.range_stop ; d = this.getNextDate(d)){
				list_dates.push(instance.web.date_to_str(d));
				this.booking_numbers[d] = 10;
			}
			var booking = new instance.web.Model('staff.booking');
			
			booking.call("count_nbr_people",list_dates).then(function(res) {
				self.booking_numbers = {};
				for(var d = new Date(self.range_start) ; d<=self.range_stop ; d = self.getNextDate(d)){
					self.booking_numbers[d] = res[instance.web.date_to_str(d)];
				}
				def_booking.resolve();
			});
			
			// Call the super method when all new data are loaded
			$.when(def_workratio, def_booking).then(function(){
				self.update_datas(datas, true);
			});
		},

		renderHeaderCellLeft: function(th, lineID){
			if(lineID == 1){
				return th.text('Utilisateur');
			}
			else if(lineID == 2){
				return th.text('Réservations');
			}
		},

		renderHeaderCell: function(th, lineID, cdate){
			if(lineID == 1){
				th.text(this.format_date(cdate, "ddd dd MMM"));
			}
			else if(lineID == 2){
				return th.addClass('light-weight').text(this.booking_numbers[cdate]);
			}
			return th;
		},

		renderCellLeft: function(th, data){
			var userID = data.lineID;
			return th.append($('<span>').text(data['username'])).append($('<span>').addClass('light-weight').text(' '+this.work_ratio[userID][0]+'/'+this.work_ratio[userID][1]));
		},

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
					button_remove = _.str.sprintf("<button class='oe_button oe_bold removeme'><span> %s </span></button>",_t("Remove"));
					
					pop.$el.closest(".modal").find(".modal-footer").prepend(button_remove);
					
					$('.removeme').click(function() {
						$('.oe_form_button_cancel').trigger('click');
						self.dataset.write(evt.id, {'task_id': false}, {}).done(function() {
							self.refresh_events();
						});
					});
				});

			}
		},


	});
}
