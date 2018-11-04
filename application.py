import os

from flask import Flask, render_template, request, session
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

@app.route("/")
def index():
	return render_template("index.html", messages=messages, channels=channel_names)
 

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
@app.route("/<string:chan>", methods=["GET", "POST"])
def channel_selection(chan):
	print("doing stuff")
	print("annoying")
	# chan_name = request.form.get("clicked")
	if chan not in channels:
		return render_template("error")
	session["chan_name"] = chan
	# session["chan_name"] = chan_namea
	#print(chan_name)
	
	return render_template("channel_template.html", 
		messages=channels[chan], 
		channels=channel_names,
		current=chan)   

# @socketio.on("clicked channel")
# def clicked_channel(data):
# 	global chan_name
# 	chan_name = data["chan_name"]


@socketio.on("send message")
def upload_msg(data):
	# message = f"{
	#				chanName:
	#						{
	#							session['name']: data['message']
	#						}
	#			  }"
	message = f"{session['name']}: {data['message']}"
	channels[session['chan_name']].append(message)
	messages.append(message)
	emit("broadcast message", message,
		broadcast=True)

# @socketio.on("send create")
# def upload_msg(data):
# 	chanName = data['chanName']
# 	channels.append(chanName)
# 	emit("create channel", chanName,
# 		broadcast=True)

@socketio.on("send create")
def create_channel(data):
	chanName = data['chanName']
	channel_names.append(chanName)
	channels.update({ chanName:[] })
	emit("create channel", chanName,
		broadcast=True)

	



#