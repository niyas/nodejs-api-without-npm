/**
 * Example UDP client
 * Sending a message to a USP server on port 6000
 */

 // Dependencies
 var dgram = require('dgram');

 // Create the client
 var client = dgram.createSocket('udp4');

 // Define the message and put it into a bugger
 var messageString = 'This is a message';
 var messageBuffer =  Buffer.from(messageString);

 // Send of the message
 client.send(messageBuffer, 6000, 'localhost', function(err) {
    client.close();
 });