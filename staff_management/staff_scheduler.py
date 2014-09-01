# -*- coding: utf-8 -*-
##############################################################################
#
#    Copyright (C) 2013 EIA-FR (https://eia-fr.ch/)
#    Copyright (C) 2014 The DoMo Team (https://launchpad.net/~domo)
#    Luis Domingues & Romain Monnard
#
#    This program is free software: you can redistribute it and/or modify
#    it under the terms of the GNU Affero General Public License as
#    published by the Free Software Foundation, either version 3 of the
#    License, or (at your option) any later version.
#
#    This program is distributed in the hope that it will be useful,
#    but WITHOUT ANY WARRANTY; without even the implied warranty of
#    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#    GNU Affero General Public License for more details.
#
#    You should have received a copy of the GNU Affero General Public License
#    along with this program.  If not, see <http://www.gnu.org/licenses/>.
#
##############################################################################
from openerp.osv import osv, fields
from openerp.osv.orm import except_orm
from openerp.tools.translate import _
from datetime import datetime
import calendar
from staff_utils import staff_utils

class staff_scheduler(osv.osv):
	_name="staff.scheduler"
	
	_columns={
		'user_id':fields.many2one('res.users', 'User', readonly=True, relate=True),
		'task_id':fields.many2one('account.analytic.account', 'Task', readonly=False),
		'date': fields.date('Date', readonly=True),
		'hour_from': fields.float('Start Hour', readonly=False),
		'hour_to': fields.float('End Hour', readonly=False),
		'comment':fields.char('Comment',size= 512 ,required=False),
		'work_time':fields.float('Worked time', readonly=False),
		'confirm':fields.boolean('Confirm', readonly=False),
	}
	
	#Check if the hour from is between 0 and 24
	def _check_hour_to(self,cr,uid,ids):
		for event in self.browse(cr, uid, ids):
			if(event.hour_to < 0 or event.hour_to >= 24):
				return False
		return True
	
	#Check if the hour to is between 0 and 24
	def _check_hour_from(self,cr,uid,ids):
		for event in self.browse(cr, uid, ids):
			if(event.hour_from < 0 or event.hour_from >= 24):
				return False
		return True
	
	_constraints = [(_check_hour_from,_('Start hour must be between 0 and 24.'), ['hour_from']), 
				(_check_hour_to,_('End hour must be between 0 and 24.'), ['hour_to'])]
	
	#Update elements
	#Make a control to ensure that the user can do the task.
	def write(self, cr, user, ids, vals, context=None):
		if context is not None:
			# If write_worked_time on context,
			# write the wirked time on te timesheet
			if 'write_worked_time' in context:
				if 'work_time' in vals:
					worked_time = vals['work_time']
				else:
					worked_time = None
				self.writeTimesheet(cr, user, ids, worked_time)
				return True
		#Records is a list of dictonary. Each dictionary is in this form: [key:(int_id, string_name)]
		records = super(staff_scheduler, self).read(cr, user, ids, None, context)
		#Control if the availability exits when the write is performed
		if len(records) == 0:
			raise osv.except_osv(_('Error'), _("The user removed this availability."))
		#Control if the work time is entered.
		if records[0]['confirm']:
			if context is not None:
				raise osv.except_osv(_('Error'), _("Work time already entered."))
		#Get the authorizations. If the auth list is empty, the authorization don't exist.
		if 'task_id' in vals and vals['task_id'] != False:
			obj = self.pool.get('staff.authorization')
			auth = obj.search(cr, user, [('user_id','=',records[0]['user_id'][0]),('task_id','=',vals['task_id'])])
			if len(auth) == 0:
				raise osv.except_osv(_('Error'), _("This user can not do this task"))
		#Control if the work time is possible.
		if ('hour_from' in vals) and ('hour_to' in vals):
			if vals['hour_to'] < vals['hour_from']:
				raise osv.except_osv(_('Error'), _("You need to specify a correct work time."))
		elif ('hour_from' in vals) and  not ('hour_to' in vals):
			for event in self.browse(cr, user, ids):
				if(event.hour_to < vals['hour_from']):
					raise osv.except_osv(_('Error'), _("You need to specify a correct work time."))
		elif not ('hour_from' in vals) and  ('hour_to' in vals):
			for event in self.browse(cr, user, ids):
				if(vals['hour_to'] < event.hour_from):
					raise osv.except_osv(_('Error'), _("You need to specify a correct work time."))
		#Knowned bug. Need to change the two hours to update the worked time.
		if ('hour_from' in vals) and ('hour_to' in vals):
			#get the break time to substract to the worked time
			time = vals['hour_to'] - vals['hour_from']
			break_management = self.pool.get('staff.break.management')
			breaks = break_management.search(cr, user, [('work_time_min', '<=', time),('work_time_max', '>=', time)])
			if len(breaks) != 0:
				break_length = break_management.browse(cr, user, breaks)[0].break_time
				time = time - break_length
			vals['work_time'] = time
		return super(staff_scheduler, self).write(cr, user, ids, vals, context)
	
	#push the time worked into timesheet
	def writeTimesheet(self, cr, user, ids, worked_time):
		utils = staff_utils()
		schedule_row = self.browse(cr, user, ids[0])
		user_id = schedule_row.user_id.id
		employees = self.pool.get("hr.employee")
		employee_id = employees.search(cr, user, [("user_id", "=", user_id)])[0]
		employee = employees.browse(cr, user, employee_id)
		products = self.pool.get('product.product')
		product = products.browse(cr, user, employee.product_id.id)
		hour_price = product.list_price
		journal_id = employee.journal_id.id
		task_id = schedule_row.task_id.id
		timesheet = self.pool.get("hr_timesheet_sheet.sheet")
		first_day = utils.get_first_day_month(schedule_row.date)
		last_day = utils.get_last_day_month(schedule_row.date)
		sheets = timesheet.search(cr, user, [("date_from", "=", first_day),("user_id", "=", user_id)])
		#Check if the worked time entry is in the future.
		if self.checkFutureDay(datetime.strptime(schedule_row.date, "%Y-%m-%d")):
			raise osv.except_osv(_('Error'), _("You cannot enter worked time in the future."))
		#check if the worked time has been changed.
		if worked_time is None:
			work_time_entry = schedule_row.work_time
		else:
			work_time_entry = worked_time
		amount = work_time_entry * hour_price
		#Enter a new timesheet with the activity
		if len(sheets) == 0:
			line = timesheet.create(cr, user, {'employee_id': employee_id, 'date_from': first_day, 'date_to': last_day})
			timesheet.write(cr, user, [line], {'message_follower_ids': False, 'timesheet_ids': [[5, False, False], [0, False, {'user_id': user_id, 'account_id': task_id, 'journal_id': journal_id, 'general_account_id': 6,'to_invoice': 1, 'amount': amount, 'unit_amount': work_time_entry, 'date': schedule_row.date, 'name': '/'}]], 'employee_id': employee_id, 'date_from': first_day, 'date_to': last_day})
		else:
			#Check if an activity exist. If yes, update, if no, create new one.
			timeLines = self.pool.get("account.analytic.line")
			lines_ids = timeLines.search(cr, user, [('user_id','=', user_id),('date','=',schedule_row.date),('account_id','=', task_id)])
			if len(lines_ids) == 0:
				line = sheets[0]
				timesheet.write(cr, user, [line], {'timesheet_ids': [[0, False, {'user_id': user_id, 'account_id': task_id, 'journal_id': journal_id, 'general_account_id': 6,'to_invoice': 1, 'amount': amount, 'unit_amount': work_time_entry, 'date': schedule_row.date, 'name': '/'}]]})
			else:
				timeLines.write(cr, user, lines_ids, {'unit_amount': work_time_entry, 'amount': amount})
		self.write(cr, user, ids, {'work_time': work_time_entry, 'confirm': True})
		
	# check if past day. Return true if day is in the past
	def checkPastDay(self, dayDate):
		stamp = datetime.now()
		today = datetime(stamp.year, stamp.month, stamp.day)
		return dayDate < today
	
	# check if past day. Return true if day is in the past
	def checkFutureDay(self, dayDate):
		stamp = datetime.now()
		today = datetime(stamp.year, stamp.month, stamp.day)
		return dayDate > today
	
	
	# add user_id to create the elements
	def create(self, cr, user, vals, context=None):
		vals['user_id']=user
		vals['task_id']=False
		#Control if an event is set this day.
		listTasks = self.search(cr, user, [('date','=',vals['date']),('user_id','=',user)])
		if len(listTasks) >= 1:
			raise osv.except_osv(_('Error'), _("You have already an availability this day."))
		#Control if the changed date is in the future.
		#datetime.strptime(vals['date'], "%Y-%m-%d") < datetime.now():
		if self.checkPastDay(datetime.strptime(vals['date'], "%Y-%m-%d")): 
			raise osv.except_osv(_('Error'), _("Only future dates can be changed."))
		return super(staff_scheduler, self).create(cr, user, vals, context)
	
	#Remove an availability with assignement check.
	def unlink(self, cr, uid, ids, context=None):
		records = super(staff_scheduler, self).read(cr, uid, ids, ['id', 'task_id'], context)
		#raise Exception(records) if a user want remove an availibility with a task
		if(records['task_id']):
			raise osv.except_osv(_('Error'), _("You can't delete this availability because there is an assigned task on it."))
		#Check the unlink date.
		date = super(staff_scheduler, self).read(cr, uid, ids, ['date'], context)
		if self.checkPastDay(datetime.strptime(date['date'], "%Y-%m-%d")):
			raise osv.except_osv(_('Error'), _("Only future dates can be changed."))
		return super(staff_scheduler, self).unlink(cr, uid, ids, context)
	
	#Count the activities of the mounth for selected user
	#Return a String like "nb get for a task" / "nb available"
	#User_id is the planner, start and and are the first and last day for the search pool.
	def countActivitie(self, cr, uid, user_id, start, end, context=None):
		listGet = self.search(cr, uid, [('user_id','=',user_id),('date','>=',start),('date', '<=', end), ('task_id','!=',False)])
		listTot = self.search(cr, uid, [('user_id','=',user_id),('date','>=',start),('date', '<=', end)])
		return str(len(listGet)) + " / " + str(len(listTot))

		
staff_scheduler()
