/**
 * Example UDP server
 * Create UDP data gram server listening on 6000
 */

 // Dependencies
 var dgram = require('dgram');

 // Create a server
 var server = dgram.createSocket('udp4');

 server.on('message', function(messageBuffer, sender) {
    // Do something with incoming message or do something with th sender
    var messageString = messageBuffer.toString();
    console.log(messageString);
 });

 // Bind to 6000
 server.bind(6000);

