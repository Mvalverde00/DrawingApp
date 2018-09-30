function UserManager(){

	// User name and id of the client are stored separately from the test
	this.USER_ID = document.getElementById('room-data').getAttribute('data-user_id');
	this.USERNAME = document.getElementById('room-data').getAttribute('data-username');

	this.connected_users = {}

	this.connect_user = function(data){
		// data is an array containing [user_id, username]
		this.connected_users[data[0]] = data[1]
	}

	this.disconnect_user = function(user_id) {
		delete this.connected_users[user_id];
	}

	this.get_username = function(user_id){
		return this.connected_users[user_id] || null;
	}

}