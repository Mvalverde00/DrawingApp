# Idea taken from https://stackoverflow.com/questions/2398661/schedule-a-repeating-event-in-python-3/2399145#2399145

from threading import Timer, Lock

from .app import app

class PeriodicTask():

    def __init__(self, interval, function, *args, **kwargs):
        self._lock = Lock()
        self._timer = None
        self.function = function
        self.interval = interval
        self.args = args
        self.kwargs = kwargs
        self._stopped = True
        if kwargs.pop('autostart', True):
            print('starting now!!!!!!!!!')
            self.start()

    def start(self, from_run=False):
        self._lock.acquire()
        if from_run or self._stopped:
            self._stopped = False
            self._timer = Timer(self.interval, self._run)
            self._timer.start()
            self._lock.release()

    def _run(self):
        self.start(from_run=True)

        # The function needs to be run with access to the app context, since it will be in a new thread
        with app.test_request_context():
            self.function(*self.args, **self.kwargs)

    def stop(self):
        self._lock.acquire()
        self._stopped = True
        self._timer.cancel()
        self._lock.release()