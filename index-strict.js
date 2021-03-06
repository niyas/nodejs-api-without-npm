/**
 * Primary file for the API...
 */

 // Dependencies
 var server = require('./lib/server');
 var workers = require('./lib/workers');
 var cli = require('./lib/cli');

 // Declare the app
 var app = {};

  
 //Declare a global that a strict mode should catch
 foo = 'bar';
 
 // Init function
 app.init = function() {
    // Start the server..
    server.init();

    // Strat the worker
    workers.init();

    // Start the CLI, but make sure it starts last
    setTimeout(function() {
        cli.init();
    }, 50);
    
 };

 // Execute
 app.init();

 // Export the app
 module.exports = app;