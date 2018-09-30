from flask import Flask

from .extensions import assets, db, socketio

def create_app():
	app = Flask(__name__)
	app.config.from_object('config')

	assets.init_app(app)
	db.init_app(app)
	socketio.init_app(app)

	return app

app = create_app()
app.app_context().push()


from .persistence_controller import PersistenceController

@app.before_first_request
def on_before_first_request():
	PersistenceController.start_auto_commit()

from . import views
from . import sockets