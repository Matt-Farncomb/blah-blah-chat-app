import os
import math

from flask import Flask, render_template, request, session, redirect, url_for, jsonify
from flask_session import Session
from flask_socketio import SocketIO, emit
from jinja2 import Environment, PackageLoader
from flask import g
import sqlite3

from sqlalchemy import create_engine
from sqlalchemy.orm import scoped_session, sessionmaker
from sqlalchemy import exc

app = Flask(__name__)

## SQLITE
## note - 4 slashes needed for linux for some reason
app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{os.getcwd()}/user_info.db"

socketio = SocketIO(app)

#Configure session to use filesystem
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"

#enable jinja extension 'break' - app is the jina env
app.jinja_env.add_extension('jinja2.ext.loopcontrols')

Session(app)


engine = create_engine(app.config["SQLALCHEMY_DATABASE_URI"])

db = scoped_session(sessionmaker(bind=engine))

currently_online = []

svr_reset = True

def create_tables():
	# for testing purposes:
	# db.execute('''DROP TABLE if exists blah_users''' )
	# db.execute('''DROP TABLE if exists channels''' )
	# db.execute('''DROP TABLE if exists membership''' )
	# db.execute('''DROP TABLE if exists messages''' )

	# inititate tables
	db.execute('''CREATE TABLE if not exists blah_users
		(id INTEGER PRIMARY KEY AUTOINCREMENT,
		user_name TEXT NULL,
		password TEXT NULL)''')

	db.execute('''CREATE TABLE if not exists channels
		(id INTEGER PRIMARY KEY AUTOINCREMENT,
		channel_name TEXT NULL,
		private INTEGER NULL)''')

	db.execute('''CREATE TABLE if not exists membership
		(id INTEGER PRIMARY KEY AUTOINCREMENT,
		user_id INTEGER NULL,
		channel_id INTEGER NULL)''')

	db.execute('''CREATE TABLE if not exists messages
		(id INTEGER PRIMARY KEY AUTOINCREMENT,
		channel_id INTEGER NULL,
		name TEXT NULL,
		message TEXT NULL)''')

	# initiate dummy values in each row...
	# a hack to avoid None type errors on DB start up
	db.execute('''INSERT INTO  blah_users (user_name, password)
		VALUES (:user_name, :password)''', {	
			"user_name":"Mudd",
			"password":"1234"
		})

	db.execute('''INSERT INTO  channels (channel_name, private)
		VALUES (:channel_name, :private)''', {
			"channel_name":"Channel-One",
			"private":1
		})

	db.execute('''INSERT INTO  membership (user_id, channel_id)
		VALUES (:user_id, :channel_id)''', {
			"user_id":1,
			"channel_id":1
		})
	db.commit()

create_tables()

channels = {
	"home": {
		"chan_id":0,
		"private": {"private":False, "members":[] },
		"msg_count":0,
		"msg_list":[],
		"current_users":[]},
	"Welcome": {
		"chan_id":9999, # is 999 so will not intefere with app
		"private": {"private":False, "members":[] },
		"msg_count":0,
		"msg_list":["Please select a channel on the left"],
		"current_users":[]},
	}
	#'select' is a channel whose only purpose is to display...
	# "please select a channel" when user loads up for the first time


# stores users names and their current channels
current_users = {}

# max messages shown to user
maximum = 10

channel_names = db.execute('''
	SELECT * FROM channels
	''').fetchall()

p_channels = db.execute('''SELECT channel_name, user_name, private 
	FROM channels
	INNER JOIN membership ON channels.id = membership.channel_id
	INNER JOIN blah_users ON membership.user_id = blah_users.id
	WHERE private = 1
	ORDER BY channel_name
	''').fetchall()

p_dict = {}
# Set [] as default value of p_dict[channel_name] and append members to that list
for row in p_channels:
	p_dict.setdefault(row.channel_name, []).append(row.user_name)

messages = db.execute('''
	SELECT * FROM messages
	ORDER BY id DESC
	LIMIT :maximum''',
	{"maximum":maximum}
	).fetchall()

#The below needs to only check in the members idict if it is private, not always
for row in channel_names:
	channels.update({
		row.channel_name: {
			"chan_id":row.id,
			"private":{
				"private":row.private, 
				"members":p_dict.setdefault(row.channel_name, []) 
				},
			"msg_count":0,
			"msg_list":[],
			"current_users":[]
			}
		})	

x = len(messages)

for i in range(x):
	for k,v in channels.items():
		if v["chan_id"] == messages[-1-i].channel_id:
			channels[k]["msg_list"].append(messages[-1-i])

@app.route("/")
def welcome():
	# session.clear()
	first_visit = True
	global svr_reset
	svr_reset = False
	# if any user has visited site before, welcome them
	if "name" in session:
		message = f"Welcome back, {session['name']}"
		first_visit = False
		# if user had visited a channel, load last channel they visited
		if "chan_name" in session:
			last_visited = session["chan_name"]
		# else load up 'home'
		else:
			last_visited = "Welcome"
	else:
		message = f"Welcome to Blah-Blah! Sign-In!"
		last_visited = "Welcome"

	return render_template("index.html", 
		message=message, 
		first_visit=first_visit, 
		last_visited=last_visited)


'''
Enable users to login. Logged in names are stored in session 
so that when a user posts a message, said message is labelled
with their name.
'''
@app.route("/", methods=["POST"])
def login():
 	user_name = request.form.get("name")

 	usr_name = db.execute('''SELECT user_name 
 		FROM blah_users 
 		WHERE user_name = :user_name''',
 		{"user_name":user_name}).fetchone()
 	# save users name in DB
 	# TODO: Will add in a password check later
 	if usr_name == None:
 		db.execute('''INSERT INTO blah_users (user_name)
	 		VALUES (:user_name) ''',
	 		{"user_name": user_name})
 		db.commit()

 	session["name"] = user_name
 	current_users.update({user_name:"home"})

 	return redirect(url_for("channel_selection", chan="Welcome"))


@app.route("/logout", methods=["GET"])
def logout():
 	session.clear()
 	return redirect(url_for('welcome'))


'''
Variable chan is stored in sessions so when a user 
revisits the site, they are automatically redirected from the main
page to 'chan' which is the channel they were last using.
'''

@app.route("/channels/<string:chan>", methods=["GET"])
def channel_selection(chan):
	# If channel in URL exists return it's template.

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
		
		privCount = 0
		chanCount = 0
		my_private_channels = []

		# if current channel is private, increase count... 
		# then add to list to append later
		for key,value in channels.items():
			for k,v in value.items():
				if k == "private":
					if v["private"] == True:
						if session["name"] in v["members"]:
							privCount += 1
							my_private_channels.append(key)
					else:
						chanCount += 1

		#to ensure there are at least 4 nav bts
		if privCount < 20:
			privCount = 20
		if chanCount < 20:
			chanCount = 20

		chanCounts = {
			"privCount": math.ceil(privCount/5), 
			"chanCount": math.ceil(chanCount/5)
			}	
		current_privacy = False

		if chan in my_private_channels:
			current_privacy = True
		messages = []
		current = {"chan_name":chan, "private":current_privacy }
		if chan == "Welcome":
			messages.append({
				"message":"Select a channel on the left", 
				"id":9999, "name":"Blah-Blah"
				})
		else:
			messages = channels[chan]["msg_list"]
		
		return render_template("channel.html", 
			messages=messages, 
			channels=channels,
			my_private_channels=my_private_channels,
			current=current,
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
Upload msg to client and delete any old msg 
from the DOM over maximum allowed
'''
@socketio.on("send message")
def upload_msg(data):

	new_msg = new_message(data)
	
	if len(channels[session['chan_name']]["msg_list"]) >= maximum:
		deleted = channels[session['chan_name']]["msg_list"].pop(0)
		emit("delete msg", deleted['id'],
			broadcast=True)

	#each message has an id
	#this id increments on python and is sent with the msg
	#python emits a command to delete id with number increments minus maximum
	if session['chan_name'] == "Welcome":
		return
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
	emit("create channel", {
				"name":chanName, 
				"private":data['private']
				},
		broadcast=True)

'''Creates a new channel dict and adds it to the DB'''
def new_channel(name, private):
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
		"private":{
				"private":private, 
				"members":[session["name"]]
				},
		"msg_count":0,
		"msg_list":[],
		"current_users":[]
		}
	}

	channels.update(new_channel)

	if private == True:
		update_private({
			"command":"add", 
			"friend": session["name"]
			}, name)

	return new_channel

'''Create new msg and upload it to the DB'''
def new_message(data):
	channels[session['chan_name']]["msg_count"] += 1
	count = channels[session['chan_name']]["msg_count"]

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

'''
Check to see if request channel or user name exists.
If it does, tell the client to swap current usr to...
the necessary channel.
'''
@socketio.on("check")
def check_channels(target):
	if target in channels:
		emit("swap channel", target, 
			broadcast=False)
	elif target in current_users:
		new_value = current_users[target]
		emit("swap channel", new_value, 
			broadcast=False)
	else:
		pass

'''
Update the 'online' column with the correct users 
and their current channels.
'''
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

'''Send back name of client currently online'''
@socketio.on("update online")
def update_online():
	emit("append online", session["name"],
		broadcast=True)

'''
Update session dict to show new channel user is in
This would be the channel's window they have clicked on
'''
@socketio.on("swap channel")
def swap_channel(focus):
	session["chan_name"] = focus[9:]

'''
Update session dict to show the user is in 'home'.
'''
@socketio.on("home focus")
def home_focus():
	session["chan_name"] = "home"

'''Create excpetion for jinja template'''
def raise_helper(var1, var2):
    raise Exception(
    	f'''length of 'arg': {var1} is {var2} but should be exactly 4 characters.
    	 ''') 

#global to raise exception with jinja
app.jinja_env.globals['raise'] = raise_helper


'''
Adds friend user to db so they can access the private channel
'''
@socketio.on("update private")
def update_private(*args):

	if len(args) > 1:
		priv_chan_name = args[1]
	else:
		priv_chan_name = session["chan_name"]

	friend = db.execute('''SELECT id FROM blah_users
		WHERE user_name = :user_name''',
		{"user_name":args[0]["friend"]}).fetchone()
	f_id = friend.id
	if args[0]["command"] == "add":
		db.execute('''INSERT INTO membership (user_id, channel_id) 
			VALUES (:user_id, :channel_id)''',
			{"user_id":f_id, 
			"channel_id":channels[priv_chan_name]["chan_id"]})

		channels[session["chan_name"]]["private"]["members"].append(args[0]["friend"])
	else:
		db.execute('''DELETE FROM membership
		 WHERE user_id = :user_id 
		 and channel_id = :channel_id''',
		 {"user_id":f_id, 
		"channel_id":channels[priv_chan_name]["chan_id"]})

		channels[priv_chan_name]["private"]["members"].remove(args[0]["friend"])
	db.commit()