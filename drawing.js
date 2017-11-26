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

function Settings(stroke_color, fill_color, tool, thickness) {
    this.stroke_color = stroke_color;
    this.fill_color = fill_color;
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

}

function User(username) {
    this.username = username;
    this.settings = new Settings('#000000', '#ffffff', 0, 5);
}

function Shape(x, y, width, height, stroke_color, fill_color) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.stroke_color = stroke_color;
    this.fill_color = fill_color;

    this.draw = function() {
    }

}

function Rectangle(x, y, width, height, stroke_color, fill_color) {
    Shape.call(this);

    this.draw = function(ctx) {

        ctx.fillStyle = fill_color;
        ctx.fillRect(x, y, width, height);

        ctx.strokeStyle = stroke_color;
        console.log(stroke_color);
        ctx.strokeRect(x, y, width, height);

    }
}

function Line(x, y, width, height, stroke_color, fill_color=null) {
    Shape.call(this);

    this.draw = function(ctx) {
        ctx.strokeStyle = stroke_color;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + width, y + height);
        ctx.stroke();
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

        for (let coord of this.coords) {
            ctx.lineTo(coord[0], coord[1]);
        }
        ctx.stroke();
    }

}

function Circle(x, y, width, height, stroke_color, fill_color) {
    Shape.call(this);

    this.radius = Math.sqrt( (x - (x+width)) * (x - (x+width)) + (y - (y+height)) * (y - (y+height))  ); //Distance formula = radius

    this.draw = function(ctx) {

        ctx.fillStyle = fill_color;
        ctx.beginPath();
        ctx.arc(x, y, this.radius, 0, 2*Math.PI);
        ctx.fill();

        ctx.strokeStyle = stroke_color;
        ctx.beginPath();
        ctx.arc(x, y, this.radius, 0, 2*Math.PI);
        ctx.stroke();

    }
}

var c = new function() {
    this.canvas = document.getElementById('canvas');
    this.ctx = canvas.getContext('2d');
    this.user = new User("testuser");
    this.current_shape = null;
    this.shapes = [];

    this.temp_freedraw;

    canvas.addEventListener('mousedown', function(e) {
        mouse.isDown = true;
        mouse.startX = mouse.x;
        mouse.startY = mouse.y;
        
        if (c.user.settings.tool == 2) {
            c.temp_freedraw = new FreeDraw(mouse.startX, mouse.startY, c.user.settings.stroke_color);
            c.current_shape = c.temp_freedraw;
        }

    } , false);
    canvas.addEventListener('onmouseout', function(e) {
        mouse.isDown = false;
    }, false);
    canvas.addEventListener('mouseup', function(e) {
        mouse.isDown = false;
    } , false);

    canvas.addEventListener('mousemove', function(e) {
        c.ctx.clearRect(0, 0, canvas.width, canvas.height);
        c.render();
        setMousePos(canvas, e);
        if (mouse.isDown) {
            console.log('yes');
            switch (c.user.settings.tool) {
                case 0:
                    console.log(mouse.x);
                    c.current_shape = new Rectangle(mouse.startX, mouse.startY, mouse.x - mouse.startX, mouse.y - mouse.startY, c.user.settings.stroke_color, c.user.settings.fill_color);
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
                    c.current_shape = new Circle(mouse.startX, mouse.startY, mouse.x - mouse.startX, mouse.y - mouse.startY, c.user.settings.stroke_color, c.user.settings.fill_color);
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
            }
            c.current_shape = null;
        }

    }, false);

    this.render = function() {
        for (let shape of c.shapes) {
            shape.draw(this.ctx)
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
