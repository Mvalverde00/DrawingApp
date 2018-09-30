function ChatManager() {

	let self = this;
	document.getElementById('chat-input').addEventListener('keypress', function(e){
		if (e.keyCode == 13) {
			e.preventDefault();
			self.onEnter();
		}
	});

	this.counter = 0;
	this.expansion_bubble = document.getElementById('chat-bubble-container');
	this.expansion_bubble.addEventListener('mousedown', function(e){
		e.preventDefault();

		if(e.button == 0) self.toggle_display();

	});

	this.chat_box_closer = document.getElementById('chat-box-closer');
	this.chat_box_closer.addEventListener('mousedown', function(e){
		e.preventDefault();
		self.toggle_display();
	});

	this.content_area = document.getElementById('chat-content');
	this.chat_box = document.getElementById('chat-box-container');

	this.previous_message_is_broadcast = false;

	this.unread_messages = 0;
	this.unread_messages_display = document.getElementById('chat-unread-message-display');

	this.update_unread_messages_decorator = function(func) {

		return function (){

			let is_scrolled_to_bottom = this.content_area.scrollHeight - this.content_area.clientHeight  <= this.content_area.scrollTop + 2; // 2 pixel error margin.

			let result = func.apply(this, arguments);

			if (is_scrolled_to_bottom) this.content_area.scrollTop = this.content_area.scrollHeight; // Keep scrolllbar at bottom when new message appears

			this.set_unread_messages(this.unread_messages + 1);

			return result;
		}

	}

	this.on_new_message = function(data){
		let user_id = data[0];
		let message = data[1];

		let username = user_manager.get_username(user_id);

		let previous_user_id = this.get_user_id_from_previous_bubble();

		// Add to existing bubble
		if ( !this.previous_message_is_broadcast && previous_user_id == user_id) {

			// Do stuff
			let bubble = this.get_previous_message_bubble();
			let bubble_addon = this.generate_bubble_addon(message);

			for (let element of bubble_addon) {
				bubble.appendChild(element);
			}

		// Generate a new bubble.  Always generate a new bubble if the last message was a broadcast, regardless of previous_user_id
		} else {

			let elements = null
			if (user_id == user_manager.USER_ID) {
				console.log('self')
				elements = this.generate_bubble_from_me(user_id, message);
			} else {
				console.log('other')
				elements = this.generate_bubble_from_them(username, user_id, message);
			}

			for (let element of elements) {
				this.content_area.appendChild(element);
			}

			this.previous_message_is_broadcast = false;

		}

	};
	this.on_new_message = this.update_unread_messages_decorator(this.on_new_message);


	this.generate_bubble_from_me = function(user_id, message) {

		let clear_div = document.createElement('div');
		clear_div.className = 'chat-content-div clear';

		let text_div = document.createElement('div');
		text_div.className = 'chat-content-div from-me';

		let p_name = document.createElement('p');
		p_name.className = 'text-muted no-margin';
		p_name.setAttribute('data-user_id', user_id);
		p_name.innerHTML = 'You';

		let p_message = document.createElement('p');
		p_message.innerHTML = message;

		text_div.appendChild(p_name);
		text_div.appendChild(p_message);


		return [clear_div, text_div];
	}

	this.generate_bubble_from_them = function(username, user_id, message) {

		let clear_div = document.createElement('div');
		clear_div.className = 'chat-content-div clear';

		let text_div = document.createElement('div');
		text_div.className = 'chat-content-div from-them';

		let p_name = document.createElement('p');
		p_name.className = 'text-muted no-margin';
		p_name.setAttribute('data-user_id', user_id);
		p_name.innerHTML = username;

		let p_message = document.createElement('p');
		p_message.innerHTML = message;

		text_div.appendChild(p_name);
		text_div.appendChild(p_message);

		return [clear_div, text_div];
	}

	this.generate_bubble_addon = function(message) {
		let hr = document.createElement('hr');
		hr.className = 'small-margin';

		let p = document.createElement('p');
		p.innerHTML = message;

		return [hr, p];
	}

	this.generate_status_message = function(username, status) {
		let clear_div = document.createElement('div');
		clear_div.className = 'chat-content-div clear';

		let p = document.createElement('p');
		p.className = 'broadcast';
												// We sanitize the usernames, so this should be okay.
		if (status == 'connecting') p.innerHTML = username + ' has joined the room!';
		else if (status == 'disconnecting') p.innerHTML = username + ' has left the room!';
		else p.innerHTML = 'Oops, an error occured';

		return [clear_div, p];

	}


	this.get_previous_message_bubble = function(){
		let elements = document.querySelectorAll('div.chat-content-div:not(.clear)');
		return elements[elements.length - 1];
	}

	this.get_user_id_from_bubble = function(bubble){
		// A bubble wont exist on the first message
		if (bubble != null) {
			console.log()
			return bubble.getElementsByClassName('text-muted')[0].getAttribute('data-user_id');
		} else {
			return null
		}
	}
	this.get_user_id_from_previous_bubble = function() {
		return this.get_user_id_from_bubble(this.get_previous_message_bubble());
	}

	this.onEnter = function(){
		let element = document.getElementById('chat-input');

		let message = element.value;

		if (message != "" && message != null){
			element.value = null
			sendMessage(message);

		}

	}

	this.toggle_display = function() {
		this.counter = (this.counter + 1)%2

		// Minimize bar and show small bubble
		if (this.counter == 0) {
			this.chat_box.classList.add('hidden');
			this.expansion_bubble.classList.remove('hidden');
		// Expand bar and hide small bubble
		} else {
			this.chat_box.classList.remove('hidden');
			this.expansion_bubble.classList.add('hidden');		
		}

		this.set_unread_messages(0);

	}


	this.set_unread_messages = function(num) {
		this.unread_messages = num;
		this.unread_messages_display.innerHTML = this.unread_messages;

		if (this.unread_messages == 0) this.unread_messages_display.classList.add('hidden');
		else this.unread_messages_display.classList.remove('hidden');

	}


	this.on_user_connect = function(data) {
		let elements = this.generate_status_message(data[1], 'connecting');

		for (let element of elements) {
			this.content_area.appendChild(element);
		}

		this.previous_message_is_broadcast = true;
	}
	this.on_user_connect = this.update_unread_messages_decorator(this.on_user_connect);


	this.on_user_disconnect = function(user_id) {

		let elements = this.generate_status_message(user_manager.get_username(user_id), 'disconnecting');

		for (let element of elements) {
			this.content_area.appendChild(element);
		}

		this.previous_message_is_broadcast = true;
	}
	this.on_user_disconnect = this.update_unread_messages_decorator(this.on_user_disconnect);




}