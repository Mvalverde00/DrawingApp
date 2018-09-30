function CartesianPlaneBackground() {

	this.BASE_WIDTH = 2;
	this.MULTIPLIER = 2;

	this.TIP_LENGTH = 30;

	this.SPACE = 30;
	this.INTERVAL = 5;

	this.MAJOR_LINE = this.SPACE * this.INTERVAL;

	// Personal canvas and context
	this.p_canvas = document.createElement('canvas');
	this.p_canvas.width = 1600;
	this.p_canvas.height = 900;
	this.p_ctx = this.p_canvas.getContext('2d')

	// Keep track of previous cx and cy to know if we need to re-render
	this.previous_cx = 10;
	this.previous_cy = 10;

	// ctx, mapx, mapy, real width, real height, canvasX, canvasY
	this.render = function(ctx, mapx, mapy, w, h, cx, cy){

		// Only redraw the background-context iff its position has changed.
		if (this.previous_cx != cx || this.previous_cy != cy){
			this.draw_to_p_canvas(mapx, mapy, w, h, cx, cy);
			this.previous_cx = cx;
			this.previous_cy = cy;
		}
		console.log('drawing!')
		ctx.drawImage(this.p_canvas, 0, 0);


		/*
		ctx.lineWidth = this.BASE_WIDTH*this.MULTIPLIER;
		ctx.beginPath();
		this.draw_arrow(ctx, w/2, h/2, -w*2 - cx, h/2);
		this.draw_arrow(ctx, w/2, h/2, w*2 + cx - 2000, h/2);
		this.draw_arrow(ctx, w/2, h/2, w/2, -h*2 - cy);
		this.draw_arrow(ctx, w/2, h/2, w/2, h*2 + cy);
		ctx.stroke();
		*/
	}
	this.draw_to_p_canvas = function(mapx, mapy, w, h, cx, cy) {
		this.p_ctx.clearRect(0,0, 1600, 900);
		this.p_ctx.translate(-cx + w/2,  -cy + h/2);
		this.draw_major_axes(this.p_ctx, w, h);
		this.draw_minor_lines(this.p_ctx, mapx/2, mapy/2);
		this.draw_major_lines(this.p_ctx, mapx/2, mapy/2);
		this.p_ctx.translate(cx -w/2, cy -h/2);
	}

	this.draw_major_axes = function(ctx, w, h){
		let x = w*3/2;
		let y = h*3/2;

		ctx.beginPath();
		ctx.lineWidth = this.BASE_WIDTH * this.MULTIPLIER + 2;
		this.draw_arrow(ctx, 0, 0, x, 0);
		this.draw_arrow(ctx, 0, 0, -x, 0);
		this.draw_arrow(ctx, 0, 0, 0, y);
		this.draw_arrow(ctx, 0, 0, 0, -y);
		ctx.stroke();
	}

	this.draw_arrow = function(ctx, sx, sy, ex, ey) {
		theta = Math.atan2(ey-sy,ey-sy);

		ctx.moveTo(sx,sy);
		ctx.lineTo(ex, ey);
		ctx.lineTo(ex-this.TIP_LENGTH*Math.cos(theta-Math.PI/6), ey-this.TIP_LENGTH*Math.sin(theta-Math.PI/6));
		ctx.lineTo(ex,ey);
		ctx.lineTo(ex-this.TIP_LENGTH*Math.cos(theta+Math.PI/6),ey-this.TIP_LENGTH*Math.sin(theta+Math.PI/6));

	}


										// half of mapx and half of mapy
	this.draw_major_lines = function(ctx, h_mapx, h_mapy){
		ctx.beginPath();
		ctx.lineWidth = this.BASE_WIDTH * this.MULTIPLIER;
		ctx.globalAlpha = 0.5;
		this.draw_major_x_lines(ctx, h_mapx, h_mapy);
		this.draw_major_y_lines(ctx, h_mapx, h_mapy);
		ctx.stroke();
		ctx.globalAlpha = 1;
	}
	this.draw_major_x_lines = function(ctx, h_mapx, h_mapy) {
		for (let x = -h_mapx; x <= h_mapx; x+= this.MAJOR_LINE) {
			ctx.moveTo(x, h_mapy);
			ctx.lineTo(x, -h_mapy);
		}
	}
	this.draw_major_y_lines = function(ctx, h_mapx, h_mapy) {
		for (let y = -h_mapy; y <= h_mapy; y+= this.MAJOR_LINE) {
			ctx.moveTo(-h_mapx, y);
			ctx.lineTo(h_mapx, y);
		}
	}



	this.draw_minor_lines = function(ctx, h_mapx, h_mapy){
		ctx.beginPath();
		ctx.lineWidth = this.BASE_WIDTH;
		ctx.globalAlpha = 0.16;
		this.draw_minor_x_lines(ctx, h_mapx, h_mapy);
		this.draw_minor_y_lines(ctx, h_mapx, h_mapy);
		ctx.stroke();

		ctx.globalAlpha = 1;
	}
	this.draw_minor_y_lines = function(ctx, h_mapx, h_mapy){

		for(let x = -h_mapx; x <= h_mapx; x+= this.SPACE){
			if (x % this.MAJOR_LINE != 0){
				ctx.moveTo(x, h_mapy);
				ctx.lineTo(x,-h_mapy);
			}
		}
	}
	this.draw_minor_x_lines = function(ctx, h_mapx, h_mapy){
		for(let y = -h_mapy; y <= h_mapy; y+= this.SPACE){
			if (y % this.MAJOR_LINE != 0){
				ctx.moveTo(-h_mapx, y);
				ctx.lineTo(h_mapx, y);
			}
		}
	}


}