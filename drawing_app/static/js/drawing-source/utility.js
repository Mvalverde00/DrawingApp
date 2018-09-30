var Utility = {

	//Whether a number, b, is inbetween two other numbers, a and c.
	isInbetween : function(a, b, c, error_radius=2.0) {
					return Math.min(b,c) - error_radius < a && a < Math.max(b,c) + error_radius;
				},
	customIsPointInPath : function(mx, my, x1, y1, x2, y2, error_radius=4.0) {

							if (!this.isInbetween(mx, x1, x2, error_radius)) return false;

							if ( Math.abs(x2-x1) <= 0.001 ) return true;

							var m = (y2-y1)/(x2-x1);

							var b = y1 - m*x1;

							var theoretical_y = m*mx + b;
							var difference = Math.abs(my - theoretical_y);

							var test = (difference <= error_radius)
							return test;
						},
	distance : function(x1, y1, x2, y2){
		// Simple distance formula
		return Math.sqrt( (y2-y1)*(y2-y1) + (x2-x1)*(x2-x1) );
	},
	string_to_array : function(string) {
							let arr = [];
						  	
						  	for (let pair of string.split(';')) {
						  		let sub_arr = pair.split(',');
						  		
						  		if (sub_arr.length > 1) arr.push(sub_arr);
						  	}
						  	return arr;
						  },
	array_to_string : function(arr){
					  	let string = ''
					  	for (let item of arr) {
					  		let addition = item[0] + ',' + item[1] + ';';
					  		string += addition;
					  	}
					  	return string;
					  }

}