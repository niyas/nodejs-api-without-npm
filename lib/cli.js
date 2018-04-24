/**
 * These are CLI related tasks
 */

 // Dependencies
 var readLine = require('readline');
 var util = require('util');
 var debug = util.debug('cli');
 var events = require('events');
 class _events extends events {};
 var e = new _events();

 // Instantiate CLI module object
 var cli = {};


 // Input handlers
 e.on('man', function(str) {
    cli.responders.help();
 });   

 e.on('help', function(str) {
    cli.responders.help();
 });

 e.on('exit', function(str) {
    cli.responders.exit();
 });

 e.on('stats', function(str) {
    cli.responders.stats();
 });

 e.on('list users', function(str) {
    cli.responders.listUsers();
 });

 e.on('more user info', function(str) {
    cli.responders.moreUserInfo(str);
 });

 e.on('list checks', function(str) {
    cli.responders.listChecks(str);
 });

 e.on('more check info', function(str) {
    cli.responders.moreChecksInfo(str);
 });

 e.on('list logs', function(str) {
    cli.responders.listLogs();
 });

 e.on('more log info', function(str) {
    cli.responders.moreLogsInfo(str);
 });


 // Responsers Object
 cli.responders = {}; 

 // Help / man
 cli.responders.help = function() {
     console.log('You asked for help')
 }

 // Exit
 cli.responders.exit = function() {
    console.log('You asked for exit')
 }

 // Stats
 cli.responders.stats = function() {
    console.log('You asked for stats')
 }

 // List Users
 cli.responders.listUsers = function() {
    console.log('You asked for list users')
 }

 // More user Info
 cli.responders.moreUserInfo = function(str) {
    console.log('You asked for more user Info', str)
 }

 // List Checks
 cli.responders.listChecks = function(str) {
    console.log('You asked for list checks', str)
 }

 // More check info
 cli.responders.moreCheckInfo = function(str) {
    console.log('You asked for more check info', str);
 }

 // List Logs
 cli.responders.listLogs = function() {
    console.log('You asked for list logs');
 }

 // More Log Info
 cli.responders.moreLogInfo = function(str) {
    console.log('You asked for more log Info', str);
 }

 // Input processor
 cli.processInput = function(str) {
     str = typeof(str) == 'string' && str.trim().length > 0 ? str.trim() : false;
     // Only process the input if the user wrote something, otherwise ignore it
     if(str) {
        // Codify the unique string that identify the unique question allowed to be asked
        var uniqueInputs = [
            'man',
            'help',
            'exit',
            'stats',
            'list users',
            'more user info',
            'list checks',
            'more check info',
            'list logs',
            'more log info'
        ];

        // Go through the possible input, emit an event when a match is found
        var matchFound = false;
        var counter = 0;
        uniqueInputs.some(function(input) {
            if(str.toLowerCase().indexOf(input) > -1) {
                matchFound = true;

                // Emit an event matching the unique input, and include the full string given by the user
                e.emit(input, str);
                return true;

            }
        });

        // If no match is found, tell the use to try again
        if(!matchFound) {
            console.log('Sorry, Try again');
        }
     }  
 };

 // Init script
 cli.init = function() {
     // Send the start message to the console in dark blue
     console.log('\x1b[34m%s\x1b[0m', 'The CLI is running');

     // Start the interface
     var _interface = readLine.createInterface({
         input: process.stdin,
         output: process.stdout,
         prompt: '>'
     });

     // Create an initial prompt
     _interface.prompt();

     // Handle each line of input separately
     _interface.on('line', function(str) {
        // Send to the input processor
        cli.processInput(str);

        // Reinitialize the prompt afterwards
        _interface.prompt();
     });

     // If the user stops the CLI, kill the associated process
     _interface.on('close', function() {
        process.exit(0);
     });
 };


 // Export module
 module.exports = cli;

