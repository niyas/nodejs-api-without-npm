/**
 * Example HTTP2 client
 */

 // Dependencies
 var http2 = require('http2');

 // Create Client
 var client = http2.connect('http://localhost:6000');

 // Create a request
 var req = client.request({
    ':path': '/'
 });

 // When a message is received add the pieces together until you reached the end
 var str = '';
 req.on('data', function(chunk) {
    str += chunk;
 });

 // When the message ends, log it out
 req.on('end', function() {
    console.log(str);;
 });

 // End the request
 req.end();