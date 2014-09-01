# -*- coding: utf-8 -*-
##############################################################################
#
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

class staff_timesheet(osv.osv):
	_name="staff.timesheet"
	
	_columns={
		'user_id':fields.many2one('res.users', 'User', readonly=True, relate=True),
	}	
	
	#Update elements
	#Make a control to ensure that the user can do the task.
	def write(self, cr, user, ids, vals, context=None):
		return super(staff_timesheet, self).write(cr, user, ids, vals, context)
	
	# add user_id to create the elements
	def create(self, cr, user, vals, context=None):
		return super(staff_timesheet, self).create(cr, user, vals, context)
	
	#Remove an availability with assignement check.
	def unlink(self, cr, uid, ids, context=None):
		return super(staff_scheduler, self).unlink(cr, uid, ids, context)
	
		
staff_timesheet()
