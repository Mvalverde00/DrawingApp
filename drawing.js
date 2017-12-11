var mouse = {
    x : 0,
    y : 0,
    startX : 0,
    startY : 0,
    isDown : false
}

function setMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect(), 
        scaleX = canvas.width / rect.width,    
        scaleY = canvas.height / rect.height; 
  
      mouse.x = (evt.clientX - rect.left) * scaleX,
      mouse.y = (evt.clientY - rect.top) * scaleY
}
 
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
        this.stroke_color = '#' + stroke_color;
    }
    this.set_fill_color = function(fill_color) {
        this.fill_color = '#' + fill_color;
    }
    this.set_fill = function(fill) {
        this.fill = fill;
    }

}

function User(username) {
    this.username = username;
    this.settings = new Settings('#000000', '#ffffff', false, 0, 5);
}

function Shape(x, y, width, height, stroke_color, fill_color, fill) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.stroke_color = stroke_color;
    this.fill_color = fill_color;
    this.fill = fill;

    this.draw = function() {}

    this.collision = function() {}

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

}

function Rectangle(x, y, width, height, stroke_color, fill_color, fill) {
    Shape.call(this, x, y, width, height, stroke_color, fill_color, fill);
    this.draw = function(ctx) {

        if (fill) {
            ctx.fillStyle = this.fill_color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
        ctx.strokeStyle = this.stroke_color;
        ctx.strokeRect(this.x, this.y, this.width, this.height);

    }

    this.collision = function(mx, my) {
        if (fill) {
            return mx >= this.x && //If click is inside filled shape
            mx <= (this.x + this.width) &&
            my >= this.y &&
            my <= (this.y + this.height);
        }
        else {
            //console.log(mx + ' vs ' + x + ' to ' + (x + width) );
            //console.log(my + ' vs ' + y + ' to ' + (y + height) );
            var ERROR_MARGIN = 3;
            var valid_top_bottom = (mx >= x && mx <= (x + width)) && (Math.abs(my - y) < ERROR_MARGIN || Math.abs(my - (y + height)) < ERROR_MARGIN);
            var valid_left_right = (my >= y && my <= (y + height)) && (Math.abs(mx - x) < ERROR_MARGIN || Math.abs(mx - (x+width)) < ERROR_MARGIN);

            //console.log('valid_top_bottom: ' + valid_top_bottom);
            //console.log('valid_left_right: ' + valid_left_right);
            return valid_top_bottom || valid_left_right;
        }
    }
}

function Line(x, y, width, height, stroke_color, fill_color=null, fill=false) {
    Shape.call(this, x, y, width, height, stroke_color, fill_color, fill);

    this.draw = function(ctx) {
        ctx.strokeStyle = stroke_color;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + width, y + height);
        ctx.stroke();
    }

    this.collision = function(mx, my) {
        //y = m*x + b;  b = y - m*x  Not to be confused with mx, aka mouse-x 
        var m = ((y + height) - y)/((x + width) - x);
        var b = y - m*x;

        ERROR_MARGIN = 3;
        var on_line = Math.abs(m*mx + b - my) < ERROR_MARGIN; // Check if point falls on line
        //the or statesments account for the fact that, in this implementation, a line from (50,50) to (100,100) is different than a line from (100,100) to (50,50) in terms of x/y and width/height
        var in_x_range = ( ((mx + ERROR_MARGIN) >= x) && ((mx - ERROR_MARGIN) <= (x + width)) ) || ( ((mx + ERROR_MARGIN) <= x) && ((mx - ERROR_MARGIN) >= (x + width)) );
        var in_y_range = ( ((my + ERROR_MARGIN) >= y) && ((my - ERROR_MARGIN) <= (y + height)) ) || ( ((my + ERROR_MARGIN) <= y) && ((my - ERROR_MARGIN) >= (y + height)) );

        return on_line && in_x_range && in_y_range;

    }
}

function FreeDraw(x ,y, stroke_color) {
    this.x = x;
    this.y = y;
    this.stroke_color = stroke_color;

    this.coords = [];

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

function Circle(x, y, width, height, stroke_color, fill_color, fill) {
    Shape.call(this, x, y, width, height, stroke_color, fill_color, fill);

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
        if (this.fill) return (mx - this.x)*(mx - this.x) + (my - this.y)*(my - this.y) <= this.radius*this.radius;
        else {
            // A ring (annulus) can be created by starting with an outer circle and removing an inner circle
            var ERROR_MARGIN = 5;
            var in_outer_circle = (mx - this.x)*(mx - this.x) + (my - this.y)*(my - this.y) <= (this.radius+ERROR_MARGIN)*(this.radius+ERROR_MARGIN);
            var in_inner_circle = (mx - this.x)*(mx - this.x) + (my - this.y)*(my - this.y) <= (this.radius-ERROR_MARGIN)*(this.radius-ERROR_MARGIN);
            return in_outer_circle && !in_inner_circle;
        }
    }
}

function Triangle(x, y, width, height, stroke_color, fill_color, fill) {
    Shape.call(this, x, y, width, height, stroke_color, fill_color, fill);

    this.p2 = [ this.x + this.width, this.y + this.height];
    this.p3 = [ this.p2[0], this.y ];

    this.draw = function(ctx) {

        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo( this.p2[0], this.p2[1] );
        ctx.lineTo( this.p3[0], this.p3[1] );
        ctx.lineTo(this.x, this.y);

        if (fill) {
            ctx.fillStyle = this.fill_color;
            ctx.fill();
        }

        ctx.strokeStyle = this.stroke_color;
        ctx.stroke();
    }
    this.collision = function(mx, my) {
        //Filled collisions calculated using Barycentric coordinate system
        if (fill) {
            // improve readability
            var p0 = [x,y];
            var p1 = this.p2;
            var p2 = this.p3;

            var area = .5 * (-p1[1]*p2[0] + p0[1]*(-p1[0] + p2[0]) + p0[0]*(p1[1] - p2[1]) + p1[0]*p2[1]);
            var s = 1/(2*area)*(p0[1]*p2[0] - p0[0]*p2[1] + (p2[1]-p0[1])*mx + (p0[0] - p2[0])*my );
            var t = 1/(2*area)*(p0[0]*p1[1] - p0[1]*p1[0] + (p0[1]-p1[1])*mx + (p1[0] - p0[0])*my );

            return s > 0 && t > 0 && (1-s-t) > 0;
        }
        else {
            var l1 = this.collision_line_helper(mx, my, x, y, this.p2[0], this.p2[1]);
            var l2 = this.collision_line_helper(mx, my, this.p2[0], this.p2[1], this.p3[0], this.p3[1]);
            var l3 = this.collision_line_helper(mx, my, this.p3[0], this.p3[1], x, y);
            
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
        console.log(on_line);
        console.log(in_x_range);
        return on_line && in_x_range && in_y_range;
    }

}

/*
function Eraser() {

    this.coords = [];

    this.draw = function(ctx) {
        ctx.globalCompositeOperation = 'destination-out';
        for (let coord of this.coords) {
            ctx.beginPath();
            ctx.arc(coord[0], coord[1], 4, 0, Math.PI * 2, false);
            ctx.fill();
        }
        ctx.globalCompositeOperation = 'source-over';
    }

}
*/
function Eraser(x, y) {
    this.x = x;
    this.y = y;

    this.STROKE_COLOR = '#ffffff';

    this.coords = [];

    this.draw = function(ctx) {
        ctx.strokeStyle = this.STROKE_COLOR;
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.moveTo(x, y);

        for (let coord of this.coords) {
            ctx.lineTo(coord[0], coord[1]);
        }
        ctx.stroke();

    };
}

function Command(execute, undo) {
    this.execute = execute;
    this.undo = undo;
}

function AddShape(shape) {
    this.execute = function(array) {
        array.push(shape);
    }
    this.undo = function(array) {
        array.pop();
    }
}

function Move(shape, sx, sy, dx, dy) {
    this.execute = function(){
        shape.translate(sx, sy, dx, dy);
    }
    this.undo = function(array) {
        shape.translate(dx, dy, sx, sy);
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
    this.current_transformation = null;

    this.execute_command = function(command) {
        command.execute(this.shapes);
        this.command_history.push(command);

        this.undo_history = []; //Undo history is cleared when a command is executed.
    };

    this.undo_command = function() {
        command = this.command_history.pop();
        command.undo(this.shapes);
        this.undo_history.push(command);

        this.render();
    };
    
    this.redo_command = function() {
        command = this.undo_history.pop();
        command.execute(this.shapes);
        this.command_history.push(command);

        this.render();
    }

    this.render = function() {
        this.ctx.clearRect(0, 0, this.cw, this.ch);

        for(let shape of this.shapes) {
            if (shape != this.current_shape){
                shape.draw(this.ctx);
            }
        }
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
            c.shape_manager.current_shape = c.shape_manager.get_collision(mouse.x, mouse.y);
            console.log(c.shape_manager.current_shape);
        }

    } , false);

    canvas.addEventListener('mouseout', function(e) {
        console.log('mouse out');
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
                    console.log(mouse.x);
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
                    // Temporarily apply translation  Perhaps add in a 'temp command execute' functino to maintain order
                    c.shape_manager.current_shape.translate(mouse.startX, mouse.startY, mouse.x, mouse.y);
                    c.shape_manager.current_shape.draw(c.ctx);
                    c.shape_manager.current_shape.translate(mouse.x, mouse.y, mouse.startX, mouse.startY);
                    break;
                default:
                    break;
            }
        }

    }, false);

    this.onMouseUp = function(){
        mouse.isDown = false;
        
        if (this.user.settings.tool != 6) {
            if (this.shape_manager.current_shape != null) {
                this.shape_manager.execute_command(new AddShape(this.shape_manager.current_shape));
            }
        }
        else {
            if (this.shape_manager.current_shape != null) {
                this.shape_manager.execute_command(new Move(this.shape_manager.current_shape, mouse.startX, mouse.startY, mouse.x, mouse.y));
            }
        }

        this.shape_manager.current_shape = null;

    }

}



//###########################################################
//                          UI Functions
//###########################################################
function set_tool(sel) {
    c.user.settings.set_tool(sel.options[sel.selectedIndex].value);
}

function set_stroke_color(inp) {
    c.user.settings.set_stroke_color(inp.value);
}

function set_fill_color(inp) {
    c.user.settings.set_fill_color(inp.value);
}

function set_fill(inp) {
    c.user.settings.set_fill(inp.checked);
}

function undo() {
    c.shape_manager.undo_command();
}

function redo() {
    c.shape_manager.redo_command();
}
 