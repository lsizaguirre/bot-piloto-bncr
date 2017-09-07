/*-----------------------------------------------------------------------------
This template demonstrates how to use an IntentDialog with a LuisRecognizer to add 
natural language support to a bot. 
For a complete walkthrough of creating this type of bot see the article at
https://aka.ms/abs-node-luis
-----------------------------------------------------------------------------*/
"use strict";
var builder = require("botbuilder");
var botbuilder_azure = require("botbuilder-azure");
var apiairecognizer = require('api-ai-recognizer'); 
var path = require('path');
var client_location = require('../libraries/bot_client_location')

require('dotenv').config();

var useEmulator = (process.env.NODE_ENV == 'development');

var connector = useEmulator ? new builder.ChatConnector() : new botbuilder_azure.BotServiceConnector({
    appId: process.env['MicrosoftAppId'],
    appPassword: process.env['MicrosoftAppPassword'],
    stateEndpoint: process.env['BotStateEndpoint'],
    openIdMetadata: process.env['BotOpenIdMetadata']
});

var bot = new builder.UniversalBot(connector);
bot.localePath(path.join(__dirname, './locale'));

// Make sure you add code to validate these fields
var luisAppId = process.env.LuisAppId;
var luisAPIKey = process.env.LuisAPIKey;
var luisAPIHostName = process.env.LuisAPIHostName || 'westus.api.cognitive.microsoft.com';

const LuisModelUrl = 'https://' + luisAPIHostName + '/luis/v1/application?id=' + luisAppId + '&subscription-key=' + luisAPIKey;

var recognizer = new apiairecognizer('4007f75ab16b40cfa3fc8cf8e3641db0'); 
var intents = new builder.IntentDialog({ recognizers: [recognizer] })


// Main dialog with LUIS
//var recognizer = new builder.LuisRecognizer(LuisModelUrl);
//var intents = new builder.IntentDialog({ recognizers: [recognizer] })
/*
.matches('<yourIntent>')... See details at http://docs.botframework.com/builder/node/guides/understanding-natural-language/
*/
.matches('greeting', (session, args)=> {
    var name = session.message.user ? session.message.user.name : null;
    
console.log('Session:' + JSON.stringify(session.message, null, 2));
//console.log('Args:' + JSON.stringify(args, null, 2));
/*
    client_location.NearLocations(process.env.BOT_ID, -76.70335, 30.71045, 5000)
    .then(
        function (value) {
            console.log('Contents a: ' + value);
        },
        function (reason) {
            console.error('Something went wrong', reason);
        }
    );

    client_location.AllLocations()
    .then(
        function (value) {
            console.log('Contents b: ' + value);
        },
        function (reason) {
            console.error('Something went wrong', reason);
        }
    );
*/
    session.send(`Yo estoy bien, como estás tu ${name}?`);
})
.onDefault((session) => {
    session.send('Sorry, I did not understand \'%s\'.', session.message.text);
});

bot.dialog('/', intents);    

if (useEmulator) {
    var restify = require('restify');
    var server = restify.createServer();
    server.listen(3978, function() {
        console.log('test bot endpoint at http://localhost:3978/api/messages');
    });
    server.post('/api/messages', connector.listen());    
} else {
    module.exports = { default: connector.listen() }
}

