from flask import session, request
from flask_socketio import emit, send, leave_room, join_room

from .extensions import socketio
from .room_manager import RoomManager
from .utility import Utility


# Cache incoming command datastructures in memory, to batch commit later
# These will be necessary for people who connect while someone else has already started drawing, or before a shape has been committed.
from .persistence_controller import PersistenceController


######################################
#			Data Transmission	   	 #
######################################

@socketio.on('sendMessage')
def handleMessage(message):
	room = session['room_hash']

	message = Utility.escape(message)

	data = [session['user_id'], message]

	emit('receiveMessage', data, room=room)

# When user first connects, send them all the previously drawn and in-progress shapes
@socketio.on('connect')
def add_to_room_and_sync_client():

	print('------------------------ user has connected!!!')
	print(request.sid)

	room = session['room_hash']

	# Add user to room
	join_room(room)
	RoomManager.join_room(room)

	# Broadcast connection to all users in room
	emit('userConnect', [ session['user_id'], session['username']], room=room)


	# Get newly connected client up-to-date
	users = RoomManager.get_users_in_room(room, False)
	id_name_pairs = [ [user.id, user.name] for user in users ] or [None]

	shape_data = PersistenceController.get_data_structures(room)
	
	emit('sync', {'shape':shape_data, 'user':id_name_pairs})

#If user has permission to draw, broadcast the shape to all users and store it in the database
@socketio.on('addShapeRequest')
def addShapeEvent(data):

	permission = True

	if permission:
		data.append(session['user_id'])
		emit('addShapeEvent', data, room=session['room_hash'])
		PersistenceController.cache_manager.onAddShapeEvent(data)
        #Store data in database
	else:
		emit('commandDenied', data[10], room=request.sid)

@socketio.on('inbetweenCommand')
def sendInbetweenCommand(data):

	permission = True

	if permission:
		
		# Shape id is not assigned until the shape has been finalized.  Because of this, inbetweenCommand of shapes will have the default
		# id of -1.  We need another way to identify them all as progressions of the same shape, so we use the sender's user_id
		if data[-1] == -1:
			data[-1] = session['user_id']

		emit('inbetweenCommandEvent', data, room=session['room_hash'], include_self=False)
		PersistenceController.cache_manager.onInbetweenEvent(data)

	else:
		emit('inbetweenCommandDenied', room=request.sid)

@socketio.on('clear')
def onClear():
	room = session['room_hash']

	PersistenceController.clear_room(room)
	emit('clear', room=room)

@socketio.on('undo')
def onUndo(hash):
	room = session['room_hash']

	PersistenceController.cache_manager.onUndo(hash, room)
	emit('undo', hash, room=room)

@socketio.on('redo')
def onRedo(data):
	# Since the data might not be persisted in other clients, and definitely isnt on the server, redo requires sending the entire command's data back, instead of just the hash

	room = session['room_hash']

	PersistenceController.cache_manager.onRedo(data, room)
	emit('redo', data, room=room)

######################################
# 			Join/Leave Room 		 #
######################################

@socketio.on('leave')
def on_leave(room):
	
	leave_room(room)
	RoomManager.leave_room(room)

	username = session['username']


@socketio.on('disconnect')
def disconnect_user():
	print('user has disconnected!-------------------------')
	# Need to use different method instead of Referer from headers- this is apparently unreliable
	# Perhaps store sids in database user_rooms table and reference that
	url = request.headers['Referer'] # http://138.197.113.251/rooms/some_hash
	print('here------------------------------------')
	room = url.split('/')[-1]

	leave_room(room)
	RoomManager.leave_room(room)

	username = session['username']
	emit('userDisconnect', session['user_id'], room=room)