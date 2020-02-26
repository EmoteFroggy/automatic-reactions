const Discord = require('discord.js');
const client = new Discord.Client();
const config = require('./config.json');
var store = require('json-fs-store')();
client.config = config;

client.once('ready', () => {
	console.log('Ready to react!');
});

// TODO: Make this cleaner, like an init function
var userList;
store.load("users", function(err, json) {
    if (err) {
        // Initialize for the first time
        var users = {
            id: "users",
            users: []
        }

        store.add(users, function(err) {
            if (err) {
                console.error("Problem creating user storage:", err);
            } else {
                console.log(`Created user storage!`);
                store.load("users", function(err, json) {
                    if (err) {
                        console.error("Problem setting userList after creation:", err);
                    } else {
                        console.log(`Successfully set userList variable!`);
                        userList = json.users;
                    }
                });
            }
        });
    } else {
        console.log("Set userList successfully!");
        userList = json.users;
    }
});

const prefix = config.prefix;
client.on('message', message => {
    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    // TODO: Add an else for this that catches if false
    if (!!userList)
    userList.forEach(function (userId) {
        if (message.author.id == userId) {
            // IDEA: Have way to custom select emoji here, or do they have
            // to manually add it?
            // IDEA: Could make each user have their own reaction array with sub-arrays
            message.react("673643185997873182")
            .then(console.log("Reacted to user!"))
            .catch(function(err) {
                console.error("[ERROR] Problem reacting! Message was probably deleted, but here's the full output anyways =>", err);
            });
        }
    });

    if (command == "add") {
        var mentionedUser = getMentionedUser(message);

        // Deletes the command message
        message.member.lastMessage.delete().catch(console.error);

        if (!!mentionedUser) {
            var currentUserList;
            store.load("users", function(err, json) {
                if (err) {
                    console.error("Problem loading user list:", err);
                } else {
                    var index = userList.indexOf(mentionedUser);
     
                    if (index < 0) {
                        currentUserList = json.users;
                        currentUserList.push(mentionedUser);

                        // To make it wait until the data has been retrieved
                        updateUserList(currentUserList);
                    } else {
                        console.log("That user is already on the reaction list!");
                    }
                }
            });
        } else {
            // Last message sent; user not specified
            console.log("Specify a user to add to the reaction list!");
        }
    } else if (command == "remove") {
        var mentionedUser = getMentionedUser(message);

        // Deletes the command message
        message.member.lastMessage.delete().catch(console.error);

        if (!!mentionedUser) {
            var index = userList.indexOf(mentionedUser);
     
            if (index > -1) {
                userList.splice(index, 1);
                updateUserList(userList);
            } else {
                console.log("That user is not on the reaction list!");
            }
        } else {
            // Last message sent; user not specified
            console.log("Specify a user to remove from the reaction list!");
        }
    } else if (command == "clear") {
        var users = [];
        updateUserList(users);
        message.member.lastMessage.delete().catch(console.error)
    }
});

// Either returns the mentioned user if there is one or null
// if there wasn't a user mentioned.
function getMentionedUser(message) {
    // Gets required user before message deletion
    if (message.mentions.users.first()) {
        var mentionedUser = message.mentions.users.first().id;
        return mentionedUser;
    } else {
        return "";
    }
}

/**
 * Adds new file if it doesn't exist and overwrites it if it does
 * with the new list of users to react to.
 * @param {array} newUserArray - list of user IDs to send to file
 */
function updateUserList(newUserArray) {
    var newUserList = {
        id: "users",
        users: newUserArray
    }

    store.add(newUserList, function(err) {
        if (err) {
            console.error("Problem adding new user:", err);
        } else {
            console.log("Successfully modified reaction list!");
            userList = newUserArray;
        }
    });
}

client.login(config.botToken);