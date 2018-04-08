from app import socketio, app

socketio.run(app, host='localhost', port=8080, debug=True)