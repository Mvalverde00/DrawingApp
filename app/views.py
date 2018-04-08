'''
from app import app

@app.route('/')
def index():
	return render_template('canvas.html')
'''