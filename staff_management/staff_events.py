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

class staff_events(osv.osv):
	_name="staff.events"
	_columns={
		'event_name':fields.char('Event',size= 32 ,required=True),
		'date': fields.date('Date', readonly=False),
		'hour_from': fields.float('Start Hour', readonly=False),
		'hour_to': fields.float('End Hour', readonly=False),
	}
	
	_rec_name = 'event_name'
	
	#Check if the hour from is between 0 and 24
	def _check_hour_to(self,cr,uid,ids):
		for event in self.browse(cr, uid, ids):
			if(event.hour_to < 0 or event.hour_to > 24):
				return False
		return True
	
	#Check if the hour to is between 0 and 24
	def _check_hour_from(self,cr,uid,ids):
		for event in self.browse(cr, uid, ids):
			if(event.hour_from < 0 or event.hour_from > 24):
				return False
		return True
	
	_constraints = [(_check_hour_from,'Start hour must be between 0 and 24.', ['hour_from']), 
				(_check_hour_to,'End hour must be between 0 and 24.', ['hour_to'])]
	_sql_constraints = [('unique_date','unique(date)', 'Only one event per day!')]
	
staff_events()
