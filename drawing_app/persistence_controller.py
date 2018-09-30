'''
We cannot afford to commit to the database every single time someone creates a new shape- that would quickly become infeasible with any non-trivial amount of users.
Instead, we first buffer newly added shapes in memory, and then periodically commit those shapes to the database in larger batches.
This ensures that shapes are still saved, while not eating up too many resources.
The only downside is that if the server goes down unexpectedly, then all commands sent in the last ~30 seconds (or whatever the interval is) will be lost.
Hopefully, however, the server will be stable and not crash randomly, and if it does, I'll simply have to fix it.
'''
from .extensions import db
from .models import Shape, Path, OtherCommand, Command
from .periodic_task import PeriodicTask
from .cache_manager import CacheManager

from .utility import Utility

class PersistenceController():
	cache_manager = CacheManager()
	db_auto_commit = None

	def start_auto_commit():
		PersistenceController.db_auto_commit = PeriodicTask(30, PersistenceController.commit_cache_to_database)


	def commit_cache_to_database():
		PersistenceController.commit_command_cache()
		PersistenceController.commit_undo_history()

	def commit_command_cache():
		for room in PersistenceController.cache_manager.completed_data_structures:
			commands = PersistenceController.cache_manager.completed_data_structures[room]
			for command in commands.values():
				command_type = int(command[0])

				if command_type < 100:
					c = Shape(command_type, command[1], command[2], command[3], command[4], command[5], command[6], command[7], command[8], command[9], command[10], room)
				elif command_type < 200:
					c = Path(command_type, command[1], command[2], command[3], command[4], command[5], command[6], room)
				elif command_type < 300:
													# Dont need to serialize the first element, which is the command type, or the last element, which is the hash
					c = OtherCommand(command_type, Utility.list_to_string(command[1:-1]), command[-1], room)
				else:
					print('Should never happen2') 

				db.session.add(c)

			#db.session.flush()

		db.session.commit()
		PersistenceController.cache_manager.completed_data_structures.clear()

	def commit_undo_history():
		# TODO: perhaps iterate through rooms first and query for matching room and hash, to reduce collision chance
		for hashes in PersistenceController.cache_manager.pending_undo_history.values():
			# See https://stackoverflow.com/questions/14929061/deleting-on-null-to-right-of-left-outer-join-in-sqlalchemy to learn about synchronize_session
			# If there are ever errors with undo in the future, it may be because we need to change this to 'fetch' instead of false
			# But it looks like that will be slower
			if hashes != []:
				db.session.query(Command).filter(Command.hash.in_(hashes)).delete(synchronize_session='fetch')
		
		db.session.commit()
		PersistenceController.cache_manager.pending_undo_history.clear()

	# Completed shapes can be in both the database and in memory, so we must join them together.  Inprogress shapes, however, will only ever be in the cache manager
	def get_data_structures(room):

		[cache_completed, cache_in_progress] = PersistenceController.cache_manager.get_data_structures(room)
		db_completed_objects = db.session.query(Command).filter_by(room_id=room).all()
		db_completed = PersistenceController.db_object_to_list(db_completed_objects, room)

		completed = db_completed + cache_completed
		return [completed, cache_in_progress]

	# Take a list of database objects and convert them back to lists
	def db_object_to_list(db_objects, room):
		commands = []

		for command_object in db_objects:
			command_hash = command_object.hash

			if room not in PersistenceController.cache_manager.pending_undo_history or command_hash not in PersistenceController.cache_manager.pending_undo_history[room]:

				command_type = command_object.command_id

				if command_type < 100:
					commands.append([command_type, command_object.x, command_object.y, command_object.width, command_object.height, command_object.stroke_color, command_object.fill_color, command_object.fill, command_object.line_width, command_object.theta, command_hash])
				elif command_type < 200:
					commands.append([command_type, command_object.x, command_object.y, command_object.stroke_color, command_object.line_width, command_object.coords, command_hash])
				elif command_type < 300:
					args = Utility.string_to_list(command_object.serialization)
					arr = [command_type, command_hash]
					arr[1:1] = args # inster args into center of array
					commands.append(arr)
				else:
					print('Should never happen3')

		return commands


	def clear_room(room):
		PersistenceController.cache_manager.clear_room(room)
		PersistenceController.clear_database(room)

	def clear_database(room):
		# We are handling clears in real-time right now, because they presumably won't occur as frequently as commands and undo/redo
		# It may be smart to keep track of how accurate this is and how often we get clear requests, to see if it is worth queueing them
		db.session.query(Command).filter_by(room_id=room).delete()
		db.session.commit()