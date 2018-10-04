/* Poll.js
   A Poll class for PressBBot, a Twitch.tv bot.

   Usage:
     !poll Question? Answer 1/Answer 2/Answer 3
       Question mark denotes end of question.
       Slashes denote separation of answers

     !poll stop
       Forces the vote to stop and immediately announce a winner

     !poll vote
     Alternative: !vote
       Accepts a vote, that must either match an answer's text exactly (case insensitive)
         or the number in which it appears (shown in the report)

   Configuration:
     Functional changes can be made in commandSettings.json to change duration of polls, thresholds, etc.
     Changes to string literals can be made in pollStrings.json

   Future features:
     Move voting or offer alternate voting with a !vote command
     Threshhold for ending voting (i.e. 80% of a room voted yes, so go ahead and end the poll)
   TODO:
     Support ties in voting.
*/
const pollStrings = require('../config/pollStrings.json');
class Poll {
    constructor(question, answers, timelimit, minresponse, maxresponse, channelCount, client, channel) {
      this.question = question;
      this.answers = answers;
      this.timelimit = timelimit * 60;
      this.minresponse = minresponse;
      this.maxresponse = maxresponse;
      this.client = client;
      this.channel = channel;
      
      this.channelCount = channelCount;             // We want this eventually, doesn't work yet
      
      this._votes = new Object();
      for (let a in this.answers) {
          let answer = this.answers[a].toString();
          answer = answer.toUpperCase();
          this._votes[answer] = 0;
      }
      this._advertisecount = 0;
      this._pollInterval = null;
      this._isrunning = false;
      this._voteRecord = new Object();
    }
    
    start() {
        // This function starts the poll, sets isrunning to true, and
        // establishes the poll interval to announce at regular intervals to the chat
        this._isrunning = true;
        var reminderGap = this.timelimit * 100;
        var t = this;
        this._pollInterval = setInterval(function(){ t.report() }, reminderGap);
        return true;
    }
    report() {
        // this function sets up the interval timer used to report poll info
        // and regular updates to the chat.
        if (this._advertisecount >= 10) {
            this.timeout();
        } else {
            //this.client.say(this.channel, "Did some stuff 5 seconds later");
            let questionText = "POLL: " + this.question;
            var count = 1;
            for (let a in this.answers) {
                let answer = this.answers[a].toString();
                answer = answer.toUpperCase();
                questionText += " [" + count + "] " + this.answers[a] + ": " + this._votes[answer];
                count++;
            }
            this.client.say(this.channel, questionText);
            this.client.say(this.channel, pollStrings.time_remaining + " " + this.timeRemaining());
            this._advertisecount += 1;
        }
    }
    status() {
        // this function can be called to report the current status of the poll
        // to the chat, including whether the poll is active, how many votes, and
        // how long the vote was for.
        var output;
        if (this._isrunning == true) {
            output += "Poll is running";
            
        }
    }
    isActive() {
        // Checks to see if the poll is running/active
        return this._isrunning;
    }
    timeRemaining() {
        // This function calculates the time remaining in the poll based on the
        // current advertise count, maximum duration, and
        // formats it appropriately
        // Note: Currently only supports times under an hour
        let secondsRemaining = this.timelimit - (this._advertisecount * (this.timelimit/10));
        if ( secondsRemaining / 60 < 1) {
            return "0:" + secondsRemaining;
        } else {
            let minutesRemaining = Math.floor(secondsRemaining / 60);
            secondsRemaining -= minutesRemaining * 60;
            if (secondsRemaining < 10) {
                secondsRemaining = "0" + secondsRemaining;
            }
            return minutesRemaining + ":" + secondsRemaining;
        }
    }
    registerVote(vote, user) {
        // This takes a vote and a user and sets their vote in memory as long
        // as they haven't already voted.
        
        // don't collect a new vote if the quiz is no longer running
        if (!this._isrunning) {
            return false;
        }

        // This is the logic for vote registering
        // Votes can be submitted numerically, or by typing the full answer
        // Votes are not case sensitive and are made upper case before comparison
        // International/UTF-8/other localities and languages could have issues with this
        if (this._voteRecord[user] === undefined) {
            // user does not exist and therefore has not voted
            if (this.isNumeric(vote)) {
                // User has submitted a numeric answer
                // Check if it exists and record it by name if it does
                console.log("[" + user + "] Vote accepted (numeric).");
                // check if the numeric answer exists
                var value = this.getValueAtPosition(this.answers, vote);
                if (value === false) {
                    console.log("[" + user + "] Vote rejected, (numeric answer not found).");
                    return false;
                } else {
                    // the answer did exist, so we record the answer
                    this._voteRecord[user] = new Object();
                    this._voteRecord[user].voted = 1;
                    this._voteRecord[user].vote = vote;
                    this._votes[value.toString().toUpperCase()] += 1;
                    return true;
                }
            } else {
                // User has submitted an alphabetic answer
                // Check that it is a possible answer and record it if so
                if (this.checkAnswerArray(this.answers, vote.toString())) {
                    console.log("[" + user + "] Vote accepted (alphabetic).");
                    this._voteRecord[user] = new Object();
                    this._voteRecord[user].voted = 1;
                    this._voteRecord[user].vote = vote;
                    this._votes[vote.toString().toUpperCase()] += 1;
                    return true;
                } else {
                    console.log("[" + user + "] Vote rejected (answer not an option).");
                    return false;
                }
            }
        } else if (this._voteRecord[user].voted == 1) {
            console.log("[" + user + "] Vote rejected (already voted).");
            return false;
        } else {
            console.log("[" + user + "] Vote rejected (other reason).");
            return false;
        }
    }
    announceWinner() {
        // Search the votes for the highest vote
        // then announce the winner to the chat
        var maxVote = 0, winner;
        for (var v in this._votes) {
            if (this._votes[v] > maxVote) {
                maxVote = this._votes[v];
                winner = v;
            }
        }
        let output;
        if (maxVote > 0) {
            output = pollStrings.winner;
            output = output.replace("$winner", winner);
            output = output.replace("$maxvote", maxVote);
        } else {
            output = pollStrings.novotes;
        }
        this.client.say(this.channel, output);
    }
    timeout() {
        // Concludes a poll that has ended by time out
        // Clears the interval, sets the running variable to false
        // And announces closure of the poll
        clearInterval(this._pollInterval);
        this._isrunning = false;
        this.client.say(this.channel, pollStrings.time_up);
        this.announceWinner();
    }
    stop() {
        // Stops the current poll by cancelling the interval,
        // setting the is running variable to false,
        // and announcing that the poll has been stopped
        clearInterval(this._pollInterval);
        this._isrunning = false;
        this.client.say(this.channel, pollStrings.poll_stopped);
        this.announceWinner();
    }
    isNumeric(n) {
        // Simple function to test if value is numeric or not
        return !isNaN(parseFloat(n)) && isFinite(n);
    }
    checkAnswerArray(arr, val) {
        // This function checks an array [arr] to see if a value [val] is present
        // Search is case insensitive, turns all values to upper case before comparison
        // If the value is found, returns true
        // Otherwise, returns false
        var found = false;
        for (let a in arr) {
            if (arr[a].toUpperCase() == val.toUpperCase()) {
                found = true;
            }
        }
        return found;
    }
    getValueAtPosition(arr, n) {
        // This function searches an array (arr) for the value at given position (n)
        // If the value is found, it returns that value
        // If the value is not found, it returns false
        var count = 1;
        for (let a in arr) {
            if (count == n) {
                return arr[a];
            }
            count++;
        }
        return false;
    }
    getString(n) {
        return pollStrings[n];
    }
  }
  module.exports = Poll;