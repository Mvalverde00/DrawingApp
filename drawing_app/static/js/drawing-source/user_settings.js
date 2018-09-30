
function Settings(stroke_color, fill_color, fill, tool, line_width) {
    this.stroke_color = stroke_color;
    this.fill_color = fill_color;
    this.fill = fill;
    this.tool = tool;
    this.line_width = line_width;

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

    this.set_line_width = function(width) {
        this.line_width = parseInt(width);
    }

}

function User(username) {
    this.username = username;
    this.settings = new Settings('#000000', '#ffffff', false, 0, 1);
}