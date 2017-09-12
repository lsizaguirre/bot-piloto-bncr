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

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    OutMessageSchema = new Schema({ type: Schema.Types.Mixed }, { strict : false }),
    OutMessageModel = mongoose.model('out_message', OutMessageSchema),
    InMessageSchema = new Schema({ type: Schema.Types.Mixed }, { strict : false }),
    InMessageModel = mongoose.model('in_message', InMessageSchema),
    ObjectID = mongoose.Types.ObjectId;

//mongoose instance connection url connectio
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://digebot-user:nr6Y2tAHRpxo0csF@digebot-cluster-shard-00-00-sexkt.mongodb.net:27017/DigebotDB,digebot-cluster-shard-00-01-sexkt.mongodb.net:27017/DigebotDB,digebot-cluster-shard-00-02-sexkt.mongodb.net:27017/DigebotDB?ssl=true&replicaSet=digebot-cluster-shard-0&authSource=admin'); 

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

bot.dialog('/Cancelar', [
    function (session) {
        session.endDialog('Cancelado el dialogo');
    }
]).triggerAction({ matches: /^cancelar/i});

var recognizer = new apiairecognizer(process.env['ApiAiToken']); 
var intents = new builder.IntentDialog({ recognizers: [recognizer] } )

// Main dialog with API.AI
.onDefault((session, args) => {
    //session.send('Sorry, I did not understand \'%s\'.', session.message.text);
    var name = session.message.user ? session.message.user.name : null;
    //const util = require('util');
    //console.log('Session:' + util.inspect(session));
    //console.log('Args:' + util.inspect(args));
    session.send(name + ' ' + args.entities[0].entity);
});

bot.dialog('/', intents);    

bot.use({
    botbuilder: function (session, next) {
        logMensajeEntrante(session, next);
        next();
    },
    send: function(event, next) {
        logMensajeSaliente(event, next);
        next();
    }
});

function logMensajeEntrante(session, next) {
    try {
        let inObj = session.message;
        inObj.bot_id = new ObjectID(process.env.BOT_ID);
        new InMessageModel(inObj).save();
        console.log(session.message);  
    } catch (error) {
        console.log(error)
    }
}

function logMensajeSaliente(event, next) {
    try {
        event.bot_id = new ObjectID(process.env.BOT_ID);
        new OutMessageModel(event).save();
        console.log(event);    
    } catch (error) {
        console.log(error)
    }
}

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

