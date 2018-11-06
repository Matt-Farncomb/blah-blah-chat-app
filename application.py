import os

from flask import Flask, render_template, request, session, redirect, url_for, jsonify
from flask_session import Session
from flask_socketio import SocketIO, emit

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)

#Configure session to use filesystem
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

#a dict to store key, value pairs of {channel string: messages list}
channels = {}


'''
Main page where users enter their name and create enw channelas.
If users are visiting the site after previously going into a 
particular channel, they are redirected from 'index' to the channel
they last visited. The redirect is stopped when user has either
not visited previously or are hitting the 'back' button on the'channels' 
 page as the 'chan-name' key will no longer be in sesson.
'''
@app.route("/")
def index():
	if "chan_name" not in session:
		return render_template("index.html", channels=channels)
	return redirect(url_for('channel_selection', chan=session["chan_name"]))


'''
Enable users to login. Logged in names are stored in session 
so that when a user posts a message, said message is labelled
witht their name.
'''
@app.route("/", methods=["POST"])
def login():
 	name = request.form.get("name")
 	session["name"] = name
 	return render_template("index.html", channels=channels)



'''
A link in the DOM is needed that can be created dynamically in js
It will be the channel name with the value of channel name
This when clicked on will send the value to the serever as a post request

A link is selected on the index page. This is a channel name.
The channel name posts to "channel_selection" and is assigned to chan_name
Chan name is then assigned to the session
The messages that are rendered to DOM are from the channels dict...
	which stores all messages under their chan name as the key.
'''

#<string:chan_name>

'''
When visiting, chan users are directed to the channel page of 
name 'chan'. Variable chan is stored in sessions so when a user 
revisits the site, they are automatically redirected from the main
page to 'chan' which is the channel they were last using.
'''
@app.route("/channels/<string:chan>", methods=["GET"])
def channel_selection(chan):
	# If channel in URL exists return it's template.
	if chan in channels:
		session["chan_name"] = chan
		return render_template("channel_template.html", 
			messages=channels[chan]["msg_lst"], 
			channels=channels,
			current=chan)

	# If it does not exist, but aanotehr channel was visited previously
	# (ie it is in  sesssion), delete old visited channel from session only
	elif "chan_name" in session:
		del session["chan_name"]
	# channel does not exist and session has been cleared, inform
	# user that channel does not exist
	return render_template("error.html")








'''
Creates a key, value pair of message and sender. adds that to
the channels dict under the correct channle name key and then
broadcasts the messgae k, v pair to all clients ready to
be appended to DOM by js.
'''
# class msg_obj(object):
#  	"""docstring for ClassName"""
#  	def __init__(self, id, name, message, channel):
#  		self.id = id,
#  		self.name = name,
#  		self.message = message,
#  		self.channel = channel

@socketio.on("send message")
def upload_msg(data):
	maximum = 3
	channels[session['chan_name']]["msg_count"] += 1
	count = channels[session['chan_name']]["msg_count"]
	# message = f"{session['name']}: {data['message']}"

	new_msg = 	{
				"id":f"msg_{count}",
				"name": session['name'],
				"message":data['message'],
				"channel":session['chan_name']
				}
				

	# new_msg = msg_obj(	id=count,
	# 					name=session['name'],
	# 					message=data['message'],
	# 					channel=session['chan_name'])



	if len(channels[session['chan_name']]["msg_lst"]) >= maximum:
		# del channels[session['chan_name']][0]
		deleted = channels[session['chan_name']]["msg_lst"].pop(0)
		print("this is deleted: ", deleted)
		emit("delete msg", deleted['id'],
			broadcast=True)

		#each message has an id
		#this id increments on python and is sent with the msg
		#python emits a command to delete id with number incremenetr minus maximum

		
	channels[session['chan_name']]["msg_lst"].append(new_msg)

	emit("broadcast message", new_msg,
		broadcast=True)

'''
Updates the channel list and dict on the server side with
the new channel and sends the new channel name to all clients
ready to be appended to the DOM by client side JS.
'''
@socketio.on("send create")
def create_channel(data):
	chanName = data['chanName']
	channels.update({ chanName:
								{
								"msg_count": 0,
								"msg_lst": []
								}
					})
								
	print("channels:", channels)

	emit("create channel", chanName,
		broadcast=True)

'''
Deletes the stored channel name from session enabling the user to
return to the home page without being redirected.
'''
@app.route("/back")
def back():
	if "chan_name" in session:
		del session["chan_name"]
	return redirect(url_for('index'))

	



#