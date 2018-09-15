var tmi = require('tmi.js');
var jerx = require('./coolfunctions/jerxfunctions.js');
const login = require('./login');

//This is a static load. Can update later to be asynch call so that channels can be added dynamically if needed
var channelsFile = require('./channels.json');
var admins = require('./admins.json');
var settingsJSON = require('./commandSettings.json');

// TMI OPTIONS
var options = {
	options: {
		debug: true
	},
	connection: {
		cluster: "aws",
		reconnect: true
	},
	identity: {
		username: login.creds.user,
		password: login.creds.auth
	},
	channels: channelsFile
};
// END TMI OPTIONS

// set up, connect and console log client information
var client = new tmi.client(options);

client.connect();

client.on('connected', function(address, port) {
	jerx.clearLog();
	jerx.log("Address: " + address + " Port: " + port);
	//This is a test of the timer crap I'm working on
	//var id = jerx.manageTimers((function() { console.log('This is an iterative test'); }), null, null, null);
});
// end set up, connect and console log client information

// create various objects in memory
if (typeof Cooldowns !== 'object') { 
	var Cooldowns = new Object();
}
// end create various objects in memory

// various command cooldown variables
const soCD = 5;
const multiCD = 5;

function subSeconds(numSeconds) {
		var time = new Date();
		time.setSeconds(time.getSeconds() - numSeconds);
		return time;
	}

function checkMod(user, channel) {
	if (user["user-type"] === "mod" || user.username === channel.replace("#", "")) { 
		return true; 
	} else { 
		return false; 
	}
}

// create cooldowns in memory
if (typeof Cooldowns.color == 'undefined') {
		Cooldowns.color = 0;
		console.log('Color cooldown: ' + Cooldowns.color);
}

if (typeof Cooldowns.discord == 'undefined') {
		Cooldowns.discord = new Date();
		console.log('Discord cmd cooldown: ' + Cooldowns.discord);
}

if (typeof Cooldowns.hype == 'undefined') {
		Cooldowns.hype = new Date();
		console.log('Hype cmd cooldown: ' + Cooldowns.hype);
}

if (typeof Cooldowns.insta == 'undefined') {
		Cooldowns.insta = new Date();
		console.log('Insta cmd cooldown: ' + Cooldowns.insta);
}

if (typeof Cooldowns.lurk == 'undefined') {
		Cooldowns.lurk = new Date();
		console.log('Lurk cmd cooldown: ' + Cooldowns.lurk);
}

if (typeof Cooldowns.prime == 'undefined') {
		Cooldowns.prime = new Date();
		console.log('Prime cmd cooldown: ' + Cooldowns.prime);
}

if (typeof Cooldowns.raid == 'undefined') {
		Cooldowns.raid = new Date();
		console.log('Raid cmd cooldown: ' + Cooldowns.raid);
}

if (typeof Cooldowns.so == 'undefined') {
		Cooldowns.so = new Date();
		console.log('SO cmd cooldown: ' + Cooldowns.so);
}

if (typeof Cooldowns.multi == 'undefined') {
	Cooldowns.multi = new Date();
	console.log('Multi cmd cooldown: ' + Cooldowns.multi);
}
// end create cooldown Date()s in memory

client.on('chat', function(channel, user, message, self) {
	if(self) return;
	
	var settings = jerx.getChannelSettings(settingsJSON, channel);
	//console.log("The name of the settings is: "+settings.name+" and their preferred color is: "+settings.color);
	
	
	if (Cooldowns.color === 0) {
		client.color(typeof settings != "undefined" ? ( typeof settings.color == "string"? settings.color: "Red") : "Red");
		Cooldowns.color = 1;
	}

	if (message) {

		var parsed = jerx.parse(message);
		
		if (parsed.success) {
			var command = jerx.getCommandSettings(settings, parsed.command);
			//console.log("Command is: "+command.trigger+" cooldown is "+command.cooldown+" allowed is "+command.allowed+" modOnly is "+command.modOnly);
			//TODO: actually use the command object to drive the switch
			if(command.matched) {
				switch (parsed.command) {
					case "!raid":
						if(!command.modOnly || (command.modOnly && checkMod(user, channel))) {
							if (subSeconds(command.cooldown) >= Cooldowns.raid) {
								client.say(channel, command.message);
							Cooldowns.raid = new Date();
							} else {
								console.log("Raid cooldown not up");
							}
						}
						break;
					case "!prime":
						if(!command.modOnly || (command.modOnly && checkMod(user, channel))) {
							if (subSeconds(command.cooldown) >= Cooldowns.prime) {
								client.say(channel, command.message.replace("$username", user['display-name']));
								Cooldowns.prime = new Date();
							} else {
								console.log("Prime cooldown not up");
							}
						}
						break;
					case "!lurk":
						if(!command.modOnly || (command.modOnly && checkMod(user, channel))) {
							if (subSeconds(command.cooldown) >= Cooldowns.lurk) {
								client.say(channel, command.message.replace("$username", user['display-name']));
								Cooldowns.lurk = new Date();
							} else {
								console.log("Lurk cooldown not up");
							}
						}
						break;
					case "!insta":
						if(!command.modOnly || (command.modOnly && checkMod(user, channel))) {
							if (subSeconds(command.cooldown) >= Cooldowns.insta) {
								client.say(channel, command.message.replace("$username", user['display-name']));
								Cooldowns.insta = new Date();
							} else {
								console.log("Insta cooldown not up");
							}
						}
						break;
					case "!hype":
						if(!command.modOnly || (command.modOnly && checkMod(user, channel))) {
							if (subSeconds(command.cooldown) >= Cooldowns.hype) {
								client.say(channel, command.message);
								Cooldowns.hype = new Date();
							} else {
								console.log("Hype cooldown not up");
							}
						}
						break;
					case "!discord": // discord command ?
						if(!command.modOnly || (command.modOnly && checkMod(user, channel))) {
							if (subSeconds(command.cooldown) >= Cooldowns.discord) { // check the discord cooldown vs adjusted current time
								client.say(channel, command.message.replace("$username", user['display-name']));
								Cooldowns.discord = new Date(); // the discord cooldown is refreshed with the current Date()
							} else {
								console.log("Discord cooldown not up"); // otherwise we get a console log that the cooldown isn't up
							}
						}
						break;
					case "!skynet":
						client.say(channel, "I'm sorry, I certainly don't know what you're talking about...");
						break;
					case "!so":
						if (checkMod(user, channel)) {
							if (subSeconds(soCD) >= Cooldowns.so) {
								if (parsed.argument.length > 1) {
									var soText = command.leadText;
									for (word in parsed.argument) {
										if (word == parsed.argument.length-1) {
											soText += "http://twitch.tv/" + parsed.argument[word] + " ";
										} else {
											soText += "http://twitch.tv/" + parsed.argument[word] + " & ";
										}
									}
									soText += command.followText;
									client.say(channel, soText);
								} else {
									client.say(channel, command.leadText + " http://twitch.tv/" + parsed.argument + " " + command.followText);
								}
							} else {
								console.log("Shoutout cooldown not up");
							}
						}
						break;
					case "!multi":
						if (checkMod(user, channel)) {
							if (subSeconds(multiCD) >= Cooldowns.multi) {
								var multiText = command.leadText + " " + command.multiProvider + command.channelName + "/";
								for (word in parsed.argument) {
									multiText += parsed.argument[word] + "/"
								}
								multiText += "layout4";
								client.say(channel, multiText);
							}
						}
						break;
					default:
						client.say(channel, "Sorry @" + user['display-name'] + " , but I don't recognize that command, please type !commands for a list of recognized commands.");
				}
			}
		}
		jerx.log("Username is "+user.username)
		/*
		** This is a test of individual responses
		if(user.username == 'jerxhabdun')
		{
			client.say(channel, "^^ This guy knows what he's talking about");
		}
		else if(user.username == 'sergeantsmokie')
		{
			var mocked = jerx.spongeMock(message);
			jerx.log(mocked);
			client.say(channel, mocked);
		}
		*/
	}
});

client.on("whisper", function (from, userstate, message, self) {
    // Don't listen to my own messages..
    if (self) return;
	
	if(jerx.searchArray(from, admins)) {
		var parsed = jerx.parse(message);
		if(parsed.success){
			client.whisper(from, "Command accepted: "+parsed.command+" with arg "+parsed.argument);
		}
		else {
			client.whisper(from, "Error!");
		}
		return;
	}
});