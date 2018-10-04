const fs = require('fs');

function getTime() {
    var date = new Date();
    var hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;
    var min  = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;
    var sec  = date.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;
    return hour + ":" + min + ":" + sec;
}


function clearLog(){
	fs.writeFile('log.txt',"", (err) => {
		if (err) throw err;
	});
}
function log(obj){
	var timestamp = getTime();
	obj = timestamp+" [info]: "+obj;
	fs.appendFile('log.txt', obj+"\r\n", function (err) {
	  if (err) throw err;
	});
}

function test() {
	console.log('This was a test');
}

function searchArray(obj, arrayVar){
	var inside = false;
	var ind = -1;
	arrayVar.forEach((incObj, index) => {
	  if(obj === incObj){
		inside = true;
		ind = index;
	  }
	});
	return {contains: inside, index: ind};
}

function getChannelSettings(obj, channelName){
	var channel = new Object();
	//console.log("Channel actual name is: "+channelName);
	arrayVar = obj.channels;
	arrayVar.forEach((incObj, index) => {
		//console.log("Settings channel name is: "+incObj.name);
		if(channelName === incObj.name)
		{
			channel = incObj;
		}
	});
	return channel;
}

function getCommandSettings(obj, commandName){
	var command = new Object();
	//console.log("Command actual name is: "+commandName);
	arrayVar = obj.commands;
	if(typeof arrayVar != "undefined"){
	arrayVar.forEach((incObj, index) => {
		//console.log("Settings command name is: "+incObj.trigger);
		if(commandName === incObj.trigger)
		{
			command = incObj;
			command.matched = true;
		}
	});
	} else command.matched = false;
	return command;
}

function initCooldowns(obj, commands){
	
	commands.forEach((incObj, index) => {
		if(typeof incObj.cooldown === "number")
		{
			if (typeof obj[incObj.trigger] == 'undefined') {
				obj[incObj.trigger] = new Date();
				console.log('cooldown for trigger: '+ incObj.trigger +" created for "+obj[incObj.trigger]);
			}
		}
	});
	
	return obj;
}

function parse(message){
	var commands = message.split(" ");
	var arguments = commands.splice(1);
	return {command: commands[0], success: true, argument: arguments, msg: message};
}

var timerIds = [];

function manageTimers(func, arg, time, id) {
	
	if(searchArray(id, timerIds).contains)
	{
		clearTimeout(id);
		return;
	}
	
	var timerId = setTimeout(func, 1500, arg);
	timerIds.push(timerId);
	return timerId;
}

function spongeMock(input) {
	var output = "";
	for (var i = 0; i < input.length; i++) {
		var c = ""+input.charAt(i);
		output = output+(Math.random() < 0.35 ? c.toLowerCase() : c.toUpperCase());
	}
	return output;
}

function replaceStringContents(obj){
	var s = "";
	//console.log("message is: "+ (obj.message ? true : false) +" replace array is: "+(obj.replaceArray ? true : false)+" chatInfo is: "+(obj.chatInfo ? true : false));
	if(obj.message && obj.replaceArray && obj.chatInfo)
	{
		s = obj.message;
		obj.replaceArray.forEach((incObj, index) => {
			var replaceValue = "";
			switch(incObj) {
				case "$username": 
					replaceValue = obj.chatInfo.user['display-name']; 
					break;
				case "$channelname": 
					replaceValue = obj.chatInfo.channel; 
					break;
				default: 
					break;
			}
			s.replace("$username", "jerxhabdun");
		});
	}
	return s;
}

function getRandomSub(inputFile) {
	// this function opens the subscriber file (inputFile) and returns
	// a random subscriber from within that file. This is delivered asyncrhonously
	// by way of a promise, so make sure to use .then().
	return new Promise(resolve => {
		var parse = require('csv-parse');
		var fs = require('fs');
		const output = []
		fs.createReadStream(inputFile)
		.pipe(parse({delimiter: ','}))
		.on('data', function(csvrow) {
			output.push(csvrow);        
		})
		.on('end',function() {
			let min = 1;
			let max = output.length - 1;
			let rand = Math.floor((Math.random() * max) + min);
			console.log("Random: " + rand);
			
			let winner = output[rand][0];
			console.log("Winner: " + winner);
			resolve(winner);
		});
		
	});
}

module.exports.test = test;
module.exports.manageTimers = manageTimers;
module.exports.searchArray = searchArray;
module.exports.parse = parse;
module.exports.getChannelSettings = getChannelSettings;
module.exports.getCommandSettings = getCommandSettings;
module.exports.spongeMock = spongeMock;
module.exports.clearLog = clearLog;
module.exports.log = log;
module.exports.initCooldowns = initCooldowns;
module.exports.replaceStringContents = replaceStringContents;
module.exports.getRandomSub = getRandomSub;
