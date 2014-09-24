openerp_staff_management_general_schedule = function(instance) {
	
	instance.web.views.add('calendar_general', 'instance.staff_management.GeneralScheduler');
	
	instance.staff_management.GeneralScheduler = instance.staff_management.Timeline.extend({
		
		init:function(parent, dataset, view_id, options){
			this._super.apply(this, arguments);
			
			this.set_interval('day', 1);
			this.set_nbrOfHeaderLines(2);
			
			var curr = new Date; // get current date
			var first = curr.getDate() - curr.getDay(); // First day is the day of the month - the day of the week
			var last = first + 6; // last day is the first day + 6
			
			var firstday = new Date(curr.setDate(first));
			var lastday = new Date(curr.setDate(last));
			
			this.set_range_dates(firstday, lastday);
						
			
		},
		
		view_loading: function (fv) {
		
			var curr = new Date;
			var first = curr.getDate() - curr.getDay();
			var one = new Date(curr.setDate(first));
			
			var two = this.getNextDate(one);
			var three = this.getNextDate(two);
			var four = this.getNextDate(three);
			var five = this.getNextDate(four);
			var six = this.getNextDate(five);
			var seven = this.getNextDate(six);
			
		
			var datas = [
				{
					'html': $('<span>').text('User1'),
					'lineID': 1,
					'cells': [
						{
							'html': $('<span>').text(1),
							'tooltip': $('<span>').text(1),
							'date': one,
						},
						{
							'html': $('<span>').text(2),
							'tooltip': $('<span>').text(2),
							'date': two,
						},
						{
							'html': $('<span>').text(3),
							'tooltip': $('<span>').text(3),
							'date': three,
						},
						{
							'html': $('<span>').text(4),
							'tooltip': $('<span>').text(4),
							'date': four,
						},
						{
							'html': $('<span>').text(5),
							'tooltip': $('<span>').text(5),
							'date': five,
						},
						{
							'html': $('<span>').text(6),
							'tooltip': $('<span>').text(6),
							'date': six,
						},
						{
							'html': $('<span>').text(7),
							'tooltip': $('<span>').text(7),
							'date': seven,
						},
					]
				},
				{
					'html': $('<span>').text('User2'),
					'lineID': 2,
					'cells': [
						{
							'html': $('<span>').text(1),
							'tooltip': $('<span>').text(1),
							'date': one,
						},
						{
							'html': $('<span>').text(2),
							'tooltip': $('<span>').text(2),
							'date': two,
						},
						{
							'html': $('<span>').text(6),
							'tooltip': $('<span>').text(6),
							'date': six,
						},
						{
							'html': $('<span>').text(7),
							'tooltip': $('<span>').text(7),
							'date': seven,
						},
					],
				},
				{
					'html': $('<span>').text('User3'),
					'lineID': 3,
					'cells': [
						{
							'html': $('<span>').text(4),
							'tooltip': $('<span>').text(4),
							'date': four,
						},
						{
							'html': $('<span>').text(7),
							'tooltip': $('<span>').text(7),
							'date': seven,
						},
					],
				},
			];
		
			this.update_datas(datas);
		},
		
		
		renderCell: function(cellDataList){
			if(cellDataList.length == 1){
				return cellDataList[0]['html'];
			}
			return $('<span>');
		},
		
		
	});

}
