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
from datetime import datetime
import calendar

class staff_utils():

	#Get the first day of month of date passed in parameter
	def get_first_day_month(self, date):
		day = datetime.strptime(date, "%Y-%m-%d")
		start_date = datetime(day.year, day.month, 1)
		return start_date.strftime('%Y-%m-%d')
	
	#Get the last day of month of date passed in parameter
	def get_last_day_month(self, date):
		day = datetime.strptime(date, "%Y-%m-%d")
		last_day = calendar.monthrange(day.year, day.month)[1]
		end_date = datetime(day.year, day.month, last_day)
		return end_date.strftime('%Y-%m-%d')

staff_utils()
