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
const discordCD = 15;
const hypeCD = 5;
const instaCD = 15;
const lurkCD = 5;
const primeCD = 30;
const raidCD = 5;
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


Cooldowns = jerx.initCooldowns(Cooldowns, settingsJSON.channels[1].commands);
/*
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
*/
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
			var replaceObj = {};
			var replaced = "";
			if(typeof command.replaceStrings !== "undefined") {
				replaceObj = {
					message : command.message,
					replaceArray : command.replaceStrings,
					chatInfo: {
						user: user,
						channel: channel
					}
				};
				jerx.log(command.message);
				replaced = jerx.replaceStringContents(replaceObj);
				jerx.log(replaced);
			}
			
			if(command.matched) {
				switch (parsed.command) {
					case "!raid":
						if (subSeconds(raidCD) >= Cooldowns[parsed.command]) {
							client.say(channel, "twitchRaid TombRaid twitchRaid TombRaid twitchRaid TombRaid twitchRaid TombRaid twitchRaid");
						Cooldowns[parsed.command] = new Date();
						} else {
							console.log("Raid cooldown not up");
						}
						break;
					case "!prime":
						if (subSeconds(primeCD) >= Cooldowns[parsed.command]) {
							client.say(channel, "@" + user['display-name'] + " How to link your Twitch and Amazon Prime: https://help.twitch.tv/customer/portal/articles/2574978-how-to-link-your-amazon-account You can use your free prime sub to get a *sweet* savage emote! It's a great way to directly support Elvis!");
							Cooldowns[parsed.command] = new Date();
						} else {
							console.log("Prime cooldown not up");
						}
						break;
					case "!lurk":
						if (subSeconds(lurkCD) >= Cooldowns[parsed.command]) {
							client.action(channel, "shows @" + user['display-name'] + " to a comfortable seat in the lurker section.");
							Cooldowns[parsed.command] = new Date();
						} else {
							console.log("Lurk cooldown not up");
						}
						break;
					case "!insta":
						if (subSeconds(instaCD) >= Cooldowns[parsed.command]) {
							client.say(channel, "@" + user['display-name'] + " , check out Elvis' weird pictures here! https://www.instagram.com/elvispressb/");
							Cooldowns[parsed.command] = new Date();
						} else {
							console.log("Insta cooldown not up");
						}
						break;
					case "!hype":
						if (subSeconds(hypeCD) >= Cooldowns[parsed.command]) {
							client.say(channel, "Squid1 Squid2 Squid2 Squid3 Squid2 Squid2 Squid4");
							Cooldowns[parsed.command] = new Date();
						} else {
							console.log("Hype cooldown not up");
						}
						break;
					case "!discord": // discord command ?
						if(!command.modOnly || (command.modOnly && checkMod(user, channel))) {
							if (subSeconds(command.cooldown) >= Cooldowns[parsed.command]) { // check the discord cooldown vs adjusted current time
								client.say(channel, command.message.replace("$username", user['display-name']));
								Cooldowns[parsed.command] = new Date(); // the discord cooldown is refreshed with the current Date()
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
							if (subSeconds(soCD) >= Cooldowns[parsed.command]) {
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
									soText = soText.replace(command.replaceStrings, command.plural);
									client.say(channel, soText);
								} else {
									var soText = command.leadText + " http://twitch.tv/" + parsed.argument + " " + command.followText;
									soText = soText.replace(command.replaceStrings, command.singular);
									client.say(channel, soText);
								}
								Cooldowns[parsed.command] = new Date();
							} else {
								console.log("Shoutout cooldown not up");
							}
						}
						break;
					case "!multi":
						if (checkMod(user, channel)) {
<<<<<<< HEAD
							if (subSeconds(multiCD) >= Cooldowns[parsed.command]) {
								var multiText = "Watch us all at once! Visit http://multistre.am/ElvisPressB/";
=======
							if (subSeconds(multiCD) >= Cooldowns.multi) {
								var multiText = command.leadText + " " + command.multiProvider + channel.slice(1) + "/";
>>>>>>> 30dce11e57d5c11571f07361e89bb34aef00e0bc
								for (word in parsed.argument) {
									multiText += parsed.argument[word] + "/"
								}
								multiText += "layout4";
								client.say(channel, multiText);
								Cooldowns[parsed.command] = new Date();
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