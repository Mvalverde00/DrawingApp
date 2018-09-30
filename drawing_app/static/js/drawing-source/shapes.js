// First 100 command IDs (0-99) are reserved for Shapes;  Second 100 command IDs (100-199) are reserved for Paths; Third 100 command IDs (200-299) are reserved for Commands
// This is done so on the server side, the type of command can be determined by examing the ID.
COMMAND_IDS = new Array(300);

// Given a child command and its parent, e.g. Rectangle and Shape, setup the constructor properties on Rectangle properly
// and add it to the array of command ids.
// This function must be called after the declaration of EVERY SINGLE NEW COMMAND.
// Because of the way this auto-generates command ids, the order in which commands are declared CANNOT be changed.
// All new commands must be appended to the ends of documents, otherwise the database will have incorrect command ids
// Thus, a command should never be deleted from here either, just make it inaccessible via the GUI/console
function register_command(child, parent) {
    child.prototype = Object.create(parent.prototype); 
    child.prototype.constructor = child;

    switch(parent.name) {
        case 'Shape':
            COMMAND_IDS[register_command.curr_shape_id++] = child;
            break;

        case 'Path':
            COMMAND_IDS[register_command.curr_path_id++] = child;
            break;

        case 'Command':
            // AddShape is a special case, needs its constructor properties set, but does NOT need an identifying ID, because Shapes/Paths have their own IDs
            if (child.name != 'AddShape') COMMAND_IDS[register_command.curr_command_id++] = child;
            break;

    }

}
register_command.curr_shape_id = 0;
register_command.curr_path_id = 100;
register_command.curr_command_id = 200;



function Shape(x, y, width, height, stroke_color, fill_color, fill, line_width=1, theta=0, id=-1) {

    if (width >= 0) {
        this.x = x;
        this.width = width;
    } else {
        // Make sure width is positive
        this.x = x + width;
        this.width = -width;
    }

    if (height >= 0) {
        this.y = y;
        this.height = height;
    } else {
        // Ditto for height
        this.y = y + height;
        this.height = -height;
    }

    this.stroke_color = stroke_color;
    this.fill_color = fill_color;
    this.fill = fill;
    this.line_width = line_width;
    this.theta = theta;

    // ID is initialized at -1 because temporary shapes don't need an ID, and generating an ID for all temp shapes 
    // Causes performance decreases.  Instead, ID is assigned with set_id function, only when the shape has been finalized.
    this.id = id;

    this.set_id = function(id){
        if (this.id == -1) {
            string_to_hash = (this.x + Date.now()).toString();
            this.id = md5(string_to_hash);
        }
    }


    this.package = function() {
        return [this.x, this.y, this.width, this.height, this.stroke_color, this.fill_color, this.fill, this.line_width, this.theta, this.id];
    }
    // When constructing a shape, the only things that changes in real-time are the width and height.
    this.package_inbetween = function(){
        return [this.width, this.height, this.id];
    }
    this.apply_package_inbetween = function(data){
        this.width = data[0];
        this.height = data[1];
    }

    this.render = function(ctx){} // Should be overwritten in class extension with code to draw the shape;

    // Wrap the render function to take care of setup and cleanup
    // If you do any addition setup in the render function, you MUST TAKE CARE OF IT YOURSELF.  This only undoes what is undone here.
    // E.g. a change to globalAlpha or compositeOperation will NOT be undone, you must do it in render().
    this.draw = function(ctx) {

        ctx.lineWidth = this.line_width;
        ctx.strokeStyle = this.stroke_color;
        ctx.fillStyle = this.fill_color;

        [cx, cy] = this.get_center();
        ctx.translate(cx,cy);
        ctx.rotate(this.theta);
        ctx.translate(-cx,-cy);


        this.render(ctx);


        ctx.setTransform(1,0,0,1,-c.camera.x,-c.camera.y);
    }

    // Should be overwritten in class extension with code to test collision.  A default method is provided
    // That will check for collisions within a rectangle surrounding the shape.
    // If you want a shape to be unselectable, just return false
    this.collision_base = function (mx, my) {
        return mx >= this.x - this.line_width/2 && //If click is inside filled shape
            mx <= (this.x + this.width + this.line_width/2) &&
            my >= this.y - this.line_width/2 &&
            my <= (this.y + this.height + this.line_width/2);
    }

    // Wrapper for collision_base function, taking care of necessary steps so you don't need to worry about them.
    this.collision = function(mx, my) { 

        // Shapes can be rotated, in which case their collision box will need to change.  Rotate the mouse coords by the same amount, about the same origin, and then check for collision.
        [mx, my] = this.rotate_point(mx, my);

        return this.collision_base(mx, my)
    }


    this.translate = function(sx, sy, ex, ey) {
        // startX, endX, deltaX

        var dx = ex - sx;
        var dy = ey - sy;

        this.x += dx;
        this.y += dy;

        if (this.hasOwnProperty('p2')) {
            this.p2 = [ this.x + this.width, this.y + this.height];
            this.p3 = [ this.p2[0], this.y ];
        }

    }


    this.draw_selection_box = function(ctx) {
        ctx.setLineDash([10,10]);
        ctx.strokeStyle = '#42e2f4';

        //Outline should be drawn hollow, regardless of whether it is filled or not.  Then return it to inital state
        temp_fill = this.fill;
        this.fill = false;
        this.draw(ctx);
        this.fill = temp_fill;

        ctx.setLineDash([]);
    }

    //Overwritten on Circle
    this.get_center = function() {
        return [this.x + (this.width/2), this.y + (this.height/2)];
    }

    //Also overwritten on Circle
    this.draw_rotation_handle = function(ctx) {
        var [cx, cy] = this.get_center();

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(this.theta);

        //Draw image 5 pixels above the top of the shape.  Also include the line_width, because a thicker line means it needs to be rendered higher
        ctx.drawImage(rotation_image, (-image_width/2), -(Math.abs(this.height/2) + this.line_width/2 + image_height + 10), image_width, image_height);

        ctx.restore();
    }

    this.rotation_handle_collision = function(mx, my) {

        [mx, my] = this.rotate_point(mx, my);

        var [cx, cy] = this.get_center();
        var x = (cx - image_width/2);
        var y = cy - (Math.abs(this.height/2) + this.line_width/2 + image_height + 10);

        return mx >= x && //If click is inside filled shape
        mx <= (x + image_width) &&
        my >= y &&
        my <= (y + image_height);

    }

    this.rotate_point = function(px, py, additional_rotation=0) {

        //The mouse point must be rotated around the center of the shape.  
        var [cx, cy] = this.get_center();

        /*
        //The distance between the point and the center should remain constant; thus the rotation of the point will have a constant radius
        var radius = Math.sqrt( (mx-cx)*(mx-cx) + (my-cy)*(my-cy ));
        
        var point_theta = Math.acos( (mx - cx)/radius );
        var result = point_theta + this.theta

        var x = cx + radius*Math.cos(result);
        var y = cy - radius*Math.sin(result);
        */

        var x = Math.cos(2*Math.PI - this.theta + additional_rotation) * (px - cx) - Math.sin(2*Math.PI - this.theta + additional_rotation) * (py - cy) + cx;
        var y = Math.sin(2*Math.PI - this.theta + additional_rotation) * (px - cx) + Math.cos(2*Math.PI - this.theta + additional_rotation) * (py - cy) + cy;

        return [x, y];
    } 

    // Returns True if a is in between b and c
    this.is_in_between = function(a, b, c, error_margin=2){
        return Math.min(b,c) - error_margin < a && a < Math.max(b,c) + error_margin;
    }



} 

function Rectangle(x, y, width, height, stroke_color, fill_color, fill, line_width=1, theta=0, id=-1) {
    Shape.call(this, x, y, width, height, stroke_color, fill_color, fill, line_width, theta, id);
    this.render = function(ctx) {

        if (this.fill) ctx.fillRect(this.x, this.y, this.width, this.height);

        ctx.strokeRect(this.x, this.y, this.width, this.height); // Stroke a rect even if the shape is filled, to apply the border color.


    }

    this.collision = function(mx, my) {

        [mx, my] = this.rotate_point(mx, my);

        if (this.fill) {
            return mx >= this.x - this.line_width/2 && //If click is inside filled shape
                mx <= (this.x + this.width + this.line_width/2) &&
                my >= this.y - this.line_width/2 &&
                my <= (this.y + this.height + this.line_width/2);
        }
        else {
            let ERROR_MARGIN = 4;

            let top = Utility.customIsPointInPath(mx, my, this.x, this.y, this.x + this.width, this.y, this.line_width/2 + ERROR_MARGIN);
            let bottom = Utility.customIsPointInPath(mx, my, this.x, this.y + this.height, this.x + this.width, this.y + this.height, this.line_width/2 + ERROR_MARGIN);
            let left = Utility.customIsPointInPath(mx, my, this.x, this.y, this.x, this.y + this.height, this.line_width/2 + ERROR_MARGIN);
            let right = Utility.customIsPointInPath(mx, my, this.x + this.width, this.y, this.x + this.width, this.y + this.height, this.line_width/2 + ERROR_MARGIN);

            return top || bottom || left || right;
        }
    }


}
register_command(Rectangle, Shape);
//Rectangle.prototype = Object.create(Shape.prototype); 
//Rectangle.prototype.constructor = Rectangle;

function Line(x, y, width, height, stroke_color, fill_color=null, fill=false, line_width=1, theta=0, id=-1) {
    Shape.call(this, x, y, width, height, stroke_color, fill_color, fill, line_width, theta, id);

    // It is necessary to override the default constructor for these values, because we want them to be negative if they are so.
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;


    this.render = function(ctx) {

        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.stroke();

    }

    this.collision = function(mx, my) {

        return Utility.customIsPointInPath(mx,my, this.x, this.y, this.x + this.width, this.y + this.height, this.line_width/2 + 4);

    }
}
register_command(Line, Shape);


function Circle(x, y, width, height, stroke_color, fill_color, fill, line_width=1, theta=0, id=-1) {
    Shape.call(this, x, y, width, height, stroke_color, fill_color, fill, line_width, theta, id);

    this.radius = round( Math.sqrt( (this.x - (this.x+this.width)) * (this.x - (this.x+this.width)) + (this.y - (this.y+this.height)) * (this.y - (this.y+this.height))  ) ); //Distance formula = radius

    // A good example of when to override the default draw method: a circle requires no rotation, and thus doesn't need the boilerplate code to transform and restore the context
    // There will be a performance gain by not doing the transforms, so we override the method to avoid them.
    this.draw = function(ctx) {
        ctx.lineWidth = this.line_width;
        ctx.strokeStyle = this.stroke_color;

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2*Math.PI);
        
        if (this.fill) {
            ctx.fillStyle = this.fill_color;
            ctx.fill();
        }
        ctx.stroke();

    }

    this.package_inbetween = function() {
        return [this.radius, this.id]; // We can save 8 bytes by simply sending the radius, instead of sending x and y and calculating the radius afterwards
    }
    this.apply_package_inbetween = function(data) {
        this.radius = data[0];
    }
    
    this.collision = function(mx, my) {

        [mx, my] = this.rotate_point(mx, my);

        if (this.fill) return (mx - this.x)*(mx - this.x) + (my - this.y)*(my - this.y) <= this.radius*this.radius;
        else {
            // A ring (annulus) can be created by starting with an outer circle and removing an inner circle
            var ERROR_MARGIN = 5;
            var in_outer_circle = (mx - this.x)*(mx - this.x) + (my - this.y)*(my - this.y) <= (this.radius+ERROR_MARGIN)*(this.radius+ERROR_MARGIN);
            var in_inner_circle = (mx - this.x)*(mx - this.x) + (my - this.y)*(my - this.y) <= (this.radius-ERROR_MARGIN)*(this.radius-ERROR_MARGIN);
            return in_outer_circle && !in_inner_circle;
        }
    }

    this.get_center = function() {
        return [this.x, this.y];
    }

    this.draw_rotation_handle = function(ctx) {
        var [cx, cy] = this.get_center();
        ctx.drawImage(rotation_image, cx, cy - (this.radius + image_height + 5), image_width, image_height);
    }

    this.rotation_handle_collision = function(mx, my) {
        var [cx, cy] = this.get_center();
        var x = (cx - image_width/2);
        var y = cy - (this.radius/2 + image_height + 5)

        return mx >= x && //If click is inside filled shape
        mx <= (x + image_width) &&
        my >= y &&
        my <= (y + image_height);

    }

}
register_command(Circle, Shape);


function Triangle(x, y, width, height, stroke_color, fill_color, fill, line_width=1, theta=0, id=-1) {
    Shape.call(this, x, y, width, height, stroke_color, fill_color, fill, line_width, theta, id);

    this.p2 = [ this.x + this.width, this.y + this.height];
    this.p3 = [ this.p2[0], this.y ];

    this.render = function(ctx) {

        ctx.beginPath();

        ctx.moveTo(this.x, this.y);
        ctx.lineTo( this.x, this.y + this.height);
        ctx.lineTo( this.x + this.width, this.y + this.height);
        ctx.lineTo(this.x, this.y);

        if (this.fill) ctx.fill();

        ctx.stroke();

    }
    this.collision = function(mx, my) {

        // for some reason, the function as-is caused the collision area to be where the triangle WOULD BE if it were flipped
        // 180 degrees.  To fix this, we rotate the mouse coordinates an extra 180 degrees around the center, so they are in-line
        // with the warped collision-area.
        [mx, my] = this.rotate_point(mx, my, Math.PI);


        // Filled collisions calculated using Barycentric coordinate system
        // Full credit goes to https://stackoverflow.com/questions/2049582/how-to-determine-if-a-point-is-in-a-2d-triangle
        if (this.fill) {

            // improve readability
            var p0 = [this.x,this.y];
            var p1 = this.p2;
            var p2 = this.p3;

            var area = .5 * (-p1[1]*p2[0] + p0[1]*(-p1[0] + p2[0]) + p0[0]*(p1[1] - p2[1]) + p1[0]*p2[1]);
            var s = 1/(2*area)*(p0[1]*p2[0] - p0[0]*p2[1] + (p2[1]-p0[1])*mx + (p0[0] - p2[0])*my );
            var t = 1/(2*area)*(p0[0]*p1[1] - p0[1]*p1[0] + (p0[1]-p1[1])*mx + (p1[0] - p0[0])*my );

            return s > 0 && t > 0 && (1-s-t) > 0;
        }
        else {
            var l1 = Utility.customIsPointInPath(mx, my, this.x, this.y, this.p2[0], this.p2[1]);
            var l2 = Utility.customIsPointInPath(mx, my, this.p2[0], this.p2[1], this.p3[0], this.p3[1]);
            var l3 = Utility.customIsPointInPath(mx, my, this.p3[0], this.p3[1], this.x, this.y);
            
            return l1 || l2 || l3;
        }
    }
    this.collision_line_helper = function(mx, my, x1, y1, x2, y2) {
        //y = m*x + b;  b = y - m*x  Not to be confused with mx, aka mouse-x 
        var m = (y2 - y1)/(x2 - x1);
        var b = y1 - m*x1;

        var ERROR_MARGIN = 4;

        var on_line;
        if (m == Infinity) on_line = Math.abs(mx - x1) < ERROR_MARGIN; //A straight line will be undefined, and thus must be handled specially
        else on_line = Math.abs(m*mx + b - my) < ERROR_MARGIN;

        //the or statements account for the fact that, in this implementation, a line from (50,50) to (100,100) is different than a line from (100,100) to (50,50) in terms of x/y and width/height
        var in_x_range = ( ((mx + ERROR_MARGIN) >= x1) && ((mx - ERROR_MARGIN) <= x2) ) || ( ((mx + ERROR_MARGIN) <= x1) && ((mx - ERROR_MARGIN) >= x2) );
        var in_y_range = ( ((my + ERROR_MARGIN) >= y1) && ((my - ERROR_MARGIN) <= y2) ) || ( ((my + ERROR_MARGIN) <= y1) && ((my - ERROR_MARGIN) >= y2) );
        return on_line && in_x_range && in_y_range;
    }

}
register_command(Triangle, Shape);


/////////////////////////////////////////////////////////////////////
//                          ELECTRICAL COMPONENTS                  //
/////////////////////////////////////////////////////////////////////
function Resistor(x, y, width, height, stroke_color, fill_color, fill, line_width=1, theta=0, id=-1) {
    Shape.call(this, x, y, width, height, stroke_color, fill_color, fill, line_width, theta, id);

    this.end_width_percentage = 0.4; // There will always be two ends, equally splitting this width percentage

    this.wave_percentage = 0.6; // Define a number of waves to evenly split this percentage amongst.  This and end_width_percentage should sum to 1.0
    this.waves = 3;

    this.wave_len = this.width * this.wave_percentage / this.waves; // Length of a single wave

    this.render = function(ctx){   

        this.mid = this.y + this.height/2;
        this.top = this.y;
        this.bottom = this.y + this.height;

        ctx.beginPath();
        ctx.moveTo(this.x, this.mid);
        ctx.lineTo(this.x + (this.width * this.end_width_percentage/2), this.mid);

        for (let i = 0; i < this.waves; i++) {
            let base_distance = this.x + (this.width * this.end_width_percentage/2) + (this.wave_len * i);

            ctx.lineTo(base_distance + (this.wave_len/3), this.top); // Mid to Top
            ctx.lineTo(base_distance + (2 * this.wave_len/3) , this.bottom); // Top to Bottom
            ctx.lineTo(base_distance + this.wave_len, this.mid); // Bottom to Mid, so we can start it off again next loop.

        }
        ctx.lineTo(this.x + this.width, this.mid);
        ctx.stroke();

    }


}
register_command(Resistor, Shape);

/*
function inBetween(a, b, c, error_radius=2.0) {
return Math.min(b,c) - 2 < a && a < Math.max(b,c) + 2;
}

function customIsPointInPath(mx, my, x1, y1, x2, y2, error_radius=4.0) {

if (!inBetween(mx, x1, x2)) return false;

if ( Math.abs(x2-x1) <= 0.001 ) return true;

var m = (y2-y1)/(x2-x1);

var b = y1 - m*x1;

var theoretical_y = m*mx + b;
var difference = Math.abs(my - theoretical_y);

var test = (difference <= error_radius)
return test;

}
*/