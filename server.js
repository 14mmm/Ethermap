'use strict';

var express = require('express');

//Catch all errors so that the node app won't crash
process.on('uncaughtException', function (err) {
  console.error(err);
  console.log('Node NOT Exiting...');
});

/**
 * Main application file
 */

// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// Application Config
var config = require('./lib/config/config');

var app = express();

// Express settings
require('./lib/config/express')(app);

// Routing
require('./lib/routes')(app);


//WebSocket   Starts the 
var websocketServer = require('./lib/socketio')(app);
websocketServer.listen(config.port);


console.log('Express server listening on port %d in %s mode', config.port, app.get('env'));

//error logging with raven
var raven = require('raven');
app.error(raven.middleware.express('http://0a205057c4cd4538a86d394a46887736:a1dc8654699f4843abe1099c48bdb895@errors.allmende.io/3'));


// Expose app
exports = module.exports = app;
