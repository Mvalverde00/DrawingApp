function LayerManager(canvas, ctx, shape_manager, camera) {

	this.canvas = canvas;
	this.ctx = ctx;

	   // Total area viewable by panning the camera.
    this.mapx = 4800;
    this.mapy = 2700;

	this.shape_manager = shape_manager;
	this.camera = camera;

	this.background = new CartesianPlaneBackground();
	this.background_enabled = false;

    this.render = function(){
    	this.ctx.clearRect(0,0, this.canvas.width, this.canvas.height);

    	if (this.background_enabled){
			this.background.render(this.ctx, this.mapx, this.mapy, this.canvas.width, this.canvas.height, this.camera.x, this.camera.y);
    	}

    	this.shape_manager.render();
    	this.ctx.drawImage(this.shape_manager.canvas, 0, 0);

    }

    this.download = function(scope){

    	let canvas = document.createElement('canvas');

    	switch (scope) {
            case 'viewport':
                canvas.width = 1600;
                canvas.height = 900;
                ctx = canvas.getContext('2d');

                // PNG images allow transparency.  Without manually adding in a white background, the background is transparent, which is not the goal
                ctx.fillStyle = '#ffffff';
                ctx.strokeStyle = '#ffffff';
                ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

                ctx.drawImage(this.canvas, 0, 0);

                /*
                if (this.background_enabled){
					this.background.render(ctx, this.mapx, this.mapy, this.canvas.width, this.canvas.height, this.camera.x, this.camera.y);
    			}

    			this.shape_manager.render();
    			ctx.drawImage(this.shape_manager.canvas, 0, 0);
				*/
                break;

            case 'canvas':
            	// Will display the entire canvas, shruken down into 1080p
                canvas.width = 1920;
                canvas.height = 1080;
                ctx = canvas.getContext('2d');

                // PNG images allow transparency.  Without manually adding in a white background, the background is transparent, which is not the goal
                ctx.fillStyle = '#ffffff';
                ctx.strokeStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Create a new, large canvas, capable of yeah
                let full_canvas = document.createElement('canvas')
                full_canvas.width = this.mapx;
                full_canvas.height = this.mapy;
                let full_ctx = full_canvas.getContext('2d');

               	// The origin of the new canvas must be the same as the origin in a normal sized canvas, so we translate it over
                full_ctx.translate(1600,900);


                for (let shape of this.shape_manager.shapes) {
                	shape.draw(full_ctx);
                }

                ctx.scale(canvas.width/this.mapx, canvas.height/this.mapy);
                ctx.drawImage(full_canvas, 0, 0)
                ctx.scale(this.mapx/canvas.width, this.mapy/canvas.height);
                break;
            // Should never happen
            default:
                alert('Something went wrong with the download!')
                break;
        }

        return canvas.toDataURL('image/png').replace("image/png", "image/octet-stream");
    }


}