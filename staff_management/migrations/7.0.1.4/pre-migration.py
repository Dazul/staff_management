# -*- coding: utf-8 -*-
##############################################################################
#
#    Copyright (C) 2013 EIA-FR (https://eia-fr.ch/)
#	 Copyright (C) 2014 The DoMo Team (https://launchpad.net/~domo)
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

import logging
from openerp import pooler

logger = logging.getLogger('upgrade')


def migrate(cr, installed_version):
	
	logger.info("Migrating Staff management from version %s", installed_version)
	pool = pooler.get_pool(cr.dbname)
	accounts = pool.get("account.analytic.account")
	
	cr.execute("ALTER TABLE staff_scheduler DROP CONSTRAINT staff_scheduler_task_id_fkey")
	cr.execute("ALTER TABLE staff_authorization DROP CONSTRAINT staff_authorization_task_id_fkey")

	newTasks = []
	cr.execute("Select * from staff_tasks")
	oldTasks = cr.fetchall()

	for task in oldTasks:
		task_id = task[0]
		task_name = task[5]
		new_id = accounts.create(cr, 1, {'message_follower_ids': False, 'code': False, 'name': task_name, 'to_invoice': False, 'partner_id': False, 'description': False, 'date_start': '2014-03-15', 'company_id': 1, 'message_ids': False, 'currency_id': 6, 'parent_id': False, 'manager_id': False, 'date': False, 'pricelist_id': False, 'type': 'normal', 'template_id': False, 'use_timesheets': True})
		
		
		cr.execute("UPDATE staff_scheduler SET task_id = " + str(new_id) + " WHERE task_id = " +  str(task_id))
		cr.execute("UPDATE staff_authorization SET task_id = " +  str(new_id) + " WHERE task_id = " +  str(task_id))
