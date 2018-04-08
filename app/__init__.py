from flask import Flask, render_template
from flask_socketio import SocketIO, send, emit

app = Flask(__name__)
app.config.from_object('config')

socketio = SocketIO(app)

@socketio.on('message')
def handleMessage(msg):
    print(msg)
    send(msg, broadcast=True)

#If user has permission to draw, broadcast the shape to all users and store it in the database
@socketio.on('addShapeRequest')
def addShapeEvent(data):
	print('received')
	print(data)
	permission = True

	if permission:
		emit('addShapeEvent', data, broadcast=True)
        #Store data in database

        
@app.route('/')
def index():
	return render_template('canvas.html')


if __name__ == '__main__':
    socketio.run(app)