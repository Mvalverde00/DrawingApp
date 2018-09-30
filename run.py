from drawing_app.extensions import socketio
from drawing_app.app import app

socketio.run(app, host='138.197.113.251', port=8080, debug=True)