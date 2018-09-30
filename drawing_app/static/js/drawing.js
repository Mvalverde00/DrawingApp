//###########################################################
//                       Global Vars
//###########################################################
 

//All mouse-related variables
var mouse = {
    x : 0,
    y : 0,
    startX : 0,
    startY : 0,
    isDown : false
}

// 20x20 rotation handle image
const image_height = 30;
const image_width = 30;
const rotation_image = new Image();
rotation_image.src = '/static/img/rotate.png';

//Localize mouse coordinates to canvas
function setMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect(), 
        scaleX = canvas.width / rect.width,    
        scaleY = canvas.height / rect.height; 
  
      mouse.x = (evt.clientX - rect.left) * scaleX,
      mouse.y = (evt.clientY - rect.top) * scaleY
}  

//###########################################################
//                    Auxiliary Classes
//###########################################################

function Settings(stroke_color, fill_color, fill, tool, thickness) {
    this.stroke_color = stroke_color;
    this.fill_color = fill_color;
    this.fill = fill;
    this.tool = tool;
    this.thickness = thickness;

    this.set_tool = function(tool) {
        tool = parseInt(tool);
        //Try to prevent tampering by ensuring tool will be a number as it should be
        if ( typeof(tool) == "number") {
            this.tool = tool;
        }
        else {
            this.tool = 0;
        } 

    }

    this.set_stroke_color = function(stroke_color) {
        this.stroke_color = stroke_color;
    }
    this.set_fill_color = function(fill_color) {
        this.fill_color = fill_color;
    }
    this.set_fill = function(fill) {
        this.fill = fill;
    }

}

function User(username) {
    this.username = username;
    this.settings = new Settings('#000000', '#ffffff', false, 0, 5);
}

//###########################################################
//                          Shapes
//###########################################################

function Shape(x, y, width, height, stroke_color, fill_color, fill, line_width=1, theta=0) {

	/*If the shape is drawn backwards (right to left), the width will be negative.  This causes problems in other functions
	  So we make the width positive, and subtract from starting x coordinate to compensate.

	  Also, this is incredibly messy, and you may wonder why all the if statements are necessary (this could easily be expressed much easier with just 2 if statements).
	  Due to the implementation of Datamanger.package, this.x must be the first declaration, followed by this.y, followed by this.width, followed by this.height.  
	  Declaring them out of order breaks everything, and I cannot find a way to fix this, despite a solid hour of testing various "clean" fixes.
	*/
	if (width < 0) {
		this.x = (x + width);
	}
	else {
	    this.x = x;
	}

	if (height < 0) {
		this.y = (y + height);
	}
	else {
		this.y = y;
	}

	if (width < 0) {
		this.width = (width * -1);
	}
	else {
	    this.width = width;
	}

	if (height < 0) {
		this.height = (height * -1);
	}
	else {
	    this.height = height;
	}

    this.stroke_color = stroke_color;
    this.fill_color = fill_color;
    this.fill = fill;
    this.line_width = line_width;
    this.theta = theta;

    this.draw = function() {}

    this.collision = function() { return false;}

    this.translate = function(sx, sy, ex, ey) {
        // sourceX, endX, deltaX

        var dx = ex - sx;
        var dy = ey - sy;

        this.x += dx;
        this.y += dy;

        if (this.hasOwnProperty('p2')) {
            this.p2 = [ this.x + this.width, this.y + this.height];
            this.p3 = [ this.p2[0], this.y ];
        }

    }

    this.get_center = function() {}

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

        //Draw image 5 pixels above the top of the shape
        ctx.drawImage(rotation_image, (-image_width/2), -(this.height/2 + image_height + 5), image_width, image_height);

        ctx.restore();
    }

    this.rotation_handle_collision = function(mx, my) {

        [mx, my] = this.rotate_point(mx, my);

        var [cx, cy] = this.get_center();
        var x = (cx - image_width/2);
        var y = cy - (this.height/2 + image_height + 5)

        return mx >= x && //If click is inside filled shape
        mx <= (x + image_width) &&
        my >= y &&
        my <= (y + image_height);

    }

    this.rotate_point = function(px, py) {

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

        var x = Math.cos(2*Math.PI - this.theta) * (px - cx) - Math.sin(2*Math.PI - this.theta) * (py - cy) + cx;
        var y = Math.sin(2*Math.PI - this.theta) * (px - cx) + Math.cos(2*Math.PI - this.theta) * (py - cy) + cy;

        return [x, y];
    } 



} 

function Rectangle(x, y, width, height, stroke_color, fill_color, fill, theta=0) {
    Shape.call(this, x, y, width, height, stroke_color, fill_color, fill, theta);
    this.draw = function(ctx) {

        ctx.save();

        [cx, cy] = this.get_center();
        ctx.translate(cx, cy);
        ctx.rotate(this.theta);

        if (this.fill) {
            ctx.fillStyle = this.fill_color;
            ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
        }
        ctx.strokeStyle = this.stroke_color;
        ctx.strokeRect(-this.width/2, -this.height/2, this.width, this.height);

        ctx.restore();

    }

    this.collision = function(mx, my) {

        [mx, my] = this.rotate_point(mx, my);

        if (this.fill) {
            return mx >= this.x && //If click is inside filled shape
            mx <= (this.x + this.width) &&
            my >= this.y &&
            my <= (this.y + this.height);
        }
        else {
            //console.log(mx + ' vs ' + x + ' to ' + (x + width) );
            //console.log(my + ' vs ' + y + ' to ' + (y + height) );
            var ERROR_MARGIN = 4;
            var valid_top_bottom = (mx >= this.x && mx <= (this.x + this.width)) && (Math.abs(my - this.y) < ERROR_MARGIN || Math.abs(my - (this.y + this.height)) < ERROR_MARGIN);
            var valid_left_right = (my >= this.y && my <= (this.y + this.height)) && (Math.abs(mx - this.x) < ERROR_MARGIN || Math.abs(mx - (this.x + this.width)) < ERROR_MARGIN);

            //console.log('valid_top_bottom: ' + valid_top_bottom);
            //console.log('valid_left_right: ' + valid_left_right);
            return valid_top_bottom || valid_left_right;
        }
    }


}

function Line(x, y, width, height, stroke_color, fill_color=null, fill=false, theta=0) {
    Shape.call(this, x, y, width, height, stroke_color, fill_color, fill, theta);

    this.draw = function(ctx) {

        ctx.save();
        
        [cx, cy] = this.get_center();
        ctx.translate(cx, cy);
        ctx.rotate(this.theta);

        ctx.strokeStyle = this.stroke_color;
        ctx.beginPath();
        ctx.moveTo(-this.width/2, -this.height/2);
        ctx.lineTo(this.width/2, this.height/2);
        ctx.stroke();

        ctx.restore();
    }

    this.collision = function(mx, my) {

        [mx, my] = this.rotate_point(mx, my);

        //y = m*x + b;  b = y - m*x  Not to be confused with mx, aka mouse-x 
        var m = ((this.y + this.height) - this.y)/((this.x + this.width) - this.x);
        var b = this.y - m*this.x;

        ERROR_MARGIN = 5;
        var on_line = Math.abs(m*mx + b - my) < ERROR_MARGIN; // Check if point falls on line
        //the or statesments account for the fact that, in this implementation, a line from (50,50) to (100,100) is different than a line from (100,100) to (50,50) in terms of x/y and width/height
        var in_x_range = ( ((mx + ERROR_MARGIN) >= this.x) && ((mx - ERROR_MARGIN) <= (this.x + this.width)) ) || ( ((mx + ERROR_MARGIN) <= this.x) && ((mx - ERROR_MARGIN) >= (this.x + this.width)) );
        var in_y_range = ( ((my + ERROR_MARGIN) >= this.y) && ((my - ERROR_MARGIN) <= (this.y + this.height)) ) || ( ((my + ERROR_MARGIN) <= this.y) && ((my - ERROR_MARGIN) >= (this.y + this.height)) );

        return on_line ||  (in_x_range && in_y_range);

    }
}

function FreeDraw(x ,y, stroke_color, coords=[]) {
    this.x = x;
    this.y = y;
    this.stroke_color = stroke_color;

    this.coords = coords;

    this.draw = function(ctx) {
        ctx.strokeStyle = this.stroke_color;
        ctx.beginPath();
        ctx.moveTo(x,y);
        ctx.lineTo(x,y);

        for (let coord of this.coords) {
            ctx.lineTo(coord[0], coord[1]);
        }
        ctx.stroke();
    }

}

function Circle(x, y, width, height, stroke_color, fill_color, fill, theta=0) {
    Shape.call(this, x, y, width, height, stroke_color, fill_color, fill, theta);

    this.radius = Math.sqrt( (this.x - (this.x+this.width)) * (this.x - (this.x+this.width)) + (this.y - (this.y+this.height)) * (this.y - (this.y+this.height))  ); //Distance formula = radius

    this.draw = function(ctx) {
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2*Math.PI);
        
        if (this.fill) {
            ctx.fillStyle = this.fill_color;
            ctx.fill();
        }
        ctx.strokeStyle = this.stroke_color;
        ctx.stroke();

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

function Triangle(x, y, width, height, stroke_color, fill_color, fill, theta=0) {
    Shape.call(this, x, y, width, height, stroke_color, fill_color, fill, theta);

    this.p2 = [ this.x + this.width, this.y + this.height];
    this.p3 = [ this.p2[0], this.y ];

    this.draw = function(ctx) {

        ctx.save();
        
        [cx, cy] = this.get_center();
        ctx.translate(cx, cy);
        ctx.rotate(this.theta);


        ctx.beginPath();
        ctx.moveTo(-this.width/2, -this.height/2);
        ctx.lineTo( -this.width/2, this.height/2);
        ctx.lineTo( this.width/2, this.height/2);
        ctx.lineTo(-this.width/2, -this.height/2);

        if (this.fill) {
            ctx.fillStyle = this.fill_color;
            ctx.fill();
        }

        ctx.strokeStyle = this.stroke_color;
        ctx.stroke();

        ctx.restore();
    }
    this.collision = function(mx, my) {

        [mx, my] = this.rotate_point(mx, my);

        //Filled collisions calculated using Barycentric coordinate system
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
            var l1 = this.collision_line_helper(mx, my, this.x, this.y, this.p2[0], this.p2[1]);
            var l2 = this.collision_line_helper(mx, my, this.p2[0], this.p2[1], this.p3[0], this.p3[1]);
            var l3 = this.collision_line_helper(mx, my, this.p3[0], this.p3[1], this.x, this.y);
            
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

function Eraser(x, y) {
    this.x = x;
    this.y = y;

    this.STROKE_COLOR = '#ffffff';

    this.coords = [];

    this.draw = function(ctx) {
        ctx.save();
        ctx.strokeStyle = this.STROKE_COLOR;
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.moveTo(x, y);

        for (let coord of this.coords) {
            ctx.lineTo(coord[0], coord[1]);
        }
        ctx.stroke();
        ctx.restore();

    };
}

//Used in ShapeManager to keep track of selected shape state
ShapeStates = {
    NOSHAPE : "No shape selected",
    SELECTED : "Selected",
    MOVING : "Moving",
    ROTATING : "Rotating",
    RESIZING : "Resizing"
}

//ID is position in array
COMMAND_IDS = [Rectangle, Line, FreeDraw, Circle, Triangle, Eraser, Move, Rotate];


//###########################################################
//                 Commands/Command Manager
//###########################################################

function Command(execute, undo) {
    this.execute = execute;
    this.undo = undo;
}

function AddShape(shape) {
    this.shape = shape;
    this.execute = function(array) {
        array.push(this.shape);
    }
    this.undo = function(array) {
        array.pop();
    }
}

function Move(shape, sx, sy, dx, dy) {
    this.shape = shape;
    this.sx = sx;
    this.sy = sy;
    this.dx = dx;
    this.dy = dy;
    this.execute = function(){
        this.shape.translate(this.sx, this.sy, this.dx, this.dy);
    }
    this.undo = function() {
        this.shape.translate(this.dx, this.dy, this.sx, this.sy);
    }
}

function Rotate(shape, dx, dy) {
    this.shape = shape;
    [cx, cy] = this.shape.get_center();
    this.opp = (cx - dx);
    this.adj = (cy - dy);

    //Because the rotation treats directly above as the starting point, the function must be shifted PI/2
    this.theta = Math.atan2(this.adj, this.opp) - Math.PI/2 - this.shape.theta;

    this.execute = function() {
        this.shape.theta += this.theta;
    }
    this.undo = function() {
        this.shape.theta -= this.theta;
    }

}

function ShapeManager(ctx, cw, ch) {
    this.ctx = ctx;
    this.cw = cw;
    this.ch = ch;  

    this.shapes = []; //main array used for rendering
    this.command_history = []; //allow undo
    this.undo_history = []; //allow redo

    this.current_shape = null;
    this.current_shape_state = ShapeStates.NOSHAPE;
    this.current_transformation = null;

    //Execute command, save command to history, and clear previous history
    this.execute_command = function(command) {
        command.execute(this.shapes);
        this.command_history.push(command);

        this.undo_history = []; //Undo history is cleared when a command is executed.

        this.render();
    };

    //Undo command, save command to history
    this.undo_command = function() {
        command = this.command_history.pop();
        command.undo(this.shapes);
        this.undo_history.push(command);

        this.current_shape = null;
        this.current_shape_state = ShapeStates.NOSHAPE;
        this.current_transformation = null;

        this.render();
    };
    
    this.redo_command = function() {
        command = this.undo_history.pop();
        command.execute(this.shapes);
        this.command_history.push(command);

        this.current_shape = null;
        this.current_shape_state = ShapeStates.NOSHAPE;
        this.current_transformation = null;

        this.render();
    }

    this.render = function() {
        this.ctx.clearRect(0, 0, this.cw, this.ch); 

        //The current transformation must be applied, rendered, and undone to give the illusion that the shape is moving
        //without actually moving it until the mouse is lifted

            if (this.current_transformation != null) this.current_transformation.execute();

            for(let shape of this.shapes) { 
                shape.draw(this.ctx);
            }

            //Selection box should be drawn on top of everything else, but before the temp transformation is undone
            if (this.current_shape_state != ShapeStates.NOSHAPE) {
                this.current_shape.draw_selection_box(this.ctx);
                this.current_shape.draw_rotation_handle(this.ctx);
            }

            if (this.current_transformation != null) this.current_transformation.undo();

    }

    this.get_collision = function(x, y) {
        for (var i = this.shapes.length - 1; i >= 0; i--) {
            if (this.shapes[i].hasOwnProperty('collision')) {
                if (this.shapes[i].collision(x, y)) return this.shapes[i];
            }
        }
        return null; 
    }
}

//###########################################################
//                          Main Class
//###########################################################

var c = new function() {
    this.canvas = document.getElementById('canvas');
    this.ctx = canvas.getContext('2d');
    this.user = new User("testuser");

    this.shape_manager = new ShapeManager(this.ctx, this.canvas.width, this.canvas.height);

    this.temp_freedraw;

    canvas.addEventListener('mousedown', function(e) {
        mouse.isDown = true;
        mouse.startX = mouse.x;
        mouse.startY = mouse.y;
        
        if (c.user.settings.tool == 2) {
            c.temp_freedraw = new FreeDraw(mouse.startX, mouse.startY, c.user.settings.stroke_color);
            c.shape_manager.current_shape = c.temp_freedraw;
        }
        if (c.user.settings.tool == 5) {
            c.shape_manager.current_shape = new Eraser();
        }
        if (c.user.settings.tool == 6) {

            clicked_shape = c.shape_manager.get_collision(mouse.x, mouse.y);

            //If there is no shape selected, try to select one
            if (c.shape_manager.current_shape_state == ShapeStates.NOSHAPE) {
                c.shape_manager.current_shape = clicked_shape;
                if (c.shape_manager.current_shape != null) c.shape_manager.current_shape_state = ShapeStates.MOVING;
            }
            else if (c.shape_manager.current_shape_state == ShapeStates.SELECTED) {
                if (c.shape_manager.current_shape ===  clicked_shape) c.shape_manager.current_shape_state = ShapeStates.MOVING;
                else if (c.shape_manager.current_shape.rotation_handle_collision(mouse.x, mouse.y)) c.shape_manager.current_shape_state = ShapeStates.ROTATING;
                else if (clicked_shape != null) {
                    c.shape_manager.current_shape = clicked_shape;
                    c.shape_manager.current_shape_state = ShapeStates.MOVING;
                }
                else c.shape_manager.current_shape_state = ShapeStates.NOSHAPE;
            }
        }

    } , false);

    canvas.addEventListener('mouseout', function(e) {
        console.log('mouse out');
        window.getSelection().removeAllRanges(); // When leaving the canvas, sometimes the buttons get auto-selected which is bad
        c.onMouseUp();
    }, false);
    canvas.addEventListener('mouseup', function(e) {
        c.onMouseUp();
    } , false);

    canvas.addEventListener('mousemove', function(e) {
        c.shape_manager.render();
        setMousePos(canvas, e);
        if (mouse.isDown) {
            switch (c.user.settings.tool) {
                case 0:
                    c.shape_manager.current_shape = new Rectangle(mouse.startX, mouse.startY, mouse.x - mouse.startX, mouse.y - mouse.startY, c.user.settings.stroke_color, c.user.settings.fill_color, c.user.settings.fill);
                    c.shape_manager.current_shape.draw(c.ctx);
                    break;
                case 1:
                    c.shape_manager.current_shape = new Line(mouse.startX, mouse.startY, mouse.x - mouse.startX, mouse.y - mouse.startY, c.user.settings.stroke_color);
                    c.shape_manager.current_shape.draw(c.ctx);
                    break;
                case 2:
                    c.temp_freedraw.coords.push([mouse.x, mouse.y]);
                    c.shape_manager.current_shape.draw(c.ctx);
                    break;
                case 3:
                    c.shape_manager.current_shape = new Circle(mouse.startX, mouse.startY, mouse.x - mouse.startX, mouse.y - mouse.startY, c.user.settings.stroke_color, c.user.settings.fill_color, c.user.settings.fill);
                    c.shape_manager.current_shape.draw(c.ctx);
                    break;
                case 4:
                    c.shape_manager.current_shape = new Triangle(mouse.startX, mouse.startY, mouse.x - mouse.startX, mouse.y - mouse.startY, c.user.settings.stroke_color, c.user.settings.fill_color, c.user.settings.fill);
                    c.shape_manager.current_shape.draw(c.ctx);
                    break;
                case 5:
                    c.shape_manager.current_shape.coords.push([mouse.x, mouse.y]);
                    c.shape_manager.current_shape.draw(c.ctx);
                    break;
                case 6:

                    //Add temp transformations
                    if (c.shape_manager.current_shape_state == ShapeStates.MOVING) {
                        c.shape_manager.current_transformation = new Move(c.shape_manager.current_shape, mouse.startX, mouse.startY, mouse.x, mouse.y);
                    }
                    else if (c.shape_manager.current_shape_state == ShapeStates.ROTATING) {
                        c.shape_manager.current_transformation = new Rotate(c.shape_manager.current_shape, mouse.x, mouse.y);
                    }

                    break;
                default:
                    break;
            }
        }

    }, false);

    this.onMouseUp = function(){
        /**
        TODO: No longer directly execute commands
        Instead:
        Send command to server
        Validate command
        if valid, broadcast to all connected clients and store in database
        if not valid, ignore it
        Clients receive data, store and draw shape
        */
        mouse.isDown = false;
        
        if (this.user.settings.tool == 6) {

            if (this.shape_manager.current_shape_state == ShapeStates.MOVING) {
                    //To prevent unintentional moves (such as when selecting the shape), the shape must be moved at least 1 pixel in order for a command to be sent
                    if ( Math.sqrt((mouse.startX - mouse.x)*(mouse.startX - mouse.x) + (mouse.startY - mouse.y)*(mouse.startY - mouse.y)) > 1 ) {
                        this.shape_manager.execute_command(new Move(this.shape_manager.current_shape, mouse.startX, mouse.startY, mouse.x, mouse.y));
                    }
                    this.shape_manager.current_transformation = null;
                    this.shape_manager.current_shape_state = ShapeStates.SELECTED;
            }
            else if (this.shape_manager.current_shape_state == ShapeStates.ROTATING) {
                this.shape_manager.execute_command(new Rotate(this.shape_manager.current_shape, mouse.x, mouse.y));
                this.shape_manager.current_transformation = null;
                this.shape_manager.current_shape_state = ShapeStates.SELECTED;
            }

        }
        else {
            if (this.shape_manager.current_shape != null) {
                sendShape(DataManager.package(this.shape_manager.current_shape));
                this.shape_manager.execute_command(new AddShape(this.shape_manager.current_shape));
            }
            this.shape_manager.current_shape = null;
            this.shape_manager.current_transformation = null;
        }

        this.shape_manager.render();
    }

}


//###########################################################
//               Compressing/Decompressing Data
//###########################################################


function DataManager() {
}
    //Turn data into command
    //element 0 = Command ID;  next elements are parameters for relevent constructors IN ORDER
    DataManager.unpackage = function(array) {
        var params = array.splice(1, array.length - 1);
        var command = new COMMAND_IDS[array[0]](...params);

        //If the received command is not actually a Command, it must be a shape.  Wrap shape in AddShape command.
        if ( !(command instanceof Command)) {
            command = new AddShape(command);
        }
        return command;
    }

    //Turn command into data
    DataManager.package = function(command) {
        var array = get_attributes(command);

        array.splice(0, 0, COMMAND_IDS.indexOf(command.constructor) );
        return array;

        /**
        for (var param in command) {
            array.push(param);
        }
        return array
        */
    }

    function get_attributes(command) {
        
        //Generate array with all properties of command object
        var array = Object.keys(command).map(function(attribute){
        return command[attribute];
        })
    
        //Remove the methods from array
        var newarr = array.filter(function(attribute){return typeof(attribute) !== 'function'})
    
        return newarr;
    
    }

//###########################################################
//                          UI Functions
//###########################################################
function set_tool(tool) {
    c.user.settings.set_tool(tool);

    if (tool != 6){ 
        c.shape_manager.current_shape_state = ShapeStates.NOSHAPE;
        c.shape_manager.current_shape = null;
    }
}

function set_stroke_color(color) {
    c.user.settings.set_stroke_color(color);
}

function set_fill_color(color) {
    c.user.settings.set_fill_color(color);
}

function set_fill(boolean) {
    c.user.settings.set_fill(boolean);
}

function undo() {
    c.shape_manager.undo_command();
} 

function redo() {
    c.shape_manager.redo_command();
}


