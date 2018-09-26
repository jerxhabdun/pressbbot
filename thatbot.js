"use strict";
var tmi = require('tmi.js');
var jerx = require('./functions/functions.js');
const login = require('./login');
const Poll = require('./functions/poll.js');

// Set the error reporting level.
// 0 = no errors reported
// 1 = simple error messages reported
// 2 = full stack traces reported
const debugLevel = 1;

//This is a static load. Can update later to be asynch call so that channels can be added dynamically if needed
var channelsFile = require('./config/channels.json');
var admins = require('./config/admins.json');
var settingsJSON = require('./config/commandSettings.json');

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
		console.log('Color not changed');
	}


Cooldowns = jerx.initCooldowns(Cooldowns, settingsJSON.channels[1].commands);

// Set up a Poll class so this channel can run polls
var poll = new Poll();

// vvvv Attempting to create a channel named object in memory upon joining a channel and store cooldowns on it vvvv
// tried upper and lowercase, tried multiple variable switches as the channelName variable alone was not giving the desired results and or was getting lost

/* elvis

client.on("join", function (channel, username, self) {

	var channelName = channel.replace("#", "");
	var channelObj = channelName;
	console.log(channelObj);
	var channelObj = new Object();
		channelObj.name = channelName;
	console.log(channelObj);

if (typeof channelObj.discord == 'undefined') {
	channelObj.discord = new Date();
	console.log('Discord cmd cooldown: ' + channelObj.discord);
}

if (typeof channelObj.hype == 'undefined') {
		channelObj.hype = new Date();
		console.log('Hype cmd cooldown: ' + channelObj.hype);
}

if (typeof channelObj.insta == 'undefined') {
		channelObj.insta = new Date();
		console.log('Insta cmd cooldown: ' + channelObj.insta);
}

if (typeof channelObj.lurk == 'undefined') {
		channelObj.lurk = new Date();
		console.log('Lurk cmd cooldown: ' + channelObj.lurk);
}

if (typeof channelObj.prime == 'undefined') {
		channelObj.prime = new Date();
		console.log('Prime cmd cooldown: ' + channelObj.prime);
}

if (typeof channelObj.raid == 'undefined') {
		channelObj.raid = new Date();
		console.log('Raid cmd cooldown: ' + channelObj.raid);
}

if (typeof channelObj.so == 'undefined') {
		channelObj.so = new Date();
		console.log('SO cmd cooldown: ' + channelObj.so);
}

if (typeof channelObj.multi == 'undefined') {
	channelObj.multi = new Date();
	console.log('Multi cmd cooldown: ' + channelObj.multi);
}

}); 

*/

// ^^^^ Attempting to create a channel named object in memory upon joining a channel and store cooldowns on it ^^^^

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
				
				// this is part of the attempt to implement channel named objects in memory elvis
				// for some reason the channel name variable doesn't seem to be transferring into the switch case, tested with discord command but since reverted
				
				/* 
				var channelName = channel.replace("#", "");
				var channelObj = channelName; 
				*/
				
				switch (parsed.command) {
					case "!raid":
						try {
							if(!command.modOnly || (command.modOnly && checkMod(user, channel))) {
								if (subSeconds(command.cooldown) >= Cooldowns[parsed.command]) {
									client.say(channel, command.message);
								Cooldowns[parsed.command] = new Date();
								} else {
									console.log("Raid cooldown not up");
								}
							}
						} catch (err) {
							const e = debugLevel === 1 ? console.log("Error: " + err.message) : debugLevel === 2 ? console.log("Error: " + err.stack) : null; 
						}
						break;
					case "!prime":
						try {
							if(!command.modOnly || (command.modOnly && checkMod(user, channel))) {
								if (subSeconds(command.cooldown) >= Cooldowns[parsed.command]) {
									client.say(channel, command.message.replace("$username", user['display-name']));
									Cooldowns[parsed.command] = new Date();
								} else {
									console.log("Prime cooldown not up");
								}
							}
						} catch (err) {
							const e = debugLevel === 1 ? console.log("Error: " + err.message) : debugLevel === 2 ? console.log("Error: " + err.stack) : null; 
						}
						break;
					case "!lurk":
						try {
							if(!command.modOnly || (command.modOnly && checkMod(user, channel))) {
								if (subSeconds(command.cooldown) >= Cooldowns[parsed.command]) {
									client.say(channel, command.message.replace("$username", user['display-name']));
									Cooldowns[parsed.command] = new Date();
								} else {
									console.log("Lurk cooldown not up");
								}
							}
						} catch (err) {
							const e = debugLevel === 1 ? console.log("Error: " + err.message) : debugLevel === 2 ? console.log("Error: " + err.stack) : null; 
						}
						break;
					case "!insta":
						if(!command.modOnly || (command.modOnly && checkMod(user, channel))) {
							if (subSeconds(command.cooldown) >= Cooldowns[parsed.command]) {
								client.say(channel, command.message.replace("$username", user['display-name']));
								Cooldowns[parsed.command] = new Date();
							} else {
								console.log("Insta cooldown not up");
							}
						}
						break;
					case "!hype":
						try {
							if(!command.modOnly || (command.modOnly && checkMod(user, channel))) {
								if (subSeconds(command.cooldown) >= Cooldowns[parsed.command]) {
									client.say(channel, command.message);
									Cooldowns[parsed.command] = new Date();
								} else {
									console.log("Hype cooldown not up");
								}
							}
						} catch (err) {
							const e = debugLevel === 1 ? console.log("Error: " + err.message) : debugLevel === 2 ? console.log("Error: " + err.stack) : null; 
						}
						break;
					case "!discord": // discord command ?
						try {
							if(!command.modOnly || (command.modOnly && checkMod(user, channel))) {
								if (subSeconds(command.cooldown) >= Cooldowns[parsed.command]) { // check the discord cooldown vs adjusted current time
									client.say(channel, command.message.replace("$username", user['display-name']));
									Cooldowns[parsed.command] = new Date(); // the discord cooldown is refreshed with the current Date()
								} else {
									console.log("Discord cooldown not up: " + Cooldowns[parsed.command]); // otherwise we get a console log that the cooldown isn't up
								}
							}
						} catch (err) {
							const e = debugLevel === 1 ? console.log("Error: " + err.message) : debugLevel === 2 ? console.log("Error: " + err.stack) : null; 
						}
						break;
					case "!skynet":
						try {
							client.say(channel, "I'm sorry, I certainly don't know what you're talking about...");	
						} catch (err) {
							const e = debugLevel === 1 ? console.log("Error: " + err.message) : debugLevel === 2 ? console.log("Error: " + err.stack) : null; 
						}
						break;
					case "!so":
						try {
							if (checkMod(user, channel)) {
								if (subSeconds(command.cooldown) >= Cooldowns[parsed.command]) {
									if (parsed.argument.length > 1) {
										var soText = command.leadText;
										for (let word in parsed.argument) {
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
						} catch (err) {
							const e = debugLevel === 1 ? console.log("Error: " + err.message) : debugLevel === 2 ? console.log("Error: " + err.stack) : null; 
						}
						break;
					case "!multi":
						try {
							if (checkMod(user, channel)) {
								if (subSeconds(command.cooldown) >= Cooldowns[parsed.command]) {
									var multiText = command.leadText + " " + command.multiProvider + channel.slice(1) + "/";
									for (let word in parsed.argument) {
										multiText += parsed.argument[word] + "/"
									}
									multiText += "layout4";
									client.say(channel, multiText);
									Cooldowns[parsed.command] = new Date();
								}
							}
						} catch (err) {
							const e = debugLevel === 1 ? console.log("Error: " + err.message) : debugLevel === 2 ? console.log("Error: " + err.stack) : null; 
						}
						break;
					case "!poll":
						try {
							if(!command.modOnly || (command.modOnly && checkMod(user, channel))) {
								//console.log(typeof poll);
								if (poll.isActive()) {
									if (parsed.argument == "stop") {
										poll.stop();
									} else {
										poll.registerVote(parsed.argument, user.username);
									}
								} else {
									//console.log(parsed.message);
									let question = parsed.msg.split("?")[0] + "?";
									question = question.substring(5);
									let answers = parsed.msg.split("?")[1];
									answers = answers.split("/");
									for (let a in answers) {
										answers[a] = answers[a].trim();
									}
									poll = new Poll(question, answers, command.pollLength, command.minPercent, command.maxPercent, 0, client, channel);
									if (poll.start()) {
										client.say(channel, poll.getString("poll_started"));
										poll.report(client, channel);
									} else {
										client.say(channel, poll.getString("poll_not_started"));
									}
								}
							}
						} catch (err) {
							const e = debugLevel === 1 ? console.log("Error: " + err.message) : debugLevel === 2 ? console.log("Error: " + err.stack) : null; 
						}
						break;
					case "!vote":
						if (poll.isActive()) {
							poll.registerVote(parsed.argument, user.username);
						} else {
							client.say(channel, "No poll is currently running.");
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