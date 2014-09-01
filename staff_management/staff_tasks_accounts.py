# -*- coding: utf-8 -*-
##############################################################################
#
#    Copyright (C) 2013 EIA-FR (https://eia-fr.ch/)
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

class staff_task_accounts(osv.osv):
	_name="account.analytic.account"
	_inherit="account.analytic.account"
	_rec_name = 'name'
	
	
	#Search the datas in database.
	def name_search(self, cr, user, name='', args=None, operator='ilike', context=None, limit=100):
		user_id = None
		#Control if the domain user_id_for_task is set
		for arg in args:
			if arg[0] == 'user_id_for_task':
				user_id = arg[2]
				break
		#If user_id is none, the domain is not set. So return the parent without changes.
		if user_id is None:
			return super(staff_task_accounts, self).name_search(cr, user, name, args, operator, context, limit)
		#Read the datas, and do the filter befor send it to JavaScript
		records = super(staff_task_accounts, self).name_search(cr, user, name, None, operator, context, limit)
		goodValues = []
		#Get the authorizations
		obj = self.pool.get('staff.authorization')
		#If the user is authorized to do a task, add it to the return list
		for record in records:
			ids = obj.search(cr, user, [('user_id','=',user_id),('task_id','=',record[0])])
			if len(ids) != 0:
				goodValues.append(record)
		return goodValues
	
staff_task_accounts()
