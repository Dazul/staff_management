# -*- coding: utf-8 -*-
##############################################################################
#
#    Copyright (C) 2017 Luis Domingues & Romain Monnard
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
from openerp.osv import orm, fields
from openerp import api
import datetime

class staff_comments(orm.Model):
    _name="staff.comments"
    _columns={
        'comment':fields.text('Comment',required=True),
        'user_id':fields.many2one('res.users', 'User', readonly=False, relate=True),
        'comment_type':fields.many2one('staff.comment.type', 'Comment Type', readonly=False, relate=True, required=True),
        'create_uid':fields.many2one('res.users', 'Author', readonly=True, relate=True),
        'write_date':fields.date('Date of comment',readonly=True ),
    }
    
    @api.model
    def read_group(self, domain, fields, groupby, offset, limit, orderby, lazy):
        print '***Read Group***'
        import pdb; pdb.set_trace()
        return super(staff_comments, self).read_group(domain, fields, groupby, offset, limit, orderby, lazy)

    def read(self, cr, user, ids, args=None, context=None):
        granted_comments = []
        comments = super(staff_comments, self).read(cr, user, ids, args, context)
        auths = self.pool.get("staff.comments.authorization")
        for comment in comments:
            if 'comment_type' not in comment:
                granted_comments.append(comment)
                continue
            match = auths.search(cr, user, [('user_id','=',user),('comment_type','=',comment['comment_type'][0])])
            if len(match) > 0:
                granted_comments.append(comment)
        print len(comments)
        print comments
        print '********************************************************************'
        print len(granted_comments)
        print granted_comments
        return granted_comments

staff_comments()
