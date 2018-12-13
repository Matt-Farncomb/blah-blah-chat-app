import os
import math

from flask import Flask, render_template, request, session, redirect, url_for, jsonify
from flask_session import Session
from flask_socketio import SocketIO, emit
from jinja2 import Environment, PackageLoader
from flask import g

from sqlalchemy import create_engine
from sqlalchemy.orm import scoped_session, sessionmaker
from sqlalchemy import exc

app = Flask(__name__)

# Check for environment variable
if not os.getenv("DATABASE_URL"):
    raise RuntimeError("DATABASE_URL is not set")

app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)

#Configure session to use filesystem
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"

#enable jinja extension 'break' - app is the jina env
app.jinja_env.add_extension('jinja2.ext.loopcontrols')



Session(app)

engine = create_engine(os.getenv("DATABASE_URL"))
db = scoped_session(sessionmaker(bind=engine))


svr_reset = True

#TODO:
# A fucntion when the user can request to see older msgs
# eg befoer server reset or before maximum reached
# This will only be displayed for the current user, not any other user
# Other users will just get the normal display
# Aslo, user can search through messages in DB for things that were said
# Imagine making an api to look at stats of total words used... :)

#a dict to store key, value pairs of {channel string: messages list}
channels = {"home": {"chan_id":0,"private": {"private":False, "members":[] }, "msg_count":0, "msg_list":[], "current_users":[]} }

# stores users names and their current channels
current_users = {}

# max messages shown to user
maximum = 10

channel_names = db.execute('''
	SELECT * FROM channels
	''').fetchall()

# membership = db.execute('''
# 	SELECT * FROM membership
# 	''')

# DB.EXECUTE('''SELECT * FROM membership
# 	JOIN channels
# 	ON channel_id. 
# 	''')



#must also join to blah users to get user names
#so all three join
# - channel name, user_name:
	# I will then use this somehow after channles dict is created: if row.private.private == True:
		#channels[row.channel_name]["private"]["members"].append(row.user_name)

# TODO:
# 1: Create The necessary tables
# 2: Test the join statement
# 3. The rest...

#GET
# SELECT * FROM channels
# JOIN membership
# ON channels.id = membership.channel_id


# p_channels = db.execute('''SELECT * FROM membership
# 							JOIN channels
# 							ON channels.user_id = membership.user_id''').fetchall()

#ii want it to look like:
	# - channel name, user_id

p_channels = db.execute('''SELECT channel_name, user_name, private 
	FROM channels
	INNER JOIN membership ON channels.id = membership.channel_id
	INNER JOIN blah_users ON membership.user_id = blah_users.id
	WHERE private = true
	ORDER BY channel_name
	''').fetchall()

p_dict = {}
# Set [] as default value of p_dict[channel_name] and append members to that list
for row in p_channels:
	p_dict.setdefault(row.channel_name, []).append(row.user_name)

print(f"p_dict: {p_dict}")




messages = db.execute('''
	SELECT * FROM messages
	ORDER BY id DESC
	LIMIT :maximum''',
	{"maximum":maximum}
	).fetchall()

#maybe add to channels["private"]
#{"private": True,
#"members": member_list}	
# print(messages)

for row in channel_names:
	channels.update({
		row.channel_name: {
			"chan_id":row.id,
			"private":{"private": row.private, "members":p_dict[row.channel_name] },
			"msg_count":0,
			"msg_list":[],
			"current_users":[]
			}
		})
	# if row.private.private == True:
	# 	channels[channel_name]["private"]["members"].append(row.user_name)

print(f"channel members: {channels}")		
# x = len(channel_names)
# for row in membership:
# 	temp_name = chann
# 	channels[channel_name]["private"]["members"].append(row.user_name)
# for i in range(x):
# 	channels.update({







# 		channel_names[x-i-1].channel_name: {
# 			"chan_id":channel_names[x-i-1].id,
# 			"msg_count":0,
# 			"msg_list":[]
# 			}
# 		})


# for row in messages:
# 	for k,v in channels.items():
# 		# print(f"row.channel_id: {row.channel_id}" )
# 		# print(f"v = {v}")
# 		if v["chan_id"] == row.channel_id:
# 			# print(f"row is {row.message}")
# 			channels[k]["msg_list"].append(row)

x = len(messages)

for i in range(x):
	for k,v in channels.items():
		# print(f"row.channel_id: {row.channel_id}" )
		# print(f"v = {v}")
		if v["chan_id"] == messages[-1-i].channel_id:
			# print(f"row is {row.message}")
			channels[k]["msg_list"].append(messages[-1-i])



# print(channels)


'''
Main page where users enter their name and create enw channelas.
If users are visiting the site after previously going into a 
particular channel, they are redirected from 'index' to the channel
they last visited. The redirect is stopped when user has either
not visited previously or are hitting the 'back' button on the'channels' 
 page as the 'chan-name' key will no longer be in sesson.
'''
# @app.route("/")
# def index():
# 	if "chan_name" not in session:
# 		return render_template("index.html", channels=channels)
# 	return redirect(url_for('channel_selection', chan=session["chan_name"]))

@app.route("/")
def welcome():
	# session.clear()
	first_visit = True
	global svr_reset
	svr_reset = False

	if "name" in session:
		message = f"Welcome back, {session['name']}"
		first_visit = False
		if "chan_name" in session:
			last_visited = session["chan_name"]
		else:
			last_visited = "home"
	else:
		message = f"Welcome to Blah-Blah! Sign-In!"
		last_visited = "home"
		# session.clear()



	return render_template("new_welcome.html", 
		message=message, 
		first_visit=first_visit, 
		last_visited=last_visited)
	# return redirect(url_for('channel_selection', chan=session["chan_name"]))


'''
Enable users to login. Logged in names are stored in session 
so that when a user posts a message, said message is labelled
witht their name.
'''
@app.route("/", methods=["POST"])
def login():
 	user_name = request.form.get("name")

 	usr_name = db.execute('''SELECT user_name 
 		FROM blah_users 
 		WHERE user_name = :user_name''',
 		{"user_name":user_name}).fetchone()

 	print(f"usr_name_row: {usr_name}")
 	
 	if usr_name == None:
 		db.execute('''INSERT INTO blah_users (user_name)
	 		VALUES (:user_name) ''',
	 		{"user_name": user_name})
 		db.commit()

 	

 	session["name"] = user_name
 	current_users.update({user_name:"home"})

 	

 		
 	# return render_template("/channels/home.html", channels=channels)
 	return redirect(url_for("channel_selection", chan="home", test="None"))
 	# return redirect(url_for('home'))


@app.route("/logout", methods=["GET"])
def logout():
 	session.clear()
 	return redirect(url_for('welcome'))



# @app.route("/home", methods=["GET"])
# def home():
# 	if "name" not in session:
# 		return render_template("welcome.html")
# 	session["chan_name"] = "home"
# 	return render_template("/channels/home.html", channels=channels)

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
# @socketio.on("swap channel")
@app.route("/channels/<string:chan>/<test>", methods=["GET"])
def channel_selection(chan, test="None"):
	# If channel in URL exists return it's template.
	print(f"Channel selection done on {chan}")

	global svr_reset
	if svr_reset == True:
		svr_reset = False
		return redirect(url_for('welcome'))

	if chan in channels:
		#remove user from previous channel list
		if "chan_name" in session:
			l = channels[session["chan_name"]]["current_users"]
			if session["name"] in l:
				l.remove(session["name"])


		session["chan_name"] = chan
		current_users.update({session["name"]:chan})

		#add user to new channel list
		channels[chan]["current_users"].append(session["name"])
		# print(f"ban is {ban}")

		# print("here: ", channels[chan]["msg_list"])
		# emit("user entered", "{"name":session["name"], "channel":chan}", 
		#  	broadcast=True)

		privCount = 0
		chanCount = 0
		my_private_channels = []

		# if current channel is private, increase count... 
		# then add to list to append later
		for key,value in channels.items():
			for k,v in value.items():
				if k == "private":
					print(f"k is private")
					if v["private"] == True:
						print(f"v is private")
						if session["name"] in v["members"]:
							privCount += 1
							my_private_channels.append(key)
					else:
						chanCount += 1
		print(f"my priv: {my_private_channels}")
		print(privCount)
		print(chanCount)
		#to ensure there are at least 4 nav bts
		if privCount < 20:
			privCount = 20
		if chanCount < 20:
			chanCount = 20

		chanCounts = {"privCount": math.ceil(privCount/5), "chanCount": math.ceil(chanCount/5)}
		


		return render_template("new_channel_template.html", 
			messages=channels[chan]["msg_list"], 
			channels=channels,
			my_private_channels=my_private_channels,
			current=chan,
			name=session["name"],
			home_chan=channels["home"]["msg_list"],
			chanCounts=chanCounts)

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

	new_msg = new_message(data)
	
				

	# new_msg = msg_obj(	id=count,
	# 					name=session['name'],
	# 					message=data['message'],
	# 					channel=session['chan_name'])



	if len(channels[session['chan_name']]["msg_list"]) >= maximum:
		# del channels[session['chan_name']][0]
		deleted = channels[session['chan_name']]["msg_list"].pop(0)
		print("this is deleted: ", deleted)
		emit("delete msg", deleted['id'],
			broadcast=True)

		#each message has an id
		#this id increments on python and is sent with the msg
		#python emits a command to delete id with number incremenetr minus maximum

		
	channels[session['chan_name']]["msg_list"].append(new_msg)

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
	private = data['private']
	new_channel(chanName, private)
	# channels.update({ chanName:
	# 							{
	# 							"msg_count": 0,
	# 							"msg_lst": []
	# 							}
	# 				})
								
	emit("create channel", {"name":chanName, "private":data['private']},
		broadcast=True)


'''
Deletes the stored channel name from session enabling the user to
return to the home page without being redirected.
'''

		

@app.route("/back")
def back():
	if "chan_name" in session:
		del session["chan_name"]
	return redirect(url_for('home'))

def new_channel(name, private):
	# new_channel = \
	# { name:
	# 	{
	# 	"msg_count":0,
	# 	"msg_list":[]
	# 	}
	# }
	# channels.update(new_channel)

	db.execute('''INSERT INTO channels (channel_name, private)
		VALUES (:channel_name, :private)''',
		 {
		 "channel_name": name,
		 "private":private
		 })

	

	db.commit()

	chan_id = db.execute('''SELECT id FROM channels
		WHERE channel_name = :name''',
		{"name":name}).fetchone()

	new_channel = \
	{ name:
		{
		"chan_id":chan_id.id,
		"private":{"private":private, "members":[session["name"]]},
		"msg_count":0,
		"msg_list":[],
		"current_users":[]
		}
	}

	# "private":{"private":private, "members":[]},

	print(f"new channe: {new_channel}")
	channels.update(new_channel)

	if private == True:
		update_private({"command":"add", "friend": session["name"]}, name)

	return new_channel

#TODO:
# Maybe experiment with making db queries in a different fucntion
# ... so it does not slow down real time messaging (if it even slows it down)

def new_message(data):
	channels[session['chan_name']]["msg_count"] += 1
	count = channels[session['chan_name']]["msg_count"]
	# message = f"{session['name']}: {data['message']}"

	new_message = \
		{
			"id":f"msg_{count}",
			"name": session['name'],
			"message":data['message'],
			"chan_id":channels[session['chan_name']]['chan_id'],
			"channel":session['chan_name']
		}

	db.execute('''INSERT INTO messages
		(name, message, channel_id)
		VALUES (:name, :message, :chan_id)''',
		{"name":new_message["name"],
		"message":new_message["message"],
		"chan_id":new_message["chan_id"]})
	db.commit()

	return new_message

@socketio.on("check")
def check_channels(target):
	print(f"current_users are {current_users}")
	if target in channels:
		emit("swap channel", target, 
			broadcast=False)
	elif target in current_users:
		print(f"{current_users} are current")
		new_value = current_users[target]
		emit("swap channel", new_value, 
			broadcast=False)
	else:
		print(f"{target} not found")

	# return	{
	# 			"id":f"msg_{count}",
	# 			"name": session['name'],
	# 			"message":data['message'],
	# 			"channel":session['chan_name']
	# 		}
# @socketio.on("swap channel")
# def swap_channel(channel):
# 	emit("swap_channel",{ 'url': url_for('channel_selection', chan=channel)})

	# return redirect(url_for('channel_selection', chan=value))

# emits are constantly sent to server
#these are checking what user is in what channel
# it retrievs session[channel] each time
# if session channel is equal to chnnel, append if not there

@socketio.on("which channel")
def send_users_channels():
	temp = {}
	# if session["name"] in current_users:
	if "name" in session:
		if session["name"] in current_users:
			temp = {"chan":current_users[session["name"]],
					"name":session["name"]
					}
			emit("update users", temp,
			broadcast=True)

@socketio.on("swap channel")
def swap_channel(focus):
	session["chan_name"] = focus[9:]
	print(focus[9:])

@socketio.on("home focus")
def home_focus():
	session["chan_name"] = "home"

def raise_helper(var1, var2):
    raise Exception(
    	f'''length of 'arg': {var1} is {var2} but should be exactly 4 characters.
    	 ''') 

#globasl to raise exception with jinja
app.jinja_env.globals['raise'] = raise_helper

#SQL
#Private channels memebrship has its own table, referecned by the nornal channels table
#	- It will have an id of the channel and channel name
#	- A members table will have each particular membership eg a persons id and the group they are in
# 	- users can appear multiple times in this table under their id

# sql command
# CREATE TABLE membership (
# 	id serial PRIMARY KEY,
# 	user_id INTEGER,
# 	channel_id INTEGER);

# CREATE TABLE blah_users (
# 	id serial PRIMARY KEY,
# 	user_name UNIQUE VARCHAR,
#	password VARCHAR



#Python
#WHen logging in, grab the user name and id
#store them both in a session

#The sql execute command is made
# on channel load, the request from thew table is made and put into a list
# when rendering to the DOM, the user name is compared against  that list
# - if the users name is in the list, then that provate channel is rendered

#maybe add to channels["private"]
#{"private": True,
#"members": member_list}

#JS
#On the DOM, there is some kind of plus button to add users
#this will send an emit to thee server which will update thge array and make the execute command



# @SocketIO.on("update private")
# update_private(friends)
#friends is a list from javascript of all epoople added including current user
#{"friends": [friends]}

'''
When called, adds a list of users to the private channels db (membership).
It finds their id by comparing thier names against the db.
Then adds that id to the db under the id of the new channel.

This channel should have been created already including its id so 
the channel id should be stored in session.

To de the below functipon (ie update private) the creatore must clcik on the neter
and thereby slet that channel and hence session id will be changed to that channel.

NEW IDEA:
	-	A code editor type of thing:
			- Its visual
			- One function will be linked to the other like a mind map
			- ITs a code map
			- At the top (or bottom) would be the main
				- Each other function would link off that
				- if a calls b and b calls c it would be a => b => c
				- if a calls ab and c it would be like a => b
													   a => c
			- Variables could do something similar
'''

'''
Adds friend user to adb so they can access the private channel
'''
@socketio.on("update private")
def update_private(*args):

	if len(args) > 1:
		priv_chan_name = args[1]
	else:
		priv_chan_name = session["chan_name"]

	emit("test msg", args[0],
			broadcast=True)

	friend = db.execute('''SELECT id FROM blah_users
		WHERE user_name = :user_name''',
		{"user_name":args[0]["friend"]}).fetchone()
	f_id = friend.id
	if args[0]["command"] == "add":
		print(f"Is this causing zero? f_id: {f_id}, channel_id: {channels[priv_chan_name]}")
		db.execute('''INSERT INTO membership (user_id, channel_id) 
			VALUES (:user_id, :channel_id)''',
			{"user_id":f_id, 
			"channel_id":channels[priv_chan_name]["chan_id"]})

		channels[session["chan_name"]]["private"]["members"].append(args[0]["friend"])
	else:
		print("Or this?")
		db.execute('''DELETE FROM membership
		 WHERE user_id = :user_id 
		 and channel_id = :channel_id''',
		 {"user_id":f_id, 
		"channel_id":channels[priv_chan_name]["chan_id"]})

		channels[priv_chan_name]["private"]["members"].remove(args[0]["friend"])
	db.commit()


# TODO:
# Now that the new members are added to private 
# successfully upon creating a new channel 
# and when actually added,
# I should ensure that only members can 
# access tose channels and have them appendedgit








