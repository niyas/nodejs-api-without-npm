/**
 * Primary file for the API...
 */

 // Dependencies
 var server = require('./lib/server');
 var workers = require('./lib/workers');
 var cli = require('./lib/cli');
 var exampleDebuggingProblem = require('./lib/exampleDebuggingProblem')

 // Declare the app
 var app = {};

 // Init function
 app.init = function() {
    // Start the server..
    debugger;
    server.init();
    debugger;
    // Strat the worker
    debugger;
    workers.init();
    debugger;

    // Start the CLI, but make sure it starts last
    debugger;
    setTimeout(function() {
        cli.init();
        debugger;
    }, 50);
    debugger;

    // Set foo to 1
    debugger;
    var foo = 1;
    console.log("Just assigned 1 to foo");
    debugger;

    // Inceriment foo
    foo++;
    console.log("Just incement the foo");
    debugger;

    // Square foo
    foo = foo * foo;
    console.log("Squire the foo")
    debugger;

    //Convert foo to a string
    foo = foo.toString();
    console.log("convert foo to string");
    debugger;

    // Call the init script example
    exampleDebuggingProblem.init();
 };

 // Execute
 app.init();

 // Export the app
 module.exports = app;