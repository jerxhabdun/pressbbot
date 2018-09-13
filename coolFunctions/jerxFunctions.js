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

function parse(message){
	if(message.charAt(0) !== '!'){
		return {success: false};
	}
	else
	{
		var commands = message.split(" ");
		return {command: commands[0], success: true, argument: commands[1]};
	}
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