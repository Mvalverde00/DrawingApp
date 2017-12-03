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

    this.draw = function() {
    }
    this.line_collision = function(mx, my, lx, ly, lw, lh) {

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

    this.second_point = [ x + width, y + height];
    this.third_point = [ this.second_point[0], y ];

    this.draw = function(ctx) {

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo( this.second_point[0], this.second_point[1] );
        ctx.lineTo( this.third_point[0], this.third_point[1] );
        ctx.lineTo( x, y);

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
            var p1 = this.second_point;
            var p2 = this.third_point;

            var area = .5 * (-p1[1]*p2[0] + p0[1]*(-p1[0] + p2[0]) + p0[0]*(p1[1] - p2[1]) + p1[0]*p2[1]);
            var s = 1/(2*area)*(p0[1]*p2[0] - p0[0]*p2[1] + (p2[1]-p0[1])*mx + (p0[0] - p2[0])*my );
            var t = 1/(2*area)*(p0[0]*p1[1] - p0[1]*p1[0] + (p0[1]-p1[1])*mx + (p1[0] - p0[0])*my );

            return s > 0 && t > 0 && (1-s-t) > 0;
        }
        else {
            return true;
        }

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
                    // Collision code
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
