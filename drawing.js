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

        x += dx;
        y += dy;

    }

}

function Rectangle(x, y, width, height, stroke_color, fill_color, fill) {
    Shape.call(this);

    this.draw = function(ctx) {

        if (fill) {
            ctx.fillStyle = fill_color;
            ctx.fillRect(x, y, width, height);
        }
        ctx.strokeStyle = stroke_color;
        ctx.strokeRect(x, y, width, height);

    }

    this.collision = function(mx, my) {
        if (fill) {
            return mx >= x && //If click is inside filled shape
            mx <= (x + width) &&
            my >= y &&
            my <= (y + height);
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
    Shape.call(this);

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
    Shape.call(this);

    this.radius = Math.sqrt( (x - (x+width)) * (x - (x+width)) + (y - (y+height)) * (y - (y+height))  ); //Distance formula = radius

    this.draw = function(ctx) {
        
        ctx.beginPath();
        ctx.arc(x, y, this.radius, 0, 2*Math.PI);
        
        if (fill) {
            ctx.fillStyle = fill_color;
            ctx.fill();
        }
        ctx.strokeStyle = stroke_color;
        ctx.stroke();

    }
    
    this.collision = function(mx, my) {
        if (fill) return (mx - x)*(mx - x) + (my - y)*(my - y) <= this.radius*this.radius;
        else {
            // A ring (annulus) can be created by starting with an outer circle and removing an inner circle
            var ERROR_MARGIN = 5;
            var in_outer_circle = (mx - x)*(mx - x) + (my - y)*(my - y) <= (this.radius+ERROR_MARGIN)*(this.radius+ERROR_MARGIN);
            var in_inner_circle = (mx - x)*(mx - x) + (my - y)*(my - y) <= (this.radius-ERROR_MARGIN)*(this.radius-ERROR_MARGIN);
            return in_outer_circle && !in_inner_circle;
        }
    }
}

function Triangle(x, y, width, height, stroke_color, fill_color, fill) {
    Shape.call(this);

    this.p2 = [ x + width, y + height];
    this.p3 = [ this.p2[0], y ];

    this.draw = function(ctx) {

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo( this.p2[0], this.p2[1] );
        ctx.lineTo( this.p3[0], this.p3[1] );
        ctx.lineTo(x, y);

        if (fill) {
            ctx.fillStyle = fill_color;
            ctx.fill();
        }

        ctx.strokeStyle = stroke_color;
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

function Selector(x, y) {
    this.x = x;
    this.y = y;

}

var c = new function() {
    this.canvas = document.getElementById('canvas');
    this.ctx = canvas.getContext('2d');
    this.user = new User("testuser");
    this.current_shape = null;
    this.shapes = [];
    this.undone_shapes = [];

    this.temp_freedraw;

    canvas.addEventListener('mousedown', function(e) {
        mouse.isDown = true;
        mouse.startX = mouse.x;
        mouse.startY = mouse.y;
        
        if (c.user.settings.tool == 2) {
            c.temp_freedraw = new FreeDraw(mouse.startX, mouse.startY, c.user.settings.stroke_color);
            c.current_shape = c.temp_freedraw;
        }
        if (c.user.settings.tool == 5) {
            c.current_shape = new Eraser();
        }
        if (c.user.settings.tool == 6) {
            for (let shape of c.shapes) {
                if (shape.hasOwnProperty('collision')) {
                    if (shape.collision(mouse.x, mouse.y)) {
                        c.current_shape = shape;
                        console.log(shape);
                        break;
                    }
                }
            }
        }

    } , false);
    canvas.addEventListener('onmouseout', function(e) {
        mouse.isDown = false;
    }, false);
    canvas.addEventListener('mouseup', function(e) {
        mouse.isDown = false;
    } , false);

    canvas.addEventListener('mousemove', function(e) {
        c.render();
        setMousePos(canvas, e);
        if (mouse.isDown) {
            switch (c.user.settings.tool) {
                case 0:
                    console.log(mouse.x);
                    c.current_shape = new Rectangle(mouse.startX, mouse.startY, mouse.x - mouse.startX, mouse.y - mouse.startY, c.user.settings.stroke_color, c.user.settings.fill_color, c.user.settings.fill);
                    c.current_shape.draw(c.ctx);
                    break;
                case 1:
                    c.current_shape = new Line(mouse.startX, mouse.startY, mouse.x - mouse.startX, mouse.y - mouse.startY, c.user.settings.stroke_color);
                    c.current_shape.draw(c.ctx);
                    break;
                case 2:
                    c.temp_freedraw.coords.push([mouse.x, mouse.y]);
                    c.current_shape.draw(c.ctx);
                    break;
                case 3:
                    c.current_shape = new Circle(mouse.startX, mouse.startY, mouse.x - mouse.startX, mouse.y - mouse.startY, c.user.settings.stroke_color, c.user.settings.fill_color, c.user.settings.fill);
                    c.current_shape.draw(c.ctx);
                    break;
                case 4:
                    c.current_shape = new Triangle(mouse.startX, mouse.startY, mouse.x - mouse.startX, mouse.y - mouse.startY, c.user.settings.stroke_color, c.user.settings.fill_color, c.user.settings.fill);
                    c.current_shape.draw(c.ctx);
                    break;
                case 5:
                    c.current_shape.coords.push([mouse.x, mouse.y]);
                    c.current_shape.draw(c.ctx);
                    break;
                case 6:
                    c.current_shape.translate(mouse.startX, mouse.startY, mouse.x);
                    c.current_shape.draw(c.ctx);
                    break;
                default:
                    break;
            }
        }
        else {
            if (c.current_shape != null) {
                c.shapes.push(c.current_shape);
                c.render();
                c.undone_shapes = [];
            }
            c.current_shape = null;
        }

    }, false);

    this.render = function() {
        c.ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let shape of c.shapes) {
            shape.draw(this.ctx)
        }
    }

    this.undo = function() {
        if (this.shapes.length > 0) {
            shape = this.shapes.pop();
            this.undone_shapes.push(shape);
            c.render();
        }

    }
    this.redo = function() {
        if (this.undone_shapes.length > 0){
            shape = this.undone_shapes.pop();
            this.shapes.push(shape);
            c.render();
        }
    }
}

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
    c.undo();
}

function redo() {
    c.redo();
}
