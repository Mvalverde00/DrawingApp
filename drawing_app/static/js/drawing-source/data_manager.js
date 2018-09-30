function DataManager() {
}
    //Turn data into command
    //element 0 = Command ID;  next elements are parameters for relevent constructors IN ORDER
    DataManager.unpackage = function(array) {
        var params = array.splice(1, array.length - 1);
        var command = new COMMAND_IDS[array[0]](...params);

        //If the received command does not have a target_id, it must be a shape.  Wrap shape in AddShape command.
        if ( !(command.hasOwnProperty('target_id')) ) {
            command = new AddShape(command);
        }
        return command;
    }

    //Turn command into data
    DataManager.package = function(command) {

        // Ideally, the command passed in *should* be just the shape instead of the addshape command.  However, if the AddShape command is passed, we can work around that.
        if (command.constructor == AddShape) command = command.shape;

        let array = command.package();

        //Insert command ID into array
        array.splice(0, 0, COMMAND_IDS.indexOf(command.constructor) );

        console.log(array);
        //array.splice(array.length - 2, 0, c.shape_manager.page_manager.curr_page); // Insert the page of the commamd, right before the ID which is always last.

        return array;

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