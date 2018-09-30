// Manages all shapes on a given layer
function ShapeManager(cw, ch, camera) {

    let self = this;

    this.canvas = document.createElement('canvas');
    this.cw = cw;
    this.ch = ch;
    this.canvas.width = cw;
    this.canvas.height = ch;
    this.ctx = this.canvas.getContext('2d');
    this.ctx.lineCap = 'round';
    this.camera = camera;

    this.page_manager = new PageManager();

    // For explanations of all these properties, see the definition of the Page class
    // For the arrays, do NOT ever clear them with '= []'  This changes the reference, which is not good.  Instead, set the .length attribute to 0
    [this.shapes, this.command_history, this.undo_history, this.pending_commands, this.inbetween_commands, this.pending_clear, this.pending_undo] = this.page_manager.get_current_page().get_all();

    // These don't need to be remembered for every page
    this.current_shape = null;
    this.current_shape_state = SelectStates.NOSHAPE;
    this.current_transformation = null;


    //Execute command, save command to history, and clear previous history
    this.execute_command = function(command) {
        command.execute(this.shapes);
        this.command_history.push(command);

        this.undo_history.length = 0; //Undo history is cleared when a command is executed.

        this.render();
    };

    //Undo command, save command to history
    this.undo_command = function(hash) {

        /* legacy code from before canvas was conntected to authoratative server
        command = this.command_history.pop();
        command.undo(this.shapes);
        this.undo_history.push(command);

        this.current_shape = null;
        this.current_shape_state = SelectStates.NOSHAPE;
        this.current_transformation = null;

        this.render();
        */

        let command = null;

        // Remove command from command_history
        for (let i = this.command_history.length - 1; i >= 0; i--){
            if (this.command_history[i].id == hash) command = this.command_history.splice(i,1)[0];
        }

        if (command != null) {
            // Undo command and add to history
            command.undo(this.shapes);
            this.undo_history.push(command);

            // Reset if you had the undone shape selected
            // We need to first check that it is not null, so that we do not try to access .id on a null value, resulting in an error
            if (this.current_shape != null && this.current_shape.id == command.id) {
                this.current_shape = null;
                this.current_shape_state = SelectStates.NOSHAPE;
                this.current_transformation = null;
            }

            // Remove undone shape from pending undo history, if you were the sender
            for (let i = this.pending_undo.length - 1; i >= 0; i--){
                if (this.pending_undo[i].id == hash) this.pending_undo.splice(i,1);
            }

        }

    };
    
    this.redo_command = function(command) {

        console.log(command)

        // Remove from undo history by ID
        for (let i = this.undo_history.length - 1; i >= 0; i--) {
            if (this.undo_history[i].id == command.id) this.undo_history.splice(i,1);
        }

        command.execute(this.shapes) // we directly call command.execute instead of using the execute_command function, because we do NOT want undo history to be cleared on redo.
        this.command_history.push(command);

        /* legacy code from before canvas was conntected to authoratative server
        command = this.undo_history.pop();
        command.execute(this.shapes);
        this.command_history.push(command);

        this.current_shape = null;
        this.current_shape_state = SelectStates.NOSHAPE;
        this.current_transformation = null;

        this.render();
        */
    }

    this.render = function() {
        // We only need to clear what we can see
        this.ctx.clearRect(this.camera.x, this.camera.y, this.cw, this.ch); 

        // If there is an outgoing unresolved clear request, temporarily do not render anything on the client side
        if (!this.pending_clear){

        //The current transformation must be applied, rendered, and undone to give the illusion that the shape is moving
        //without actually moving it until the mouse is lifted

            /// Apply all temporary commands
            for (let command of this.inbetween_commands){ 
                if (command.hasOwnProperty('execute')) command.execute(this.shapes);
            }
            for (let command of this.pending_commands){
                if (command.hasOwnProperty('execute')) command.execute(this.shapes);
            }
            for (let command of this.pending_undo){
                if (command.hasOwnProperty('undo')) command.undo(this.shapes);
            }
            if (this.current_transformation != null) this.current_transformation.execute(this.shapes);


                //// Draw existing Shapes
            for(let shape of this.shapes) { 
                shape.draw(this.ctx);
            }
                //// Draw pending Shapes
            for (let command of this.pending_commands) {
                if (command.hasOwnProperty('draw')) command.draw(this.ctx);
            }

            if (this.current_shape_state == SelectStates.NOSHAPE && this.current_shape != null) { // If there is NOSHAPE selected, yet there is a current shape, that means this must be a temporary draw
                this.current_shape.draw(this.ctx);
            }

                //// Selection box should be drawn on top of everything else, but before the temp transformation is undone
            if (this.current_shape_state != SelectStates.NOSHAPE) {
                this.current_shape.draw_selection_box(this.ctx);
                this.current_shape.draw_rotation_handle(this.ctx);
            }


            /// UnApply all temporary Commands
            if (this.current_transformation != null) this.current_transformation.undo(this.shapes);
            for (let command of this.pending_undo){
                if (command.hasOwnProperty('execute')) command.execute(this.shapes);
            }
            for (let command of this.pending_commands){
                if (command.hasOwnProperty('undo')) command.undo(this.shapes);
            }
            for (let command of this.inbetween_commands){
                if (command.hasOwnProperty('undo')) command.undo(this.shapes);
            }
        }

        this.draw_border();
    }

    this.get_collision = function(x, y) {
        //We go in reverse order, because we want to check for collisions with more recently drawn items first.
        for (let i = this.shapes.length - 1; i >= 0; i--) {
            if (this.shapes[i].hasOwnProperty('collision')) {
                if (this.shapes[i].collision(x, y)) return this.shapes[i];
            }
        }
        return null; 
    }

    this.draw_border = function(){
        this.ctx.lineWidth = 10;
        this.ctx.strokeStyle = '#000000';
        this.ctx.strokeRect(-this.cw*2 - this.camera.x, -this.ch*2 - this.camera.y, this.cw*4 + this.camera.x, this.ch*4 + this.camera.y);
    }

    this.clear = function(){
        // Reset all variables.  Note that setting the .length of an array to 0 effectively clears it.
        this.shapes.length = 0; 
        this.command_history.length = 0;
        this.undo_history.length = 0; 
        this.pending_commands.length = 0; 
        this.inbetween_commands.length = 0;
        this.pending_clear = false; //Need to change in the future, not pass-by-value. Shouldnt matter though, because this value should almost never be true, and certainly never need to be stored as such
        this.pending_undo.length = 0;


        this.current_shape = null;
        this.current_shape_state = SelectStates.NOSHAPE;
        this.current_transformation = null;

    }

    this.set_page = function(page) {
        [this.shapes, this.command_history, this.undo_history, this.pending_commands, this.inbetween_commands, this.pending_clear, this.pending_undo] = this.page_manager.set_page(page);
    }

    document.getElementById('page-left').addEventListener('mousedown', function(){
        self.set_page(self.page_manager.curr_page - 1); // We don't have to worry about checking for negative/0 page number, because the set_page method takes care of that for us.
    });

    document.getElementById('page-right').addEventListener('mousedown', function(){
        self.set_page(self.page_manager.curr_page + 1); // We don't have to worry about checking for negative/0 page number, because the set_page method takes care of that for us.
    });

}