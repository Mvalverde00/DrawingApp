function Path(x, y, line_width, stroke_color, coords=[], id=-1) {

	this.x = x;
	this.y = y;
	this.line_width = line_width;
	this.stroke_color = stroke_color;

    if (typeof(coords) == 'string') {
        this.coords = Utility.string_to_array(coords);
    } else {
        this.coords = coords;
    }
    // Keep track of index of most recently sent coordinates.  In case Path is initialized without any coords, set it to 0, not -1.
    this.sent_coords_index = Math.max(this.coords.length - 1, 0);

	// See Shape class for explanation
	this.id = id;
    this.set_id = function(id){
        if (this.id == -1) {
            string_to_hash = (this.x + Date.now()).toString();
            this.id = md5(string_to_hash);
        }
    }

    this.add_coords = function(cx, cy){
        // previous coord x, previous coord y
        let [pcx, pcy] = this.coords[this.coords.length - 1];

        // Feel free to refine this number to a suitable
        if (Utility.distance(cx, cy, pcx, pcy) > Math.max(line_width/3, 3)){
            this.coords.push([cx,cy]);
        }
    }

    this.package = function(){};

    this.package_inbetween = function(){
        this.remove_unnecessary_points();

        let coords_to_send = this.coords.slice(this.sent_coords_index);
        this.sent_coords_index = this.coords.length - 1;

        return [Utility.array_to_string(coords_to_send), this.id];
    }
    this.apply_package_inbetween = function(data) {
        data[0] = Utility.string_to_array(data[0]);
        this.coords = this.coords.concat(data[0]); // concat is a javascript method to join the items from two arrays together
    }

    this.remove_unnecessary_points = function(){
        let [sx,sy] = this.coords[this.sent_coords_index]; // start point
        for (let i = this.sent_coords_index + 2; i < this.coords.length; i++) {
            let [ex,ey] = this.coords[i]; // end point
            let [px,py] = this.coords[i-1]; // A point inbetween the start and end, which may or may not need to be removed

            if (Utility.customIsPointInPath(px, py, sx, sy, ex, ey, 5)) {
                this.coords.splice(i -1, 1) // delete the point if it is in the path
                console.log('removing some points');
            }
            else {
                [sx, sy] = [ex, ey]; // Set the starting point to the end of the previous line
            }

        }
    }
}

function FreeDraw(x ,y, stroke_color, line_width=1, coords=[], id=-1) {
	Path.call(this, x, y, line_width, stroke_color, coords, id);

    this.draw = function(ctx) {
        ctx.strokeStyle = this.stroke_color;
        ctx.lineWidth = this.line_width;
        ctx.lineJoin = 'round';

        ctx.beginPath();
        ctx.moveTo(x,y);
        ctx.lineTo(x,y);

        for (let coord of this.coords) {
            ctx.lineTo(coord[0], coord[1]);
        }
        ctx.stroke();

        /**
        // Debugging code to help by showing verticies.
        ctx.lineWidth=1;
        ctx.strokeStyle = '#000000';
        ctx.beginPath();
        ctx.moveTo(x,y);
        for (let coord of this.coords) {
            ctx.arc(coord[0], coord[1],3,0,Math.PI*2);
        }
        ctx.stroke();
        // End of debugging code
        */

    }

    this.package = function() {
        this.sent_coords_index = Math.max(this.coords.length - 1, 0);
    	return [this.x, this.y, this.stroke_color, this.line_width, Utility.array_to_string(this.coords), this.id];
    }

}
register_command(FreeDraw, Path);

function Eraser(x, y, stroke_color, line_width, coords=[x,y], id=-1) {
	Path.call(this, x, y, line_width, stroke_color, coords, id)

    this.draw = function(ctx) {
        ctx.save();
        ctx.strokeStyle = this.STROKE_COLOR;
        ctx.lineWidth = this.line_width;
        ctx.globalCompositeOperation="destination-out";
        ctx.beginPath();
        ctx.moveTo(x, y);

        for (let coord of this.coords) {
            ctx.lineTo(coord[0], coord[1]);
        }
        ctx.stroke();
        ctx.restore();

    };

    this.package = function() {
        this.sent_coords_index = Math.max(this.coords.length - 1, 0);
    	return [this.x, this.y, this.STROKE_COLOR, this.line_width, Utility.array_to_string(this.coords), this.id];
    }
}
register_command(Eraser, Path);