var irc = require("irc");
var fs = require('fs');

var wordlists = JSON.parse(fs.readFileSync('wordlists.json', 'utf8'));
var secrets = JSON.parse(fs.readFileSync('oauthfile.json', 'utf8'));

var deathcount = 44;

console.log(secrets);

var config = {
    server: "irc.twitch.tv",
    botName: "repkbot",
    channel: ["#repkam09", "#lowride_mcclyde"]
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
    console.log('error: ', message);
});

bot.addListener('end', function (reason) {
    console.log("connection ended!");
});


config.channel.forEach(function (channelName) {
    console.log("Listening in " + channelName);
    bot.addListener('message' + channelName, function (from, message) {
	console.log("[" + channelName + "] " + from + " : " + message);
        if (message.indexOf("told") > -1) {
            var told = randomInt(0, wordlists.toldlist.length - 1);
            bot.say(channelName, wordlists.toldlist[told]);
        }

        if (message.indexOf("!quote") === 0) {
            var quotestring = "";
            try {
                var quote = randomInt(0, wordlists[channelName].length - 1);
                quotestring = wordlists[channelName][quote];
            } catch (exception) {
                console.log("No quotes for " + channelName);
            }

            if (quotestring !== "") {
                bot.say(channelName, quotestring);
            }
        }

        if (message.indexOf("rekt") > -1) {
            var rekt = randomInt(0, wordlists.rektlist.length - 1);
            bot.say(channelName, wordlists.rektlist[rekt]);
        }

        if (message.indexOf("!hype") === 0) {
            bot.say(channelName, "/me HYPE THRUSTERS ACTIVATED!! (http://gfycat.com/ActualFeistyBettong)");
        }

	if (message.indexOf("!death") === 0) {
		if (from === "bigfignewton" || from === "repkam09") {
			console.log(from + " increased the death counter by 1");
			deathcount = (deathcount + 1);
			bot.say(channelName, "Death Count: " + deathcount);
		}
	}

	if (message.indexOf("!deathreset") === 0) {
		if (from === "bigfignewton" || from === "repkam09") {
			bot.say(channelName, "Death counter reset");
			deathcount = 0;
		}
	}

        if (message.indexOf("!reloadconfig") === 0) {
            // Verify that the user requesting this is "repkam09"
            if (from === "repkam09") {
                try {
                    wordlists = JSON.parse(fs.readFileSync('wordlists.json', 'utf8'));
                    bot.say(channelName, "/me configuration reloaded successfully");
                } catch (error) {
                    bot.say(channelName, "/me error during configuration reloaded");
                }
            } else {
                bot.say(channelName, "sorry, only 'repkam09' can use this method.");
            }
        }

        if (message === "!help") {
            bot.say(channelName, "Commands: !hype, !rekt, !told, !help");
        }
    })
});

function randomInt(low, high) {
    return Math.floor(Math.random() * (high - low) + low);
}
