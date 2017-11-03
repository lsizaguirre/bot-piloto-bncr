'use strict';

const builder             = require("botbuilder"),
      botbuilder_azure    = require("botbuilder-azure"),
      locationDialog      = require('botbuilder-location'),
      path                = require('path'),
      middleware          = require('../middleware'),
      dialogs             = require('../../messages/dialogs');

const getUseEmulator = () => {
    return (process.env.BotEnv == 'development');
}

const buildConnector = useEmulator => {
    let connector = useEmulator ? new builder.ChatConnector() : new botbuilder_azure.BotServiceConnector({
        appId: process.env['MicrosoftAppId'],
        appPassword: process.env['MicrosoftAppPassword'],
        stateEndpoint: process.env['BotStateEndpoint'],
        openIdMetadata: process.env['BotOpenIdMetadata']
    });
    return connector;    
}

const buildBot = connector => {
    let bot = new builder.UniversalBot(connector);
    middleware.initMiddleware(bot);
    bot.localePath(path.join(__dirname, './locale'));
    bot.library(locationDialog.createLibrary(process.env.BING_MAPS_API_KEY));
    dialogs.setDialogs(bot);
    this.appbot = bot;
    return bot;
}

const startLocalServer = connector => {
    // Create the listening
    var restify = require('restify');
    var server = restify.createServer();
    server.listen(3978, function() {
        console.log('test bot endpoint at http://localhost:3978/api/messages');
    });
    server.post('/api/messages', connector.listen());
}

const startAdditionalServer = () => {
    var restify = require('restify');
    var server = restify.createServer();
    server.use(restify.plugins.bodyParser());
    server.listen(3979, function() {
        console.log('Additional endpoint initialized');
    });
    server.post('/event/post', (req, res, next) => {
        console.log('Entré');
        res.json("Venezuela");
        /*
        const builder = require("botbuilder");
        const botbuilder_azure = require("botbuilder-azure");
        this.appbot.loadSession(req.body.address, function(err, session){
            if(err) {
                console.log(err);
                msg.text('Hubo un error');
                msg.textLocale('en-US');
                this.appbot.send(msg);
            }
            else {
                var msg = new builder.Message().address(req.body.address);
                msg.text('Work!');
                msg.textLocale('en-US');
                session.send(msg);
            }
        });
        next();
        res.json('Venezuela');
        */
    });
}

module.exports = {
    getUseEmulator: getUseEmulator,
    buildConnector: buildConnector,
    buildBot: buildBot,
    startLocalServer: startLocalServer,
    startAdditionalServer: startAdditionalServer
};