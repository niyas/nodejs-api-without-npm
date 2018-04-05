/**
 * Primary file for the API
 * 
 */

// Dependencies
var http = require('http');
var https = require('https');
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;
var config = require('./lib/config');
var fs = require('fs');
var handlers = require('./lib/handlers');
var helpers = require('./lib/helpers');

// Instantiate HTTP server
var httpServer = http.createServer(function(req, res){
    unifiedServer(req, res);    
});

// Instantiate HTTPS server
var httpsServerOptions = {
    'key': fs.readFileSync('./https/key.pem'),
    'cert': fs.readFileSync('./https/cert.pem')
};
var httpsServer = https.createServer(httpsServerOptions, function(req, res){
    unifiedServer(req, res);
});

// Start HTTP the server
httpServer.listen(config.httpPort, function(){
    console.log('The server is listening on port ' + config.httpPort);
});

// Start HTTPS the server
httpsServer.listen(config.httpsPort, function(){
    console.log('The server is listening on port ' + config.httpsPort);
});


// All the server logic for both http and https
var unifiedServer = function(req, res) {
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
        var chosenHandler = typeof(router[trimmedPath]) != 'undefined' ? router[trimmedPath] : handlers.notFound;

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
var router = {
    'ping': handlers.ping,
    'users': handlers.users,
    'tokens': handlers.tokens
};