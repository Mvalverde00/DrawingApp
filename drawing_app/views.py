from flask import Flask, render_template, session, request, redirect, flash
import time

from .room_manager import RoomManager
from .utility import Utility
from .app import app

@app.route('/')
def index():
	if 'username' in session:
		return render_template('index.html', rooms=RoomManager.get_public_rooms())
	else:
		return redirect('/login')

@app.route('/login', methods=['GET', 'POST'])
def login():
	if request.method == 'GET':
		return render_template('login-page.html')

	elif request.method == 'POST':
		username = request.form['username']

		blacklist = '!<>,./\\\'"'

		if Utility.apply_restrictions(username):
			return redirect('/login')
		else:
			session['username'] = username

			# Because multiple users can have the same name, and the socket-sid changes on page refreshes and the like, this user_id
			# will be used to identify a user for functions such as the creator of a room, current drawer, etc. 
			session['user_id'] = Utility.gen_hash(username, str(time.time()))

			return redirect('/')

	else:
		return 'invalid HTTP method.'

@app.route('/rooms/<string:room_hash>')
def show_room(room_hash):

	# Ensure room actually exists in database
	if RoomManager.room_exists(room_hash) == False:
		return 'Room does not exist.'

	# Prevent the user from connecting multiple times to the same room
	if RoomManager.user_in_room(room_hash):
		''' Pretty convoluted stuff ahead.  In my first attempt at preventing a user from double-connecting,
		simply by using the above if-statement, I inadvertenly broke page-refreshing.  When connected to a room and refreshing the page,
		the GET request (asking for a newer version of the page)  would be processed BEFORE the user was marked as disconnected from the 
		room in the database.  This meant the server would think that the refresh page request was actually a second connection by the 
		user (e.g. in a new tab), which it would then deny, because I want to disable a second-connection to the same room.

		The obvious solution to this is to delay the refresh page request, so that it occurs AFTER the database has been updated with the
		user's true state: disconnected from the room.  Unforunately, I could not find a way to delay the request nicely.  So instead,
		I send the user a blank page, containing a script that redirects them back to the room.  This adds in enough delay to ensure
		that the database is updated.  However, if the user is actually trying to double-connect, this would result in a never-ending cycle
		reloads.  Thus, there is a redirected flag so that after being redirected back to the room for the first time, the server will give
		up.

		'''

		if session['redirected']:
			session['redirected'] = False
			return 'It appears you are already connected to this room in another tab.'
		else:
			session['redirected'] = True
			return '''<script> setTimeout(function() {
						location.reload()
						}, 350);</script>'''

	session['redirected'] = False


	# We can safely reference room_hash in sockets, knowing that it will not change, because the session for a socket remains constant
	# It is like a new 'branch' from the main session used by the rest of the application
	session['room_hash'] = room_hash
	room_name = RoomManager.get_room(room_hash).name
	return render_template('canvas.html', username=session['username'], user_id=session['user_id'], room_name=room_name)

@app.route('/create-room', methods=['POST'])
def create_room():
	room_name = request.form['room-name']
	room_password = request.form['room-password']

	if RoomManager.room_exists(name=room_name, password=room_password):
		url = '/'
		flash("[ERROR]:  Room name already in use.")
	else:
		url = '/rooms/' + RoomManager.create_room(room_name, room_password)

	return redirect(url)

@app.route('/join-room', methods=['POST'])
def redirect_to_room():
	room_name = request.form['room-name']
	room_password = request.form['room-password']

	room_hash = Utility.gen_hash(room_name, room_password)

	if RoomManager.room_exists(room_hash):

		if RoomManager.user_in_room(room_hash):
			url = '/'
			flash('[ERROR]:  It appears you are already in this room, perhaps in another tab!')
		else:
			url = '/rooms/' + room_hash


	else:
		url = '/'
		flash('[ERROR]:  Room does not exist!')

	return redirect(url)