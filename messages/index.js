"use strict";

// External packages declaration
var apiairecognizer     = require('api-ai-recognizer'),
    builder             = require("botbuilder"),
    botbuilder_azure    = require("botbuilder-azure"),
    path                = require('path'),
    util                = require('util');

// Internal packages declaration
var middleware          = require('../libs/middleware'),
    poi                 = require('../libs/client_location_service');

// Environment variables load 
require('dotenv').config();

// Define if we are going to use emulator in local enviroment
var useEmulator = (process.env.NODE_ENV == 'development');

var connector = useEmulator ? new builder.ChatConnector() : new botbuilder_azure.BotServiceConnector({
    appId: process.env['MicrosoftAppId'],
    appPassword: process.env['MicrosoftAppPassword'],
    stateEndpoint: process.env['BotStateEndpoint'],
    openIdMetadata: process.env['BotOpenIdMetadata']
});

var bot = new builder.UniversalBot(connector);

bot.localePath(path.join(__dirname, './locale'));

bot.dialog('/Cancelar', [
    function (session) {
        session.endDialog('Cancelado el dialogo');
    }
]).triggerAction({ matches: /^cancelar/i});

var recognizer = new apiairecognizer(process.env['ApiAiToken']); 
var intents = new builder.IntentDialog({ recognizers: [recognizer] } )
.onDefault((session, args) => {
    var name = session.message.user ? session.message.user.name : null;
    session.send(name + ' ' + args.entities[0].entity);

    sendProactiveMessage();
});

bot.dialog('/', intents);    

// Set the Incoming and Outcoming functions for the middleware
bot.use({
    botbuilder: middleware.LogIncomingMessage,
    send: middleware.LogOutgoingMessage
});

// Create the listening
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

function sendProactiveMessage() {
    var address = {
        "id" : "mid.$cAAXXvCjTQUtkrQLNNFee72A56bn6",
        "channelId" : "facebook",
        "user" : {
            "id" : "1421609847955732",
            "name" : "Saul San Martin Almeyda"
        },
        "conversation" : {
            "isGroup" : false,
            "id" : "1421609847955732-1644577435616203"
        },
        "bot" : {
            "id" : "1644577435616203",
            "name" : "bot-piloto-bncr"
        },
        "serviceUrl" : "https://facebook.botframework.com"
    };
    console.log('Ready to send');
    var msg = new builder.Message().address(address);
    msg.text('Hola, este es un push notification');
    msg.textLocale('en-US');
    bot.send(msg);
    console.log('Sent');
}
