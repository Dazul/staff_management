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

class staff_booking(osv.osv):
	_name="staff.booking"
	_columns={
		'booking_name':fields.char('Booking',size= 40 ,required=True),
		'booking_type':fields.many2one('staff.booking.type', 'Event Type', readonly=False, relate=True),
		'date': fields.date('Date', readonly=False, required=True),
		'date_report': fields.date('Date Report', readonly=False, required=False),
		'come_all_weather': fields.boolean('Come with all weather', readonly=False, required=False),
		'hour_from': fields.float('Start Hour', readonly=False),
		'hour_to': fields.float('End Hour', readonly=False),
		'group_leader_name':fields.char('Group leader name',size= 255 ,required=True),
		'group_leader_address':fields.text('Group leader address'),
		'group_leader_email':fields.char('Group leader email',size= 255),
		'group_leader_tel':fields.char('Group leader Tel',size= 50 ,required=True),
		'nbr_adult':fields.integer('Number of adults', readonly=False, required=True),
		'nbr_child':fields.integer('Number of children', readonly=False, required=True),
		'price_adult':fields.float('Price per adult', readonly=False, required=True),
		'price_child':fields.float('Price per child', readonly=False, required=True),
		'nbr_wheelchair':fields.integer('Number of wheelchair', readonly=False),
		'price_wheelchair':fields.float('Price per wheelchair', readonly=False),
		'meal_included':fields.boolean('Meal included', readonly=False),
		'meal_price_adult':fields.float('Price per adult meal', readonly=False),
		'meal_price_child':fields.float('Price per child meal', readonly=False),
		'total_price':fields.float('Total price', readonly=False),
		'observation':fields.text('Observation'),
		'meal_observation':fields.text('Meal observation'),
		'create_uid': fields.many2one('res.users', 'Created by', readonly=True),
		'write_uid': fields.many2one('res.users', 'Last modification by', readonly=True),
	}
	
	_rec_name = 'booking_name'
	
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
	
	def count_nbr_people(self, cr, uid, date):
		bookings = self.search(cr, uid, [('date', '=', str(date))])
		total_people = 0
		for booking in bookings:
			total_people += self.browse(cr, uid, booking).nbr_adult
			total_people += self.browse(cr, uid, booking).nbr_child
			total_people += self.browse(cr, uid, booking).nbr_wheelchair
		return total_people
	
staff_booking()
