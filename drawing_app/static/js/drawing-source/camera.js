function Camera(r_width, r_height) {
	this.r_width = r_width;
	this.r_height = r_height;
	this.ctx = null;

	// Virtual width and heights will be same as their real counterparts, because scaling always starts at 1.
	this.v_width = r_width;
	this.v_height = r_height;



	this.x = 0;
	this.y = 0;
	
	// Need to be kept track of to reset zoom
	this.x_offset = 0;
	this.y_offset = 0;
	this.scaled_x_offset = 0;
	this.scaled_y_offset = 0;
	this.transform_only_x = 0;
	this.transform_only_y = 0;

	this.scale = 1;

	this.SCALE_FACTOR = 2;
	this.scale_factor_exponent = 0;


	this.translate_canvas = function (sx, sy, ex, ey) {

		//[sx, sy] = this.untranslate_mouse_coords(sx, sy);
		//[ex, ey] = this.untranslate_mouse_coords(ex, ey);

		let dx = -(ex - sx)/this.scale;
		let dy = -(ey - sy)/this.scale;

		let old_x = this.x;
		let old_y = this.y;

		this.x += dx;
		this.y += dy;

		if (this.x >= 1600) { dx = 1600 - old_x; this.x = 1600 }
		else if (this.x <= -1600) { dx = -1600 - old_x; this.x = -1600 };

		if (this.y >= 900) { dy = 900 - old_y; this.y = 900 }
		else if (this.y <= -900) { dy = -900 - old_y; this.y = -900 };

		this.ctx.translate(-dx, -dy);

		this.transform_only_x = this.x;
		this.transform_only_y = this.y;
	}

	// cx and cy defines the center point around which the canvas will be zoomed
	this.zoom_canvas = function(exponent_delta, cx=null, cy=null) {

		// Undo the previous zoom, resetting the canvas to its 'base' state
		this.undo_current_zoom();

		// Default to zooming around the center of the canvas
		if (cx == null && cy == null) [cx, cy] = this.get_canvas_center();

		// Update the scale with exponent delta
		this.set_scale(exponent_delta);

		this.x_offset = (cx - this.x);
		this.y_offset = (cy - this.y);

		this.scaled_x_offset = cx - ( (cx - this.x)/this.scale);
		this.scaled_y_offset = cy - ( (cy - this.y)/this.scale);


		/**
		// If zooming further out, everything is opposite
		if (exponent_delta < 0) {
			console.log(scaled_x_offset);
			this.x_offset *= -1;
			this.y_offset *= -1;
			scaled_x_offset *= -1;
			scaled_y_offset *= -1;
		}
		*/

		this.x = this.scaled_x_offset;
		this.y = this.scaled_y_offset;
		console.log(this.scaled_x_offset, this.x);

		if (this.x >= 1600) {this.x = 1600; dx = 0}
		else if (this.x <= -1600) {this.x = -1600; dx = 0};

		if (this.y >= 900) {this.y = 900; dy = 0}
		else if (this.y <= -900) {this.y = -900; dy = 0};

		this.ctx.translate(this.x_offset, this.y_offset);
		this.ctx.scale(this.scale, this.scale);
		this.ctx.translate(-this.x_offset, -this.y_offset);

	}

	this.undo_current_zoom = function() {
		this.ctx.translate(this.x_offset, this.y_offset);
		this.ctx.scale(1/this.scale, 1/this.scale);
		this.ctx.translate(-this.x_offset, -this.y_offset);

		this.x = this.transform_only_x;
		this.y = this.transform_only_y;

		this.v_width = r_width;
		this.v_height = r_height;
		this.scale = 1;
	}

	this.set_scale = function(exponent_delta) {

		this.scale_factor_exponent += exponent_delta;
		this.scale = Math.pow(this.SCALE_FACTOR, this.scale_factor_exponent);

		this.v_width = this.r_width/this.scale;
		this.v_height = this.r_height/this.scale;
	}
	
	this.translate_mouse_coords = function (mx, my) {
		return [mx + this.x, my + this.y];
	}
	this.untranslate_mouse_coords = function (mx, my) {
		return [mx - this.x, my - this.y];
	}

	this.get_canvas_center = function(){
		return [this.x + this.v_width/2, this.y + this.v_height/2];
	}

}