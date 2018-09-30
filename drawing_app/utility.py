"""
This class contains general-purpose functions, which multiple other classes or functions need access to,
such as the hashing function
"""
import hashlib
from flask import flash

class Utility():

	# Take two pieces of information (as strings), such as a name and password, or a username and time, and return
	# a hash of the two of them, concatenated together
	def gen_hash(name, pwd, SIGNIFICANT_CHARS = 16):

		str_to_hash =  (name + pwd ).encode('utf-8')
		result = hashlib.sha256( str_to_hash).hexdigest()
		result = result[0: SIGNIFICANT_CHARS]
		return result

	# Dictates restrictions on the creation of usernames and passwords.  The max length, 64, is as long as the database column is 
	# configured to store.  The blocked characters are not usually used in names, and have the possibility to cause more harm than good.
	def apply_restrictions(string, chars='!<>,./\\\'"', max_length=64):
		for char in chars:
			if char in string:
				flash('[ERROR]: Contains invalid characters')
				return True

		if len(string) > max_length:
			flash('[ERROR]: Maximum length exceeded')
			return True



	# Remove potentially dangerous characters to prevent XSS
	def escape(html):
   		return html.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;').replace("'", '&#39;')


   	# MUST BE A 1D LIST, OTHERWISE THERE IS NO GUARANTEE IT WORKS
	def list_to_string(arr):
		return ';'.join(str(i) for i in arr)

	def string_to_list(str):
		return str.split(';')