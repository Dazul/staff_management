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
from openerp.osv import fields
from openerp.osv.orm import TransientModel
from openerp.tools.translate import _
from datetime import datetime
from staff_utils import staff_utils

class staff_pay_push(TransientModel):
	_name="staff.pay.push"
	
	user_id = fields.Many2one('res.users', 'User', relate=True)
	user_id_read = fields.Many2one('res.users', 'User', relate=True)
	amount = fields.Float('Amount', readonly=False)
	creditTotal = fields.Float('Balance total', readonly=False)
	creditMonth = fields.Float('Balance month', readonly=False)
	comment = fields.Char('Comment',size= 255, required=True)
	journal = fields.Many2one('account.analytic.journal', 'Analytic Journal', relate=True)
	analytic_account = fields.Many2one('account.analytic.account', 'Analytic Account', relate=True)
	account = fields.Many2one('account.account', 'General account', relate=True)
	date = fields.Date('Date')
	state = fields.Selection([('init', 'init'),('defineAmount', 'defineAmount')])
	
	
	
	def getDif(self, cr, uid, user_id):
		account_lines = self.pool.get('account.analytic.line')
		user_lines = account_lines.search(cr, uid, [('user_id', '=', user_id)])
		#Excecute SQL for optimization! "For" loop will take too long on future.
		cr.execute('Select sum(amount) from account_analytic_line where user_id = '+str(user_id))
		ammount = cr.fetchone()
		return ammount[0]
	
	def getDifMonth(self, cr, uid, user_id, date):
		utils = staff_utils()
		account_lines = self.pool.get('account.analytic.line')
		user_lines = account_lines.search(cr, uid, [('user_id', '=', user_id)])
		#Excecute SQL for optimization! "For" loop will take too long on future.
		first = utils.get_first_day_month(date.strftime("%Y-%m-%d"))
		last = utils.get_last_day_month(date.strftime("%Y-%m-%d"))
		cr.execute('Select sum(amount) from account_analytic_line where user_id = '+str(user_id)+' and date::date <= \'' +last+ '\' and date::date >= \'' + first + '\'')
		ammount = cr.fetchone()
		return ammount[0]

	
	def get_form_context(self, cr, uid, user_id, date_str):
		user_id = int(user_id)
		creditTotal = self.getDif(cr, uid, user_id)
		date = datetime.strptime(date_str, "%Y-%m-%d")
		creditMonth = self.getDifMonth(cr, uid, user_id, date)
		#Hard coded. TODO some better code on next releases.
		account = [0];
		account_lines = self.pool.get('account.analytic.account')
		account = account_lines.search(cr, uid, [('name', '=', 'Salaires')])
		if len(account) == 0:
			accoundId = 0
		else:
			accoundId = account[0]
		return {'user_id_read': user_id,
				'creditTotal': creditTotal,
				'creditMonth': creditMonth,
				'date': str(date),
				'journal':2,
				'account':1,
				'analytic_account':accoundId,}

	def create(self, cr, uid, vals, context=None):
		if context.has_key('default_user_id_read'):
			user_id = context['default_user_id_read']
			if vals.has_key('journal'):
				journal = vals['journal']
			else:
				journal = 2
			if vals.has_key('account'):
				account = vals['account']
			else:
				account = 1
			account_lines = self.pool.get('account.analytic.line')
			account_lines.create(cr, uid, {'name': vals['comment'], 'account_id': vals['analytic_account'],
											'journal_id':journal, 'user_id':user_id, 'date': vals['date'],
											'amount':-vals['amount'], 'general_account_id':account,}, context)
		return super(staff_pay_push, self).create(cr, uid, vals, context)

	
	def get_month_salaries(self, cr, uid, domain):
		account = self.pool.get('account.analytic.line')
		ids = account.search(cr, uid, domain)
		values = account.browse(cr, uid, ids)
		dic = {}
		for record in values:
			dayInMonth = record.date[8:10]
			dayAmount = record.amount # TODO, add information, creator, ...
			dayWorkTime = record.unit_amount
			if record.user_id.id in dic:
				userDic = dic[record.user_id.id]
				if dayInMonth in userDic:
					listAmount = userDic[dayInMonth]['amounts']
					listAmount.append(dayAmount)
					listWorkTime = userDic[dayInMonth]['timework']
					listWorkTime.append(dayWorkTime)
				else:
					userDic[dayInMonth] = {'timework':[dayWorkTime], 'amounts':[dayAmount]}
			else:
				dic[record.user_id.id] = {'name':record.user_id.name, dayInMonth:{'timework':[dayWorkTime], 'amounts':[dayAmount]}}
		
		return dic

staff_pay_push()
