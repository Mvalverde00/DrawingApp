from app import socketio, app

socketio.run(app, host='138.197.113.251', port=8080, debug=True)