var irc = require("irc");
var fs = require('fs');

// Make sure requried files exist
var wordlists = JSON.parse(fs.readFileSync('wordlist.json', 'utf8'));
var secrets = JSON.parse(fs.readFileSync('oauthfile.json', 'utf8'));
var inmem = JSON.parse(fs.readFileSync('config.json', 'utf8'));

console.log(secrets);


var activeBroadcasts = [];

if (!inmem.joinlist) {
    console.log("Please specifiy a list of channels to join in the config.json file section 'joinlist'");
    process.exit(1);
}

var config = {
    server: "irc.twitch.tv",
    botName: "repkbot",
    channel: inmem.joinlist
};

console.log("Starting up repbot on irc...");
// Create the bot name
var bot = new irc.Client(config.server, config.botName, {
    channels: config.channel,
    debug: false,
    password: secrets.oauth,
    username: config.botName
});

bot.addListener('error', function (message) {
    console.log("Error: " + JSON.stringify(message));
});

bot.addListener('end', function (reason) {
    console.log("connection ended!");
});


config.channel.forEach(function (channelName) {
    console.log("Listening in " + channelName);

    // Create a config for this channel if it doesnt exist
    if (!inmem[channelName]) {
        var current = {};
        current.trusted = [];
        current.quotes = [];
        current.deathcount = 0;
        current.broadcast = [];

        console.log("Creating config entry for " + channelName + ": " + JSON.stringify(current));
        inmem[channelName] = current;
        updateConfig();
    } else {
        console.log("Config entry for " + channelName + " exists");
    }

    // Use this method for any setup needed in the channel
    bot.addListener('join' + channelName, function (nick, message) {
        console.log("" + nick + " joined the channel " + channelName);
    });

    bot.addListener('part' + channelName, function (nick, message) {
        console.log("" + nick + " left the channel " + channelName);
    });

    bot.addListener('message' + channelName, function (from, message) {
        if (message.substring(0, 1) === '!') {
            var msgarray = message.split(" ");
            switch (msgarray[0]) {
                case '!trust': // expects !trusted [name]
                    cmdTrusted(channelName, from, msgarray);
                    break;

                case "!told": // expects !told
                    cmdTold(channelName, from, msgarray);
                    break;

                case "!rekt": // expects !rekt
                    cmdRekt(channelName, from, msgarray);
                    break;

                case "!quote": // expects !quote
                    cmdQuote(channelName, from, msgarray);
                    break;

                case "!death":
                    cmdDeathCount(channelName, from, msgarray);
                    break;

                case "!saveconfig":
                    cmdSaveConfig(channelName, from, msgarray);
                    break;

                case "!printconfig":
                    cmdPrintConfig(channelName, from, msgarray);
                    break;

                case "!" + config.botName:
                    cmdPrintCommands(channelName, from, msgarray);
                    break;

                case "!help":
                    cmdPrintCommands(channelName, from, msgarray);
                    break;

                case "!about":
                    cmdAboutBot(channelName, from, msgarray);
                    break;
                    
                case "!pickme":
                    cmdPickMe(channelName, from, msgarray);
                    break;

                case "!broadcast":
                    cmdBroadcast(channelName, from, msgarray);
                    break;
                default:
                    conprint(channelName, "Unhandled: " + from + ": " + message);
                    break;
            }
        }
    });
});

function randomInt(low, high) {
    return Math.floor(Math.random() * (high - low) + low);
}

/**
 * Print something to the console. Takes the channel name and a log message
 */
function conprint(channel, logmsg) {
    console.log("[" + channel + "] " + logmsg);
}


/**
 * Say something back into the IRC channel specified. Also log to console
 */
function botprint(channel, logmsg) {
    conprint(channel, config.botName + ": " + logmsg);
    bot.say(channel, logmsg);
}

/**
 * Checks if a user is trusted in the given channel
 * The Owner of the channel is always trusted, and therefore
 * can add other trusted members.
 *
 * If I can find a way to check if someone is a channel mod, this will also
 * give them trusted status.
 */
function isTrusted(channelName, name) {
    if ("#" + name === channelName) {
        // conprint(channelName, "Verified, user " + name + " is the owner of " + channelName);
        return true;
    }

    if (name === "repkam09") {
        return true;
    }

    if (inmem[channelName].trusted.indexOf(name.toUpperCase()) > -1) {
        //conprint(channelName, "Verified, user " + name + " is trusted in " + channelName);
        return true;
    } else {
        //conprint(channelName, "Rejected, user " + name + " is not trusted in " + channelName);
        return false;
    }
}


/**
 * The !trust command. Adds a user as trusted so they can
 * have access to other commands
 */
function cmdTrusted(channelName, from, msgarray) {
    if (msgarray.length !== 2) {
        botprint(channelName, "Usage is: !trust username");
    } else {
        var addUser = msgarray[1];
        // Verify that the user submitting the command is trusted
        if (isTrusted(channelName, from)) {
            // Check if this person is trusted already...
            if (isTrusted(channelName, addUser)) {
                botprint(channelName, addUser + " is already a trusted user");
            } else {
                inmem[channelName].trusted.push(addUser.toUpperCase());
                botprint(channelName, from + " adding '" + addUser + "' as trusted user");
                updateConfig(); // Write this change out to the config file
            }
        } else {
            conprint(channelName, from + " does not have trust. Command ignored.");
        }
    }
}


/**
 * The !pickme command. A trusted user can '!pickme start' this, the bot will watch for additional users who then
 * type this command. They will be added to a list. When a trusted user types '!pickme stop' the bot will
 * select a random user who entered the '!pickme' list.
 */

var pickmelist = [];
function cmdPickMe(channelName, from, msgarray) {
    // If pickme settings do not exist for this channel yet, create them.
    if (!pickmelist[channelName]) {
        var obj = { inprogress: false, users: [] };
        pickmelist[channelName] = obj;
    }

    if (msgarray[1] === "start") {
        if (isTrusted(channelName, from)) {
            // check if pickme is already running for this channel.
            if (pickmelist[channelName].inprogress) {
                botprint(channelName, "A random drawing is already in progress!");
            } else {
                pickmelist[channelName].inprogress = true;
                pickmelist[channelName].users = [];
                botprint(channelName, "A random drawing has started! Please type '!pickme' in the chat to enter your name!");
            }
        }
    }

    if (msgarray[1] === "stop") {
        if (isTrusted(channelName, from)) {
            if (pickmelist[channelName].inprogress) {
                pickmelist[channelName].inprogress = false;
                var count = pickmelist[channelName].users.length;
                var winner = pickmelist[channelName].users[Math.floor(Math.random() * count)];
                pickmelist[channelName].users = [];
                botprint(channelName, "Random drawing stopped! " + count + " users entered. The winner is " + winner + "! Congratulations!");
            }
        }
    }

    if (msgarray[1] === "stats") {
        if (isTrusted(channelName, from)) {
            // check if pickme is already running for this channel.
            if (pickmelist[channelName].inprogress) {
                var amount = pickmelist[channelName].users.length;
                botprint(channelName, "There is a drawing in progress with " + amount + " users entered so far!");
            } else {
                botprint(channelName, "There is a not currently a drawing running. You can start one by typing '!pickme start' in chat.");
            }
        }
    }

    // check if pickme is running. If it is, add the user to the list!
    if (pickmelist[channelName].inprogress) {
        // check if user is already in the list:
        if (pickmelist[channelName].users.indexOf(from) === -1) {
            pickmelist[channelName].users.push(from);
        }
    }
}

/**
 * The !death command ups the channel death counter
 * @TODO Maybe make this 'per-game' somehow...
 */
function cmdDeathCount(channelName, from, msgarray) {
    if (isTrusted(channelName, from)) {
        if (msgarray[1] === "reset") {
            inmem[channelName].deathcount = 0;
            botprint(channelName, "The deathcount has been reset to " + inmem[channelName].deathcount + ".");
        } else {
            inmem[channelName].deathcount = (inmem[channelName].deathcount + 1);
            botprint(channelName, "The deathcount is now " + inmem[channelName].deathcount + "!");
        }

        updateConfig(); // Write this change out to the config file
    }
}


/**
 * Prints a random 'told' message from the global list of 'told' messages
 */
function cmdTold(channelName, from, msgarray) {
    if (wordlists.toldlist) {
        var randomint = randomInt(0, wordlists.toldlist.length - 1);
        var told = wordlists.toldlist[randomint];
        botprint(channelName, told);
    }
}

/**
 * Prints a random 'rekt' message from the global list of 'rekt' messages
 */
function cmdRekt(channelName, from, msgarray) {
    if (wordlists.toldlist) {
        var randomint = randomInt(0, wordlists.rektlist.length - 1);
        var rekt = wordlists.rektlist[randomint];
        botprint(channelName, rekt);
    }
}

/**
 * Prints a random quote that has been saved for this channel
 */
function cmdQuote(channelName, from, msgarray) {
    // Check if we're adding a quote, or just displaying a quote
    if (msgarray[1] === "add") {
        if (isTrusted(channelName, from)) {
            var stringbuilder = "";
            var arrayLength = msgarray.length;
            for (var i = 2; i < arrayLength; i++) {
                stringbuilder += (msgarray[i] + " ");
            }

            inmem[channelName].quotes.push(stringbuilder);
            updateConfig(); // Write this change out to the config file
            botprint(channelName, "Added quote: " + stringbuilder);
        }
    } else {
        // Display an existing quote
        if (inmem[channelName].quotes.length > 0) {
            var quotenbr = randomInt(0, inmem[channelName].quotes.length);
            var quotestring = inmem[channelName].quotes[quotenbr];
            botprint(channelName, "[" + (quotenbr + 1) + "/" + (inmem[channelName].quotes.length) + "]  " + quotestring);
        } else {
            botprint(channelName, "This channel does not have any saved quotes, sorry! ");
        }
    }
}

function cmdBroadcast(channelName, from, msgarray) {
    if (isTrusted(channelName, from)) {
        // Case to add a new broadcast
        if (msgarray[1] === "add") {
            var timeMins = msgarray[2];
            if (isInteger(timeMins)) {
                var stringbuilder = "";
                var arrayLength = msgarray.length;
                for (var i = 3; i < arrayLength; i++) {
                    stringbuilder += (msgarray[i] + " ");
                }

                // Add the broadcast section if it didnt exist before
                if (!inmem[channelName].broadcast) {
                    inmem[channelName].broadcast = [];
                }

                inmem[channelName].broadcast.push({ time: timeMins, text: stringbuilder });
                updateConfig(); // Write this change out to the config file
                botprint(channelName, "Broadcast '" + stringbuilder + "' every " + timeMins + " minutes.");
                addNewBroadcast(channelName, timeMins, stringbuilder);
            }
        }

        // Case to disable broadcast messages
        if (msgarray[1] === "stop") {
            broadcastStop(channelName, from, msgarray);
        }

        // Case to enable broadcast messages
        if (msgarray[1] === "start") {
            broadcastStart(channelName, from, msgarray);
        }

        // Case to enable broadcast messages
        if (msgarray[1] === "clear") {
            broadcastClear(channelName, from, msgarray);
        }
    }
}

function isInteger(x) {
    return x % 1 === 0;
}

function broadcastClear(channelName, from, msgarray) {
    // Stop the existing broadcasts
    broadcastStop(channelName, from, msgarray);

    // Clear the configured broadcasts
    inmem[channelName].broadcast = [];
    updateConfig(); // Write this change out to the config file
    botprint(channelName, "All broadcast messages cleared.");
}

function broadcastStop(channelName, from, msgarray) {
    if (activeBroadcasts[channelName]) {
        activeBroadcasts[channelName].forEach(function (timer) {
            //conprint(channelName, "Stopping timer: " + timer);
            clearInterval(timer);
        });

        botprint(channelName, "Broadcast messages stopped");
        activeBroadcasts[channelName] = [];
    } else {
        activeBroadcasts[channelName] = [];
    }
}

function broadcastStart(channelName, from, msgarray) {
    if (activeBroadcasts[channelName].length === 0) {
        inmem[channelName].broadcast.forEach(function (bcast) {
            addNewBroadcast(channelName, bcast.time, bcast.text);
        });
        botprint(channelName, "Broadcast messages started");
    }
}


function addNewBroadcast(channelName, time, stringbuilder) {
    var bcastfunc = function () {
        botprint(channelName, "Announcement: " + stringbuilder);
    }

    var timeMins = (time * 60000);
    var bcasttimer = setInterval(bcastfunc, timeMins);

    //conprint(channelName, "Created timer: " + bcasttimer);

    if (activeBroadcasts[channelName]) {
        activeBroadcasts[channelName].push(bcasttimer);
    } else {
        activeBroadcasts[channelName] = [];
        activeBroadcasts[channelName].push(bcasttimer);
    }
}


function cmdSaveConfig(channelName, from, msgarray) {
    if (from === "repkam09") {
        updateConfig();
        botprint(channelName, "Wrote config.json file!");
    }
}

function cmdPrintConfig(channelName, from, msgarray) {
    if (from === "repkam09") {
        botprint(channelName, "config: " + JSON.stringify(inmem[channelName]));
    }
}

function updateConfig() {
    fs.writeFileSync("./config.json", JSON.stringify(inmem));
}

function cmdPrintCommands(channelName, from, msgarray) {
    var usage = "Commands: !told, !rekt, !death, !death reset, !quote, !quote add [quote], !"
        + config.botName + ", !trust [username], !help, !about";
    botprint(channelName, usage);
}

function cmdAboutBot(channelName, from, msgarray) {
    botprint(channelName, "This bot was created by user @Repkam09. You can find the source code on github[dot]com/repkam09/repbot-irc/")
}
