/**
 * Helper for various tasks
 */

 // Depandencies
 var crypto = require('crypto');
 var config = require('./config');
 var https = require('https');
 var querystring = require('querystring');
 var path = require('path');
 var fs = require('fs');

 // Container for all the helpers
 var helpers = {};

 // Sample for  testing that simply returns a number
 helpers.getANumber = function() {
     return 1;
 }

 // Create a SHA256 hash
 helpers.hash = function(str) {
     if(typeof(str) == 'string' && str.length > 0) {
         var hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
         return hash;
     } else {
         return false;
     }
 }

 // Parse a json sting to an Object in all cases, without throwing
 helpers.parseJsonToObject = function(str) {
    try{
        var obj =  JSON.parse(str);
        return obj;
    } catch(e) {
        return {};
    }
 }

 // Create a string opf random alpha numeric numbers for a given length
 helpers.createRandomString = function(strLength) {
     strLength = typeof(strLength) == 'number' && strLength > 0 ? strLength : false;
     if(strLength) {
        // Define all the possible characters that should go into string
        var possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';

        // Start the final string
        var str = '';
        for(i=1; i<= strLength; i++) {
            // Get a random character from the possibleCharacters string
            var randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length))
            // Append the character to the final string
            str += randomCharacter;
        }
        return str;
     } else {
         return false;
     }
 }

 // Send an SMS message via Twilio
 helpers.sendTwilioSms = function(phone, msg, callback) {
     phone = typeof(phone) == 'string' && phone.trim().length == 10? phone.trim() : false;
     msg = typeof(msg) == 'string' && msg.trim().length > 0 && msg.trim().length <=1600? msg.trim() : false;

     if(phone && msg) {
        // Configure the request payload
        var payload = {
            'From' : config.twilio.fromPhone,
            'To' : '+1' + phone,
            'Body' : msg
        };

        // Stringify the payload
        var stringPayload = querystring.stringify(payload);

        // Configure the request details
        var requestDetails =  {
            'protocol' : 'https:',
            'hostname' : 'api.twilio.com',
            'method' : 'POST',
            'path' : '/2010-04-01/Accounts/' + config.twilio.accountSId + '/Messages.json',
            'auth' : config.twilio.accountSid + ':' + config.twilio.authToken,
            'headers' : {
                'Content-Type' : 'application/x-www-form-urlencoded',
                'Content-Length' : Buffer.byteLength(stringPayload) 
            }
        };

        // Instanciate the request Object
        var req = https.request(requestDetails, function(res) {
            // Grab the status of the sent request
            var status =  res.statusCode;
            // Callback to the caller if the request went through
            if(status == 200 || status == 201 || status == 404) {
                callback(false);
            } else {
                callback('Given parameters were missing or invalid.');
            }
        })

        // Bind the error event so it does not get thrown
        req.on('error', function(e){
            callback(e);
        });

        // Add payload to the request
        req.write(stringPayload);

        // End the request
        req.end();
     } else {
         callback('Given parameters were missing or invalid');
     }

 }

 // Get the string content of a template
 helpers.getTemplate = function(templateName, data, callback) {
    templateName = typeof(templateName) == 'string' && templateName.trim().length > 0 ? templateName.trim() : false;
    data = typeof(data) == 'object' && data != null ? data : {};
    if(templateName) {
        var templatesDir = path.join(__dirname, '/../templates/');
        fs.readFile(templatesDir + templateName + '.html', 'utf8', function(err, str) {
            if(!err && str && str.length > 0) {
                // Interpolation on string
                var finalString = helpers.interpolate(str, data);
                callback(false, finalString);
            } else {
                callback('No template could be found');
            }
        });
    } else {
        callback('A valid template name was not specified');
    }
 };

 // Add the universal header and footer to the string and pass the provided data object to header and footer for interpolation
 helpers.addUniversalTemplates = function(str, data, callback) {
    str = typeof(str) == 'string' && str.trim().length > 0 ? str.trim() : '';
    data = typeof(data) == 'object' && data != null ? data : {};

    // Get the header
    helpers.getTemplate('_header', data, function(err, headerString) {
        if(!err && headerString) {
            // Get Footer
            helpers.getTemplate('_footer', data, function(err, footerString) {
                if(!err && footerString) {
                    // Add them all together
                    var fullString = headerString + str + footerString;
                    callback(false, fullString)
                } else {
                    callback('Could not find the footer template');
                }
            });
        } else {
            callback('Could not find the header template');
        }
    });
 }

 // Take a given string and a data object and find and replace all the keys in it
 helpers.interpolate = function(str, data) {
     str = typeof(str) == 'string' && str.trim().length > 0 ? str.trim() : '';
     data = typeof(data) == 'object' && data != null ? data : {};

     // Add the templateGlobals and prepare their key name with "global"
     for(var keyName in config.templateGlobals) {
         if(config.templateGlobals.hasOwnProperty(keyName)) {
             data['global.' + keyName] = config.templateGlobals[keyName];
         }
     }

     // For each key in the data object, inserts its value into corresponding placeholder
     for(var key in data) {
         if(data.hasOwnProperty(key) && typeof(data[key]) == 'string') {
             var replace = data[key];
             var find = '{' + key + '}';
             str = str.replace(find, replace);
         }
     }

     return str;
 }

 // Get the contents of a static (public) asset\
 helpers.getStaticAsset = function(fileName, callback) {
     fileName = typeof(fileName) == 'string' && fileName.length > 0 ? fileName.trim() : false;

     if(fileName) {
        var publicDir = path.join(__dirname, '/../public/');
        fs.readFile(publicDir + fileName, function(err, data) {
            if(!err && data) {
                callback(false, data);
            } else {
                callback('No file could be found');
            }
        });
     } else {
         callback('A valid filename was not specified');
     }
 }

 // Export the module
 module.exports = helpers;