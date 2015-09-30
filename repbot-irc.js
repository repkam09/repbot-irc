var irc = require("irc");
var fs = require('fs');

var wordlists = JSON.parse(fs.readFileSync('wordlists.json', 'utf8'));
var secrets = JSON.parse(fs.readFileSync('oauthfile.json', 'utf8'));

console.log(secrets);

var config = {
    server: "irc.twitch.tv",
    botName: "repkbot",
    channel: "#lowride_mcclyde"
};

console.log("Starting up repbot on irc...");

// Create the bot name
var bot = new irc.Client(config.server, config.botName, {
    channels: [config.channel],
    debug: true,
    password: secrets.oauth,
    username: config.botName
});

bot.addListener('message', function (from, to, message) {
    if (message.indexOf("told") > -1) {
        var told = randomInt(0, wordlists.toldlist.length - 1);
        bot.say(config.channel, wordlists.toldlist[told]);
    }

    if (message.indexOf("rekt") > -1) {
        var rekt = randomInt(0, wordlists.rektlist.length - 1);
        bot.say(config.channel, wordlists.rektlist[rekt]);
    }

    if (message.indexOf("!hype") === 0) {
        bot.say(config.channel, "/me HYPE THRUSTERS ACTIVATED!! (http://gfycat.com/ActualFeistyBettong)");
    }

    if (message.indexOf("!reloadconfig") === 0) {
        // Verify that the user requesting this is "repkam09"
        if (from === "repkam09") {
            try {
                wordlists = JSON.parse(fs.readFileSync('wordlists.json', 'utf8'));
                bot.say(config.channel, "/me configuration reloaded successfully");
            } catch (error) {
                bot.say(config.channel, "/me error during configuration reloaded");
            }
        } else {
            bot.say(config.channel, "sorry, only 'repkam09' can use this method.");
        }
    }

    if (message === "!help") {
        bot.say(config.channel, "Commands: !hype, !rekt, !told, !help");
    }
});

console.log("> Add Chat Listener for Errors");
bot.addListener('error', function (message) {
    console.log('error: ', message);
});

bot.addListener('end', function (reason) {
    console.log("connection ended!");
});

function randomInt(low, high) {
    return Math.floor(Math.random() * (high - low) + low);
}
