from flask_socketio import join_room, leave_room, send, emit
import datetime

from .extensions import db


rooms_users = db.Table('ROOMS_USERS',
	db.Column('user_id', db.String(16), db.ForeignKey('USERS.id'), primary_key=True),
	db.Column('room_id', db.String(16), db.ForeignKey('ROOMS.id'), primary_key=True)
	)

class Room(db.Model):
	__tablename__ = 'ROOMS'
	id = db.Column(db.String(16), primary_key=True) #16-bit room hash
	name = db.Column(db.String(64))
	owner_id = db.Column(db.String(16), db.ForeignKey('USERS.id'), nullable=True) #16-bit user-id.  If no one is in a room, there will be no owner
	is_public = db.Column(db.Boolean) #Public rooms have no password, and will be available for anyone to join, either 
									  # from a selection menu or via matchmaking

	creation_date = db.Column(db.DateTime) # Eventually, Rooms will be deleted 7 days after their creation
	last_accessed = db.Column(db.DateTime) # Rooms can be deleted prior to 7 days if they are not accessed for 36 hours

	users = db.relationship('User', secondary=rooms_users, lazy='subquery',
			backref=db.backref('rooms', lazy=True))

	commands = db.relationship('Command', backref='room', lazy=True)

	MAXIMUM_OCCUPANTS = 8

	def __init__(self, id, name, is_public):
		self.id = id
		self.name = name
		self.is_public = is_public
		
		self.owner = None
		self.creation_date = datetime.datetime.now()
		self.last_accessed = datetime.datetime.now()
		self.MAXIMUM_OCCUPANTS = 8


class User(db.Model):
	__tablename__ = 'USERS'
	id = db.Column(db.String(16), primary_key=True)
	name = db.Column(db.String(64))

	rooms_owned = db.relationship('Room', backref='owner', lazy=True)

	def __init__(self, id, name):
		self.id = id
		self.name = name


class Command(db.Model):
	__tablename__ = 'COMMANDS'
	id = db.Column(db.Integer, primary_key=True)

	room_id = db.Column(db.String(16), db.ForeignKey('ROOMS.id'))
	page = db.Column(db.Integer) # No real use yet, but eventually I may add multiple pages to a room, which would necessitate this column

	command_id = db.Column(db.Integer)
	hash = db.Column(db.String(16), unique=True)

	polymorphic_discriminator = db.Column(db.String(1)) # Necessary to keep track of what type the command is

	__mapper_args__ = {
		'polymorphic_identity' : 'c',
		'polymorphic_on' : polymorphic_discriminator
	}

	def __init__(self):
		pass

class Shape(Command):
	__tablename__ = 'SHAPES'
	id = db.Column(db.Integer, db.ForeignKey('COMMANDS.id', ondelete='CASCADE'), primary_key=True)

	x = db.Column(db.Integer)
	y = db.Column(db.Integer)
	width = db.Column(db.Integer)
	height = db.Column(db.Integer)
	stroke_color = db.Column(db.String(7)) # This could realistically be shortened to 3 bytes if we store only the colors' RGB component
	fill_color = db.Column(db.String(7)) # Ditto.
	fill = db.Column(db.Boolean)

	line_width = db.Column(db.Integer)
	theta = db.Column(db.Integer)

	__mapper_args__ = {
		'polymorphic_identity' : 's',
	}

	def __init__(self, command_id, x, y, width, height, stroke_color, fill_color, fill, line_width, theta, hash, room_id):
		self.command_id = command_id
		self.x = x
		self.y = y
		self.width = width
		self.height = height
		self.stroke_color = stroke_color
		self.fill_color = fill_color
		self.fill = fill
		self.line_width = line_width
		self.theta = theta
		self.hash = hash

		self.room_id = room_id

		self.polymorphic_discriminator = 's'

class Path(Command):
	__tablename__ = 'PATHS'
	id = db.Column(db.Integer, db.ForeignKey('COMMANDS.id', ondelete='CASCADE'), primary_key=True)

	x = db.Column(db.Integer)
	y = db.Column(db.Integer)

	# Assuming 6 characters per number (e.g. 100.32), with 2 numbers in a coordinate ( e.g. x,y ), with a comma and semi-colon, we get 14 characters per coordinate pair
	# Thus, 30000 characters should be sufficiently long enough- 2142 coordinates for any given path.
	# I will perform an analysis once there are lots of paths in the database and see how close people actually get to this limit, and if it needed to be raised or
	# lowered in the future
	coords = db.Column(db.String(30000))

	stroke_color = db.Column(db.String(7)) # This could realistically be shortened to 3 bytes if we store only the colors' RGB component
	line_width = db.Column(db.Integer)
	theta = db.Column(db.Integer)

	__mapper_args__ = {
		'polymorphic_identity' : 'p',
	}

	def __init__(self, command_id, x, y, stroke_color, line_width, coords, hash, room_id):
		self.command_id = command_id
		self.x = x
		self.y = y
		self.stroke_color = stroke_color
		self.line_width = line_width
		self.coords = coords
		self.hash = hash

		self.room_id = room_id

		self.polymorphic_discriminator = 'p'

class OtherCommand(Command):
	__tablename__ = 'OTHERCOMMANDS'
	id = db.Column(db.Integer,  db.ForeignKey('COMMANDS.id', ondelete='CASCADE'), primary_key=True)

	serialization = db.Column(db.String(100)) # No idea how long this should be, but 100 seems like a reasonable limit.  Will increase in future if necessary

	__mapper_args__ = {
		'polymorphic_identity' : 'o',
	}

	def __init__(self, command_id, serialization, hash, room_id):
		self.command_id = command_id
		self.serialization = serialization
		self.hash = hash
		
		self.room_id = room_id

		self.polymorphic_discriminator = 'o'