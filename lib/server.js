/**
 * Server related tasks
 * 
 */

// Dependencies
var http = require('http');
var https = require('https');
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;
var config = require('./config');
var fs = require('fs');
var handlers = require('./handlers');
var helpers = require('./helpers');
var path = require('path');

// Instantiate the server module object
var server = {};

// Instantiate HTTP server
server.httpServer = http.createServer(function(req, res){
    unifiedServer(req, res);    
});

// Instantiate HTTPS server
server.httpsServerOptions = {
    'key': fs.readFileSync(path.join(__dirname,'/../https/key.pem')),
    'cert': fs.readFileSync(path.join(__dirname, '/../https/cert.pem'))
};
server.httpsServer = https.createServer(server.httpsServerOptions, function(req, res){
    unifiedServer(req, res);
});



// All the server logic for both http and https
server.unifiedServer = function(req, res) {
    // Get the url and parse it
    var parsedUrl = url.parse(req.url, true);

    // Get the path
    var path = parsedUrl.pathname;
    var trimmedPath = path.replace(/^\/+|\/+$/g, '');

    // Get the query sting as an object
    var queryStringObject = parsedUrl.query;

    // Get the HTTP Method
    var method = req.method.toLocaleLowerCase();

    // Get the headers as an object
    var headers = req.headers;

    // Get the payload, if any
    var decoder = new StringDecoder('utf-8'); 
    var buffer = '';
    req.on('data', function(data){
        buffer += decoder.write(data);
    });

    req.on('end', function(){
        buffer += decoder.end();

        // Choose the handler this request go to. If one is not found use the not found handler
        var chosenHandler = typeof(server.router[trimmedPath]) != 'undefined' ? server.router[trimmedPath] : handlers.notFound;

        // Construct the data object to send to the handler
        var data = {
            'trimmedPath': trimmedPath,
            'queryStringObject': queryStringObject,
            'method': method,
            'headers': headers,
            'payload': helpers.parseJsonToObject(buffer)
        };

        // Route the request to the handler specified in the router
        chosenHandler(data, function(statusCode, payload){
            // Use the status code callback by the handler or use the default status code
            statusCode = typeof(statusCode) == 'number'? statusCode : 200;

            // Use the payload ca;ll back by the handler or use the empty payload
            payload = typeof(payload) == 'object'? payload : {};

            //Convert the payload to string
            var payloadString = JSON.stringify(payload);

            // Return the response
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(statusCode);
            res.end(payloadString);

            // Log the request path
            console.log('Returning this response: ', statusCode, payloadString);
        });   
    });    
}

// Define a router
server.router = {
    'ping': handlers.ping,
    'users': handlers.users,
    'tokens': handlers.tokens,
    'checks': handlers.checks
};

// Init Script
server.init = function() {
    // Start HTTP the server
    server.httpServer.listen(config.httpPort, function(){
        console.log('The server is listening on port ' + config.httpPort);
    });

    // Start HTTPS the server
    server.httpsServer.listen(config.httpsPort, function(){
        console.log('The server is listening on port ' + config.httpsPort);
    });

}

// Export the server
module.exports = server;