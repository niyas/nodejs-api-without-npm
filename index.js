/**
 * Primary file for the API
 */

 // Dependencies
 var server = require('./lib/server');
 var worker = require('./lib/workers');

 // Declare the app
 var app = {};

 // Init function
 app.init = function() {
    // Start the server
    server.init();

    // Strat the worker
    worker.init();
 };

 // Execute
 app.init();

 // Export the app
 module.exports = app;