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
from openerp import api, fields, models


class staff_task_accounts(models.Model):
	_name="account.analytic.account"
	_inherit="account.analytic.account"
	_rec_name = 'name'

	@api.model
	def name_search(self, name='', args=None, operator='ilike', limit=100):
		user_id = None
		#Control if the domain user_id_for_task is set
		for arg in args:
			if arg[0] == 'user_id_for_task':
				user_id = arg[2]
				break
		#If user_id is none, the domain is not set. So return the parent without changes.
		if user_id is None:
			return super(staff_task_accounts, self).name_search(name, args, operator, limit)
		#Read the datas, and do the filter befor send it to JavaScript
		records = super(staff_task_accounts, self).name_search(name, None, operator, limit)
		goodValues = []
		#If the user is authorized to do a task, add it to the return list
		for record in records:
			ids = self.env['staff.authorization'].search([('user_id','=',user_id),('task_id','=',record[0])])
			if len(ids) != 0:
				goodValues.append(record)
		return goodValues

staff_task_accounts()
