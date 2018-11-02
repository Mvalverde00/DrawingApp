# Drawing App Overview
This is a realtime, room-based drawing app based on websockets, through Flask-SocketIO. I created this to tool to easily collaborate with friends on Math and Physics homework, despite living so far away. This app is ideal for tutoring and collaborating with others. Visit the live demo at http://138.197.113.251:8080/ (domain name pending). Features include:

- A myriad of tools to choose from, with customizable line thickness and color
- Undo and redo commands
- Panning (and soon hopefully zooming) the canvas
- Toggleable Cartesian Coordinate Grid to help draw accurate graphs
- Download canvas as an image, so you can save your work for later reference
- A built-in chat system
- Public and Private Rooms
- Anonymous user system

Many other features are currently under development, such as:
- A page-based canvas system
- Ability to moderate other users in room, including: kicking, muting, and whitelist-limitting drawing
- More tools
- Performance and bug fixes
- Many other miscellaneous things.

### Technologies Used
This project is written in Python and JavaScript.  The primary library used in the development of this application was Flask, along with numerous helper Flask-Libraries for things such as connecting to a database (Flask-SQLAlchemy) or responding to requests in realtime (Flask-SocketIO).  On the JavaScript side of things, no libraries are essential to the core functionality of the whiteboard-- the entire system was built on top of the vanilla JavaScript Canvas by me.  There are some libraries which assist with the GUI, such as RaphaelJS for the colorwheel (see https://jweir.github.io/colorwheel/ ), and JQuery for interacting with the DOM in some places.
<hr>

# Commands

## Overview
Commands encapsulate almost every possible action a user can execute on the drawing app.  All commands are objects which can be represented by an array of some sort, which is used to transmit the command to the server and other clients in real-time. Every command has a unique identifier, which can be used to relate one command to another.  There are three types of commands, as follows:

### Shape
A shape is used for anything that can be represented by four points (a rectangle).  This can be basic shapes like triangles, squares, and circles, or more complicated shapes like a resistor or a star.  A default hitbox is provided for all shapes, based on the rectangle that defines it.  This can and should be overwritten, as it will likely be a poor fit for most shapes.  All shapes can be abstracted into the following array: `[start_x, start_y, width, height, stroke_color, fill_color, fill_enabled, line_width, rotation_angle, id]`

### Path
A path is used for anything that cannot be represented by four points, such as freehand drawing.  Thus, this datatype is used for freeform lines and the eraser tool, and is stored as a collection of points.  Objects of this type are currently non-selectable, and thus do not need a hitbox (this may change in the future).  All paths can be abstracted into the following array: `[start_x, start_y, stroke_color, line_width, coords, id]`

### Command
Whereas the commands of the Shape and Path type create a new object on the canvas, the Command type is used to edit existing objects.  Examples of current commands include moving and rotating shapes.  There is no set format for the array of a command.  Thus, it must be set individually in a `YourCommand.package()` method.  Thus, the Command type can be used as a catch-all for anything that does not fit into the Shape or Path definition.  

It should be noted that all Shapes and Paths are technically abstracted into an AddShape command, although this need not be of concern.

### Other Possibilities
A 'ShapePlus' command is planned, which would allow the definition of a Shape, but with some extra piece of information.  For example, a textbox is a shape- a rectangle- but with an extra piece of data-- the text.  The same could be said for an image.

## Creating a New Command

### General Rules
The entire app has been designed to make creating a new command as quickly and painlessly as possible, with no need to understand any of the underpinnings of the app.  Every new Command will being by writing a new class, which should appear in the appropriate file (shapes.js, paths.js, or commands.js).  All new classes should take the same arguments, in the same order, as their parent class.  The ID should always default to -1.  All new classes should immediately begin by invoking their parent class with the `.call` method.  See parent-specific sections below for an example of declaring a class.  All class declarations should be followed by `register_command(YourNewCommand, CommandParent);`  This assigns the command an ID and formalizes its relationship with its parent.  Now you have full defined a command.

In order to use your new command, you must add a button for it to the GUI (in `canvas.html`), and a listener for it to the main event loop (under the `mousemove` function in `main.js`.  If it is a Path, you may need to add code to `onMouseDown` in the same file).  It should be clear what you need to add from the surrounding code, seeing as adding these things is very repetitive.  In the future, adding the command to the GUI and/or main event loop may be done automagically.

### Shapes
When creating a new shape, you must assign it a `render` function.  Note that setting properties such as the stroke and fill colors, as well as zoom and translation values, will be taken care of automatically.  Thus, you only need to include logic for drawing the shape in absolute units (i.e., without accounting for scaling and translating).  You should include logic to draw the shape both with and without filling it in, unless there is no need to fill your shape (e.g. a resistor).  If you change any properties besides these (e.g. the canvas' globalCompositeOperation), YOU ARE RESPONSIBLE FOR CHANGING THEM BACK IN YOUR RENDER METHOD.

While rendering is the only required function, there are many others that you should *probably* override.  The `collision` method will simply check for a hit in the rectangle defining the shape.  Great for some shapes, but horrible for a triangle.  You should include collision logic for both with and without fill.  

The `draw_rotation_handle` and `rotation_handle_collision` functions can be overridden to change the placement of the rotation handle if you so desire.

The `get_center` method may need to be overwritten, if the center of your shape is something other than the center of the rectangle defining it.

A standard shape might look something like this:
``` javascript
function YourNewShape(x, y, width, height, stroke_color, fill_color=null, fill=false, line_width=1, theta=0, id=-1) {
    Shape.call(this, x, y, width, height, stroke_color, fill_color, fill, line_width, theta, id);

    this.render = function(ctx){
        //Your render code here
    }
    this.collision = function(mx, my){
        // Apply some logic involving mx (mousex) and my (mouse y)
    }
register_command(YourNewShape, Shape);
```

### Paths
Paths require a `draw` method.  You are responsible for setting and cleaning up any and all context variables (e.g. globalCompositeOperation) which you use in this method.  

Paths also currently require a `.package` function, which you can copy and paste from the `Freedraw` function.  Honestly, this should be a standardized function that is inherited from `Path`, and it should be changed to this soon.

No sample for creating a Path, the process is very similar to that of a shape.

### Commands
Commands are the hardest parent to create a new type of, because they have no standardized form.  All Commands need an execute and undo method.  These methods can take a parameter of an array, which will contain their target shape/path.  What they do and what construction parameters they need, however, can vary greatly. 

Commands also need the `.package`, `.package_inbetween`, and `.apply_package_inbetween` methods.  The `package` method should contain all the parameters of the Commands' constructor, in the same order, in an array.  `package_inbetween` should contain a shortened version of package, omitting any parameters that are unchanging to save network bandwidth.  No matter what, you must always send the id as the last element of the array.  `apply_package_inbetween` should take the shortened data and use it to update the command.

An example will make this much clearer:

``` javascript
function YourNewCommand(shape_id, unchanging_parameter, changing_parameter, id=-1) {
    Command.call(this, shape_id, id);

    this.execute = function(array) {
        for (let shape of array) {
            if (shape.id == this.target_id){
                // Do some sort of logic on the shape
                break;
            }
        }
    }
    this.undo = function(array) {
        for (let shape of array) {
            if (shape.id == this.target_id){
                // Undo your logic on the shape
                break;
            }
        }
    }

    this.package = function() {
        return [this.target_id, this.unchanging_parameter, this.changing_parameter, this.id]
    }
    this.package_inbetween = function() {
        // no need to package the target_id and unchanging_parameter, because they are static
        return [this.changing_parameter, this.id];   
    }
    this.apply_package_inbetween = function(data) {
        this.changing_parameter= data[0]
    }
```
<hr>

# Persisting Data

### CacheManager
Rather than directly committing a command to the database every time a request is made (which would be impossible, or at least very laggy for any non-trivial amount of requests), commands are temporarily stored in memory.  The CacheManager stores these commands in a list, `completed_data_structures`.  These commands can be accessed by a new client connecting to the room, in conjunction with commands already in the database, to sync the client with the room's current state.

The CacheManager is also responsible for commands that are currently in progress.  These commands are temporarily stored in the `in_progress_data_structures` array, and can be used to sync a newly connected client with any commands that are still in progress.  Once the command is completed, it is moved to the `completed_data_structures` array.

### PersistenceController
The PersistenceController is responsible for periodically committing and deleting all cached commands.  Thus, it handles all interactions with the database related to creating, editing, or deleting a command.  Clearing a room is the only command that is *not* cached first and bulk-executed later.  Clearing a room will directly trigger a delete query in the database, since it cannot be spammed like adding or editing a command.

### Limitations
Almost everything a user does can be stored and reliably sent to others, with the exception of the redo history.  Redo history is only cached in-browser, and thus will be lost on page refresh.  Also, it is worth noting that undo and redo histories are global, meaning you can undo and redo commands submitted by other people.

<hr>

# Backgrounds

Backgrounds are a non-erasable layer positioned behind whatever the user has drawn.  This functionality is controlled by the `LayerManager`.  Currently only one background exists, the Cartesian-Plane, which is meant to help with graphing functions.  Additional backgrounds can easily be added if there is a demand for them.
