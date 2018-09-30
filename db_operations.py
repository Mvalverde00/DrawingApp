from drawing_app.app import db
from drawing_app.models import Shape, Command

def setup():
	db.drop_all()
	db.create_all()
	db.session.commit()

def add_test_shape():
	s = Shape(0, 0, 0, 100, 100, '#000000', '#ff0000', True, 3, 0, 'fda762e196a3aeba')
	db.session.add(s)
	db.session.commit()

def setup_shape_test():
	setup()
	add_test_shape()

if __name__ == '__main__':
	setup()
