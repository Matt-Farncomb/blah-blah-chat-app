import os

from flask import Flask, render_template, request, session, redirect, url_for
from flask_session import Session
from flask_socketio import SocketIO, emit

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)

#Configure session to use filesystem
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

messages = []	
channels = {}
channel_names = []
# rooms = {}

# rooms = {
# 		   room1; [messages],
#		   room2: [messages]
#}

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
		return render_template("index.html", messages=messages, channels=channel_names)
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
 	return render_template("index.html", messages=messages, channels=channel_names)



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
When visiting /chan users are directed to the channel page of 
name 'chan'. Variable chan is stored in sessions so when a user 
revisits the site, they are automatically redirected from the main
page to 'chan' which is the channel they were last using.
'''
@app.route("/<string:chan>", methods=["GET", "POST"])
def channel_selection(chan):
	print("doing stuff")
	print("annoying")

	if chan not in channels:
		return render_template("error")
	session["chan_name"] = chan
	
	return render_template("channel_template.html", 
		messages=channels[chan], 
		channels=channel_names,
		current=chan)   


'''
Creates a key, value pair of message and sender. adds that to
the channels dict under the correct channle name key and then
broadcasts the messgae k, v pair to all clients ready to
be appended to DOM by js.
'''
@socketio.on("send message")
def upload_msg(data):
	message = f"{session['name']}: {data['message']}"
	channels[session['chan_name']].append(message)
	messages.append(message)
	emit("broadcast message", message,
		broadcast=True)

'''
Updates the channel list and dict on the server side with
the new channel and sends the new channel name to all clients
ready to be appended to the DOM by client side JS.
'''
@socketio.on("send create")
def create_channel(data):
	chanName = data['chanName']
	channel_names.append(chanName)
	channels.update({ chanName:[] })
	emit("create channel", chanName,
		broadcast=True)

'''
Deletes the stored channel name from session enabling the user to
return to the home page without being redirected.
'''
@app.route("/back")
def back():
	del session["chan_name"]
	return redirect(url_for('index'))

	



#