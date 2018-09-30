from flask import session

from .utility import Utility
from .models import Room, User
from .extensions import db

class RoomManager():
	def create_room(name, password):
		room_hash = Utility.gen_hash(name, password)

		# The third parameter, is_public, is true if there is no password
		room = Room(room_hash, name, password=='')

		# Add Room to database
		db.session.add(room)
		db.session.commit()

		# Return the room hash so the user can be redirected
		return room_hash

	def join_room(hash_):
		room = Room.query.filter_by(id=hash_).first()

		# Add user to database if they do not exist.  Otherwise, select them from database
		user = User.query.filter_by(id=session['user_id']).first()
		if user == None:
			user = User(session['user_id'], session['username'])

		# Add user to room list. Also, if there is currently no owner, 
		# give this user ownership of the room
		room.users.append(user)

		if room.owner == None:
			room.owner = user

		db.session.commit()

	def leave_room(hash_):
		room = Room.query.filter_by(id=hash_).first()
		user = User.query.filter_by(id=session['user_id']).first()


		# Remove user from room
		room.users.remove(user)

		# If this user was the owner, make someone else the owner
		if room.owner == user:
			print('he owns it')
			if len(room.users) == 0:
				room.owner = None
			else:
				room.owner = room.users[0]

		# If this is the only room the user is in, remove them from the database
		if len(user.rooms) == 0:
			db.session.delete(user)

		db.session.commit()


	# Returns a list of users in room
	def get_users_in_room(hash_, include_self=True):

		if include_self:
			return db.session.query(Room).filter_by(id=hash_).first().users
		else:
			return [user for user in db.session.query(Room).filter_by(id=hash_).first().users if user.id != session['user_id']]


	def get_room(hash_):
		return db.session.query(Room).filter_by(id=hash_).first()
	#############################################
	#				Helper functions			#
	#############################################
	def room_exists(hash_=None, name=None, password=None):
		# Check if room exists, given either a hash OR a name and a password

		#If the hash is None, use the name & password
		if hash_ == None:
			hash_ = Utility.gen_hash(name, password)

		return Room.query.filter_by(id=hash_).first() != None

	def user_in_room(hash_):
		room = Room.query.filter_by(id=hash_).first()

		user_ids = [user.id for user in room.users ]
		
		return session['user_id'] in user_ids

	def get_public_rooms():
		return Room.query.filter_by(is_public=True).order_by(Room.creation_date)