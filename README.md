# repbot-irc
A nodejs irc bot with some simple actions. This bot is designed to work well with Twitch TV chats providing some entertaining features.

You can check out this bot in action by going to my Twitch.TV chat page: twitch.tv/repkam09/chat.

# Commands
Command | Trusted | Description
------------- | ------------- | -------------
!told | No | Prints a random 'told' message from the list of 'told' messages
!rekt | No | Prints a random 'told' message from the list of 'rekt' messages
!death | Yes | Adds one to the channel death counter and prints the new death count
!death reset | Yes | Resets the death counter to zero
!quote | No | Prints out a random quote message if any exist.
!quote add [quote] | Yes | Adds a quote to the list of quotes for the channel
!repkbot | No | An alias for the '!help' command
!trust [username] | Yes | Adds a user to the 'trusted' group allowing them access to all commands. Some commands are restricted to trusted users only.
!help | No | Print out the list of available commands
!about | No | Print out an 'about' message
!broadcast add [time] [message] | Yes | Add a new broadcast method that will be printed every [time]Minutes by the bot.
!broadcast clear | Yes | Remove all broadcast messages for the channel
!broadcast start | Yes | Start up broadcast messages, if any exist. Good when starting streaming.
!broadcast stop | Yes | Stop all broadcast messages, if any exist. Good when you're done streaming.
!pickme | No | Enter your name into a random drawing if there is one in progress
!pickme start | Yes | Start a random drawing if one is not already in progress
!pickme stop | Yes | Finish a random drawing and select a winner from the users who entered.
!pickme stats | Yes | Show how many usrs have entered a drawing that is current in progress
