function test() {
	console.log('This was a test');
}

function searchArray(obj, arrayVar){
	var inside = false;
	arrayVar.forEach((incObj, index) => {
	  if(obj === incObj)
		  inside = true;
	});
	return inside;
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
	console.log("Channel actual name is: "+commandName);
	arrayVar = obj.commands;
	arrayVar.forEach((incObj, index) => {
		console.log("Settings channel name is: "+incObj.trigger);
		if(commandName === incObj.trigger)
		{
			command = incObj;
		}
	});
	return command;
}

function parse(message){
	if(message.charAt(0) !== '!'){
		message = "!"+message
	}
	var commands = message.split(" ");
	var arguments = commands.splice(1);
	return {command: commands[0], success: true, argument: arguments};
}

var timerIds = [];

function manageTimers(func, arg, time, id) {
	
	if(searchArray(id, timerIds))
	{
		clearTimeout(id);
		return;
	}
	
	var timerId = setTimeout(func, 1500, arg);
	timerIds.push(timerId);
	return timerId;
}

module.exports.test = test;
module.exports.manageTimers = manageTimers;
module.exports.searchArray = searchArray;
module.exports.parse = parse;
module.exports.getChannelSettings = getChannelSettings;
module.exports.getCommandSettings = getCommandSettings;