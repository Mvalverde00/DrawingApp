function Command(target_id, id=-1) {

    this.target_id = target_id;

    // Exact same id-setup as in Shape class- see there for explanation.
    this.id = id; 
    this.set_id = function(){
        if (this.id == -1) {
            string_to_hash = this.target_id + Date.now();
            this.id = md5(string_to_hash);
        }
    }

    this.execute = function(){};
    this.undo = function(){};
    this.package = function(){};

}

function AddShape(shape) {
    Command.call(this, shape.id, shape.id);

    this.shape = shape;
    this.execute = function(array) {
        console.log('executing');
        array.push(this.shape);
    }
    this.undo = function(array) {
        console.log('undoing');
        for (let i = array.length - 1; i >= 0; i--){ // Start from the end of the array, because an undone command is more likely to be towards the end
            if (array[i].id == this.target_id) {
                array.splice(i,1);
                break;
            }
        }
    }

    this.apply_package_inbetween = function(data) {
        this.shape.apply_package_inbetween(data);
    }

}
register_command(AddShape, Command);

function Move(shape_id, sx, sy, ex, ey, id=-1) {
    Command.call(this, shape_id, id);

    this.sx = parseFloat(sx);
    this.sy = parseFloat(sy);
    this.ex = parseFloat(ex);
    this.ey = parseFloat(ey);
    this.execute = function(array){
        for (let shape of array) {
            if (shape.id == this.target_id) {
                shape.translate(this.sx, this.sy, this.ex, this.ey);
                break;
            }
        }

    }
    this.undo = function(array) {
        for (let shape of array) {
            if (shape.id == this.target_id) {
                shape.translate(this.ex, this.ey, this.sx, this.sy);
                break;
            }
        }
    }

    this.package = function() {
        return [this.target_id, this.sx, this.sy, this.ex, this.ey, this.id];
    }
    this.package_inbetween = function() {
        return [this.sx, this.sy, this.ex, this.ey, this.id]
    }
    this.apply_package_inbetween = function(data) {
        this.sx = data[0];
        this.sy = data[1];
        this.ex = data[2];
        this.ey = data[3];
    }
}
register_command(Move, Command);

function Rotate(shape_id, theta, id=-1) {
    Command.call(this, shape_id, id);

    this.theta = parseFloat(theta);

    this.execute = function(array) {
        for (let shape of array) {
            if (shape.id == this.target_id){
                shape.theta += this.theta;
                break;
            }
        }
    }
    this.undo = function(array) {
        for (let shape of array) {
            if (shape.id == this.target_id){
                shape.theta -= this.theta;
                break;
         }
        }
    }

    this.package = function() {
        return [this.target_id, this.theta, this.id]
    }
    this.package_inbetween = function() {
        return [this.theta, this.id];   
    }
    this.apply_package_inbetween = function(data) {
        this.theta = data[0]
    }

}
register_command(Rotate, Command);