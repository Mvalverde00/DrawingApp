function InterpolationManager() {

	// For the sake of simplicity, all self-references in this class will use 'self' isntead of 'this'
	// This resolved an error that occured with the use of setInterval and send_interval_update: the 'this' keyword in the latter of the two
	// was referring to the former, and thus the properties 'this.current_shape' and 'this.current_transformation' did not exist

	// https://stackoverflow.com/questions/7942138/how-do-i-setinterval-to-call-a-function-within-a-class
	// Read respone by user 'nnnnnn' in the post above for clarification.
	var self = this;

	self.current_shape = null;
	self.current_transformation = null;

	self.current_command = null;
	self.first_time = true;

	// Stores id of setInterval so it can later be cleared
	self.send_inbetween_message_interval;

	self.onMouseDown = function() {

		self.send_inbetween_message_interval = setInterval(self.send_interval_update, 100);

	};

	self.onMouseUp = function() {
		clearInterval(self.send_inbetween_message_interval);
		self.current_shape = null
		self.current_transformation = null;
		self.current_command = null;
		self.first_time = true;
	};

	self.send_interval_update = function() {

		if (self.current_transformation != null) self.current_command = self.current_transformation;
		else if (self.current_shape != null) self.current_command = self.current_shape;
		else return; // If both current transformation and shape are null, we have nothing to send, so return early

		if (self.first_time) {
			sendInbetweenCommand(DataManager.package(self.current_command));
			self.first_time = false;
		} else {
			sendInbetweenCommand(self.current_command.package_inbetween());
		}


	};

	// It would be nice if we could use a pointer to the variable in c.shape_manager, but unfortunately pointers do not exist in js
	// so we must update the current_ variables every time they are updated in c.shape_manager.
	self.update_current = function(current_shape, current_transformation) {
		self.current_shape = current_shape;
		self.current_transformation = current_transformation;
	};
}