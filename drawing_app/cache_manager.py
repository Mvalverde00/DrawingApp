from flask import session

from collections import OrderedDict

class CacheManager():

	def __init__(self):
		self.completed_data_structures = {}
		self.in_progress_data_structures = {}

		# Tracks all commands stored IN THE DATABASE which need to be 'undone' (deleted).  During the periodic commit, this dictionary will be cleared and the commands it points to will be 
		# permanently deleted from the database.  This is done because there is no permanent redo-ing (i.e. after refreshing the page, the user can't redo).  Thus, there is no reason to permanently store 
		# the undo history, only to delete commands as it dictates at intervals.  Further, this is only for commands IN THE DATABASE because those must be batch-deleted, while commands that are 
		# still in-memory (i.e. completed_data_structures)
		self.pending_undo_history = {}

	def onInbetweenEvent(self, data):
		room = session['room_hash']
		command_id = data[-1] 

		if room not in self.in_progress_data_structures:
			self.in_progress_data_structures[room] = OrderedDict()

		if command_id not in self.in_progress_data_structures[room]:
			self.in_progress_data_structures[room][command_id] = data
		else:
			command_type = int(self.in_progress_data_structures[room][command_id][0])
			if command_type < 100:
				self.in_progress_data_structures[room][command_id][3] = data[0] # update width
				self.in_progress_data_structures[room][command_id][4] = data[1] # update height
			elif command_type < 200:
				self.in_progress_data_structures[room][command_id][5] += data[0] # string concatenation for coordinates
			elif command_type < 300:
				for i, datum in enumerate(data):
					if i != len(data) - 1: # The last datum is the hash, unchanging, does not need to be updated
						self.in_progress_data_structures[room][command_id][i+1] = datum # +1 offset because the list in the dictionary has the command_id in the front

			else:
				print('should never happen')

	def onAddShapeEvent(self, data):
		room = session['room_hash']
		old_id = data[-1]
		command_id = data[-2]

		# Delete from in_progress if it exists and add to completed
		if room in self.in_progress_data_structures:
			self.in_progress_data_structures[room].pop(old_id, None)

		if room in self.completed_data_structures:
			self.completed_data_structures[room][command_id] = data[:-1] # The last element contains the user ID, which is no longer relevant as the command now has its own id
		else:
			self.completed_data_structures[room] = OrderedDict( [ (command_id, data[:-1]) ] ) # We need an ordered dict because command order matters

	def onUndo(self, hash, room):
		# Remove from completed commands, if it exists
		if room in self.completed_data_structures.keys():
			result = self.completed_data_structures[room].pop(hash, None)
		else:
			# If the room wasnt in memory, the command definitely wasnt.
			result = None

		# If the command did not exist in completed_data_structures, add it to pending undo
		if result is None:

			if room not in self.pending_undo_history:
				self.pending_undo_history[room] = []

			self.pending_undo_history[room].append(hash)

	def onRedo(self, data, room):
		hash = data[-1] # Redo data does NOT have the user_id appended to the end, therefore the last element is its id or hash

		# remove from undo history if it is currently there.  The shape is still in the database, no need for any changes
		if room in self.pending_undo_history and hash in self.pending_undo_history[room]:
			self.pending_undo_history[room].remove(hash)
		# Has already been deleted from database, we need to add it to queue
		else:
			# add to completed commands instantly -- no inbetween
			if room in self.completed_data_structures:
				self.completed_data_structures[room][hash] = data
			else:
				self.completed_data_structures[room] = OrderedDict( [ (hash, data) ] ) # We need an ordered dict because command order matters


	def get_data_structures(self, room):
		completed = self.completed_data_structures.get(room, {})
		completed = list(completed.values())

		in_progress = self.in_progress_data_structures.get(room, {})
		in_progress = list(in_progress.values())

		return [completed, in_progress]



	def clear_room(self, room):
		if room in self.completed_data_structures.keys():
			self.completed_data_structures[room].clear()
			self.in_progress_data_structures[room].clear()

	def clear_all(self):
		self.completed_data_structures.clear()
		self.in_progress_data_structures.clear()
