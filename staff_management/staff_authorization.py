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
from openerp import api, fields, models
import datetime

class staff_authorization(models.Model):
	_name="staff.authorization"
	
	task_id = fields.Many2one('account.analytic.account', 'Task', readonly=False)
	user_id = fields.Many2one('res.users', 'User', readonly=False, relate=True)
	create_uid = fields.Many2one('res.users', 'Author', readonly=True)
	write_date = fields.Date('Date of formation',readonly=True )

