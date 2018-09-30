from flask_sqlalchemy import SQLAlchemy
from flask_socketio import SocketIO
from flask_assets import Environment, Bundle

db = SQLAlchemy()
socketio = SocketIO(ping_interval=1.5, ping_timeout=5)
assets = Environment()

