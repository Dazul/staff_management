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
from openerp import api, fields, models

class staff_break_management(models.Model):
	_name="staff.break.management"
	
	work_time_min = fields.Float('Minimum work time', readonly=False)
	work_time_max = fields.Float('Maximum work time', readonly=False)
	break_time = fields.Float('Break time', readonly=False)
	
	_rec_name = 'break_time'

