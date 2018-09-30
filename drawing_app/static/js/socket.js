window.onload = function() {

	socket = io.connect(null, {port:8080, rememberTransport:false})
	const room = (window.location.pathname).replace('/rooms/','')

	//When connecting, the client should request the current command history, undo history, and redo history
	//To get in sync
	socket.on('connect', function() {
		//socket.emit('join', room);
	}); 

	socket.on('sync', function(data) {

		let shape_data = data['shape']
		let completed_commands = shape_data[0];
		let in_progress_commands = shape_data[1];

		if (completed_commands.length > 0) {
			for (let command of completed_commands) {
				command = DataManager.unpackage(command);
				c.shape_manager.execute_command(command);
			}
		}

		if (in_progress_commands.length > 0) {
			for (let command of in_progress_commands) {
				command = DataManager.unpackage(command);
				c.shape_manager.inbetween_commands.push(command);
			}
		}
		c.layer_manager.render();



		let id_name_pairs = data['user']

		// If there were no users in the room, [null] is returned
		// Therefore, we must first check that the first element is not null
		if (id_name_pairs[0] != null){
			for (let pair of id_name_pairs) {
				user_manager.connect_user(pair);
			}
		}

	});

	 
	socket.on('addShapeEvent', function(data) {
		sender = data.pop(); // Remove the sender id and store it, because it is not actually part of the command
	    command = DataManager.unpackage(data);

	    for( let pending_command of c.shape_manager.pending_commands) {
	    	if (command.id == pending_command.id) {
	    		index = c.shape_manager.pending_commands.indexOf(pending_command);
				c.shape_manager.pending_commands.splice(index, 1);
				break;
	    	}
	    }

	    for (let inbetween_command of c.shape_manager.inbetween_commands) {
	    	// Remember that inbetween_commands for AddShape used the user_id as their ID, so we must also check if it equals the sender's id
	    	if (command.id == inbetween_command.id || sender == inbetween_command.id) {
	    		index = c.shape_manager.inbetween_commands.indexOf(inbetween_command);
	    		c.shape_manager.inbetween_commands.splice(index, 1);
	    		break;
	    	}
	    }

	    c.shape_manager.execute_command(command);
	    c.layer_manager.render();
	});


	socket.on('commandDenied', function(id) {
		for( let command of c.shape_manager.pending_commands) {
			if (command.id == id) {
				index = c.shape_manager.pending_commands.indexOf(command);
				c.shape_manager.pending_commands.splice(index, 1);
			}
		}
	});

	socket.on('inbetweenCommandEvent', function (data){
		// Id will ALWAYS be last element in array
		let id = data[data.length - 1];

		// Check if the command ID is already in inbetween_commands.
		let command = null;
		for (let inbetween_command of c.shape_manager.inbetween_commands) {
			if (inbetween_command.id == id) {
				command = inbetween_command;
				break;
			}
		}

		// If the ID is already present, simply update it; otherwise, create a command and add it to inbetween_commands
		if (command != null) {
			command.apply_package_inbetween(data);
		} else {
			command = DataManager.unpackage(data);
			c.shape_manager.inbetween_commands.push(command);
		}

		c.layer_manager.render();


	});

	socket.on('clear', function() {
		c.shape_manager.clear();
		c.layer_manager.render();
	});

	socket.on('undo', function(hash) {
		c.shape_manager.undo_command(hash);
		c.layer_manager.render();
		console.log('========================================')
	});

	socket.on('redo', function(data) {
		c.shape_manager.redo_command(DataManager.unpackage(data));
		c.layer_manager.render();
	});







	socket.on('receiveMessage', function(data){
		chat_manager.on_new_message(data);
	});


	socket.on('userConnect', function(data){
		user_manager.connect_user(data);
		chat_manager.on_user_connect(data);

	});
	socket.on('userDisconnect', function(user_id){
		chat_manager.on_user_disconnect(user_id);
		user_manager.disconnect_user(user_id);
	});

}


//////////////////////////////////////////////////////
//				CANVAS-DRAWING SENDERS				//
////////////////////////////////////////////////////// 


function sendShape(data){
	socket.emit('addShapeRequest', data);
}

function sendInbetweenCommand(data) {
	socket.emit('inbetweenCommand', data);
}
function sendClear() {
	c.shape_manager.pending_clear = true;
	c.layer_manager.render();

	socket.emit('clear');
}

function sendUndo() {
	console.log('========================================')
	for (let i = c.shape_manager.command_history.length - 1; i >= 0; i--){
		let command_to_undo = c.shape_manager.command_history[i];

		// If the command is not already queued to be undone...
		if ( c.shape_manager.pending_undo.indexOf(command_to_undo) == -1) {
			c.shape_manager.pending_undo.push(command_to_undo);
			
			socket.emit('undo', command_to_undo.id);

			c.layer_manager.render();
			break;
		}
	}


}

function sendRedo() {

	for (let i = c.shape_manager.undo_history.length - 1; i >= 0; i--){
		let command = c.shape_manager.undo_history[i];
		console.log(command);
		socket.emit('redo', DataManager.package(command));
		break;
	}

	c.layer_manager.render();
}


//////////////////////////////////////////////////////
//					CHAT SENDERS					//
////////////////////////////////////////////////////// 

function sendMessage(message) {
	socket.emit('sendMessage', message);
}