/**
 * Example TCP(Net) server
 * Lisstens to port 6000 and sends the word "pong" to client
 */

 // Dependencies
 var net = require('net');

 // Create the server
 var server = net.createServer(function(connection) {
    // Send the word "pong"
    var outboundMessage = "pong";
    connection.write(outboundMessage);

    // When the client write something log that out
    connection.on('data', function(inboundMessage) {
        var messageString = inboundMessage.toString();
        console.log(`I wrote ${outboundMessage} and they said ${messageString}`)
    });
 });

 // Bind to 6000
 server.listen(6000);