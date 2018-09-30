
var mouse = {
    x : 0,
    y : 0,
    startX : 0,
    startY : 0,
    isDown : false
};

var IDS = {
    RECTANGLE : 0,
    LINE: 1,
    FREEDRAW: 2,
    CIRCLE: 3,
    TRIANGLE: 4,
    ERASER: 5,
    SELECT: 6,
    PAN : 7,
    RESISTOR : 8
};

var SelectStates = {
    NOSHAPE : 0,
    SELECTED : 1,
    MOVING : 2,
    ROTATING : 3,
    RESIZING : 4
};

var user_manager = new UserManager();
var chat_manager = new ChatManager();


// 20x20 rotation handle image
const image_height = 30;
const image_width = 30;
const rotation_image = new Image();
rotation_image.src = '/static/img/rotate.png';

// Round number to two decimal places
function round(number){
    return Math.round(number*100)/100

}

function Display(){
    this.mouse_x = document.getElementById('mouse-x');
    this.mouse_y = document.getElementById('mouse-y');

    this.canvas_x = document.getElementById('canvas-x');
    this.canvas_y = document.getElementById('canvas-y');
}
var display = new Display();


//Localize mouse coordinates to canvas
function setMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect(), 
        scaleX = canvas.width / rect.width,    
        scaleY = canvas.height / rect.height; 
  
      mouse.x = round( ((evt.clientX - rect.left) * scaleX / c.camera.scale) ),
      mouse.y = round( ((evt.clientY - rect.top) * scaleY / c.camera.scale) );
    
    // Convert to camera coordinates
    [mouse.x, mouse.y] = c.camera.translate_mouse_coords(mouse.x, mouse.y);
    display.mouse_x.innerHTML = mouse.x;
    display.mouse_y.innerHTML = mouse.y;
}  

var c = new function() {
    this.canvas = document.getElementById('canvas');
    this.ctx = canvas.getContext('2d');
    this.ctx.lineCap = 'round';

    this.user = new User("testuser");

    this.camera = new Camera(this.canvas.width, this.canvas.height);

    this.shape_manager = new ShapeManager(this.canvas.width, this.canvas.height, this.camera);
    this.camera.ctx = this.shape_manager.ctx; // Horrible circular-dependency, I feel dirty doing this.... will refactor later

    this.layer_manager = new LayerManager(this.canvas, this.ctx, this.shape_manager, this.camera);

    this.interpolation_manager = new InterpolationManager();

    // Certain events should only trigger in the canvas; others should trigger everywhere.  Use whichever makes more sense for that particular event
    this.canvas.addEventListener('mousedown', function(e) {
        e.preventDefault();

        if (e.button == 0){ // 0 is left click
            c.onMouseDown();
        } 

    } , false);

    /*
    window.addEventListener('mouseout', function(e) {
        window.getSelection().removeAllRanges(); // When leaving the canvas, sometimes the buttons get auto-selected which is bad
        c.onMouseUp();
    }, false);
*/
        
    window.addEventListener('contextmenu', function(e){ e.preventDefault();}, false)

    window.addEventListener('mouseup', function(e) {
        c.onMouseUp();
    } , false);

    this.canvas.addEventListener('mousewheel', function(e) {
        e.preventDefault();
        c.onMouseWheel(e);
    }, false )

    window.addEventListener('mousemove', function(e) {
        c.layer_manager.render();
        setMousePos(canvas, e);
        if (mouse.isDown) {
            switch (c.user.settings.tool) {
                case IDS.RECTANGLE:
                    // Floating-point arithmetic is imperfect, so we must round the subtractions to ensure they stay 2 decimal places
                    c.shape_manager.current_shape = new Rectangle(mouse.startX, mouse.startY, round(mouse.x - mouse.startX), round(mouse.y - mouse.startY), c.user.settings.stroke_color, c.user.settings.fill_color, c.user.settings.fill, c.user.settings.line_width);
                    //c.shape_manager.current_shape.draw(c.ctx);
                    break;
                case IDS.LINE:
                    c.shape_manager.current_shape = new Line(mouse.startX, mouse.startY, round(mouse.x - mouse.startX), round(mouse.y - mouse.startY), c.user.settings.stroke_color, '#000000', false, line_width=c.user.settings.line_width);
                    //c.shape_manager.current_shape.draw(c.ctx);
                    break;
                case IDS.FREEDRAW:
                    c.shape_manager.current_shape.add_coords(mouse.x, mouse.y);
                    //c.shape_manager.current_shape.draw(c.ctx);
                    break;
                case IDS.CIRCLE:
                    c.shape_manager.current_shape = new Circle(mouse.startX, mouse.startY, round(mouse.x - mouse.startX), round(mouse.y - mouse.startY), c.user.settings.stroke_color, c.user.settings.fill_color, c.user.settings.fill, c.user.settings.line_width);
                    //c.shape_manager.current_shape.draw(c.ctx);
                    break;
                case IDS.TRIANGLE:
                    c.shape_manager.current_shape = new Triangle(mouse.startX, mouse.startY, round(mouse.x - mouse.startX), round(mouse.y - mouse.startY), c.user.settings.stroke_color, c.user.settings.fill_color, c.user.settings.fill, c.user.settings.line_width);
                    //c.shape_manager.current_shape.draw(c.ctx);
                    break;
                case IDS.ERASER:
                    c.shape_manager.current_shape.coords.push([mouse.x, mouse.y]);
                   // c.shape_manager.current_shape.draw(c.ctx);
                    break;
                case IDS.SELECT:
                    //Add temp transformations
                    if (c.shape_manager.current_shape_state == SelectStates.MOVING) {
                        c.shape_manager.current_transformation = new Move(c.shape_manager.current_shape.id, mouse.startX, mouse.startY, mouse.x, mouse.y);
                    }
                    else if (c.shape_manager.current_shape_state == SelectStates.ROTATING) {
                        [cx, cy] = c.shape_manager.current_shape.get_center();
                        let opp = (cx - mouse.x);
                        let adj = (cy - mouse.y);

                        //Because the rotation treats directly above as the starting point, the function must be shifted PI/2
                        let theta = round( Math.atan2(adj, opp) - Math.PI/2 - c.shape_manager.current_shape.theta );
                        c.shape_manager.current_transformation = new Rotate(c.shape_manager.current_shape.id, theta);
                    }
                    break;
                case IDS.PAN:
                    c.camera.translate_canvas(mouse.startX, mouse.startY, mouse.x, mouse.y, c.ctx);
                    display.canvas_x.innerHTML = c.camera.x;
                    display.canvas_y.innerHTML = c.camera.y;
                    break;

                case IDS.RESISTOR:
                    c.shape_manager.current_shape = new Resistor(mouse.startX, mouse.startY, round(mouse.x - mouse.startX), round(mouse.y - mouse.startY), c.user.settings.stroke_color, c.user.settings.fill_color, c.user.settings.fill, c.user.settings.line_width);
                    break;

                default:
                    alert('something somewhere went wrong.');
                    break;
            }
            c.interpolation_manager.update_current(c.shape_manager.current_shape, c.shape_manager.current_transformation);
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
        
        if (this.user.settings.tool == IDS.SELECT) {

            if (this.shape_manager.current_shape_state == SelectStates.MOVING) {
                    //To prevent unintentional moves (such as when selecting the shape), the shape must be moved at least 2 pixels in order for a command to be sent
                    if ( Math.sqrt((mouse.startX - mouse.x)*(mouse.startX - mouse.x) + (mouse.startY - mouse.y)*(mouse.startY - mouse.y)) > 2 ) {
                        this.shape_manager.current_transformation.set_id();

                        this.shape_manager.pending_commands.push(this.shape_manager.current_transformation);
                        sendShape(DataManager.package(this.shape_manager.current_transformation));
                    }
                    this.shape_manager.current_transformation = null;
                    this.shape_manager.current_shape_state = SelectStates.SELECTED;
            }
            else if (this.shape_manager.current_shape_state == SelectStates.ROTATING) {
                this.shape_manager.current_transformation.set_id();

                this.shape_manager.pending_commands.push(this.shape_manager.current_transformation);
                sendShape(DataManager.package(this.shape_manager.current_transformation));

                this.shape_manager.current_transformation = null;
                this.shape_manager.current_shape_state = SelectStates.SELECTED;
            }

        }
        else {
            if (this.shape_manager.current_shape != null) {
                this.shape_manager.current_shape.set_id();

                // Send request to server to add shape, and in the meantime add command to pending commands.
                this.shape_manager.pending_commands.push(this.shape_manager.current_shape);
                sendShape(DataManager.package(this.shape_manager.current_shape));
            }
            this.shape_manager.current_shape = null;
            this.shape_manager.current_transformation = null;
        }

        this.layer_manager.render();

        this.interpolation_manager.onMouseUp();
    }

    this.onMouseDown = function(){
        /* Most tools only need to be concerned with mousemove and mouseup, because they require no preliminary setup.  However, some tools require a setup function to work. 
           The switch statement here provides a place to change states, setup variables, etc. when necessary.
        **/

        mouse.isDown = true;
        mouse.startX = mouse.x;
        mouse.startY = mouse.y;
        
        switch(this.user.settings.tool) {
            case IDS.FREEDRAW:

                this.shape_manager.current_shape = new FreeDraw(mouse.startX, mouse.startY, c.user.settings.stroke_color, c.user.settings.line_width, [[mouse.startX, mouse.startY]]);
                break;

            case IDS.ERASER:

                this.shape_manager.current_shape = new Eraser(mouse.startX, mouse.startY, c.user.settings.stroke_color, c.user.settings.line_width);
                break;

            case IDS.SELECT:

                clicked_shape = this.shape_manager.get_collision(mouse.x, mouse.y);

                

                //If there is no shape selected, try to select one.  When first clicking on a shape, it will be ready to be moved
                if (this.shape_manager.current_shape_state == SelectStates.NOSHAPE) {

                    // If nothing was selected, deselect the current shape and break from the switch statement
                    if (clicked_shape == null){
                        this.shape_manager.current_shape_state = SelectStates.NOSHAPE;
                        this.shape_manager.current_shape = null;
                    }
                    else{
                        this.shape_manager.current_shape = clicked_shape;
                        this.shape_manager.current_shape_state = SelectStates.MOVING;
                    } 

                }
                else if (this.shape_manager.current_shape_state == SelectStates.SELECTED) {

                    // If you click on the same shape, start moving that shape
                    if (this.shape_manager.current_shape ==  clicked_shape) this.shape_manager.current_shape_state = SelectStates.MOVING;
                    // If you click on the rotation handle, start rotating.
                    else if (this.shape_manager.current_shape.rotation_handle_collision(mouse.x, mouse.y)) this.shape_manager.current_shape_state = SelectStates.ROTATING;
                    // If nothing was clicked, deselect current shape.  Must come AFTER rotation handle detection, because that is technically clicking nothing and would cause this to execute
                    else if (clicked_shape == null) {
                        this.shape_manager.current_shape_state = SelectStates.NOSHAPE;
                        this.shape_manager.current_shape = null;
                    }
                    // If you click on a different shape, select that shape 
                    else {
                        this.shape_manager.current_shape = clicked_shape;
                        this.shape_manager.current_shape_state = SelectStates.MOVING;
                    }

                }
                else {
                    console.log('Error, Mousedown select should never result in something other than NOSHAPE or SELECTED');
                }

                break;

            default:
                // At the moment, only freedraw, eraser, and select need a mousedown function
                // All other tools can default do doing nothing.
                break;
        }

        this.interpolation_manager.onMouseDown();

    }

    this.onMouseWheel = function(e) {
        let delta = e.wheelDelta/120;
        console.log(delta);
        this.camera.zoom_canvas(delta, mouse.x, mouse.y);
        this.layer_manager.render();

        display.canvas_x.innerHTML = this.camera.x;
        display.canvas_y.innerHTML = this.camera.y;

    }

    this.set_tool = function(tool){
        //Deselect any currently selected shapes when changing tools
        this.shape_manager.current_shape_state = SelectStates.NOSHAPE;
        this.shape_manager.current_shape = null;
        this.shape_manager.current_transformation = null;

        console.log('setting tool');
        this.user.settings.set_tool(tool);
    }

    this.toggle_background = function(input) {
        this.layer_manager.background_enabled = input.checked;
        this.layer_manager.render();
    }

    this.undo = function(){
    }
    this.redo = function(){}
    this.clear = function(){
        sendClear()
    }

    this.download = function(parent_element, scope){

        let image = this.layer_manager.download(scope);
        parent_element.getElementsByTagName('a')[0].setAttribute('href', image);

    }

}