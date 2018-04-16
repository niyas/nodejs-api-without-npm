
/**
 * These are worker related tasks...
 */

 // Dependancies
 var path = require('path');
 var fs = require('fs');
 var http = require('http');
 var https = require('https');
 var url = require('url');
 var helpers = require('./helpers');
 var _data = require('./data');
 var _logs = require('./logs');


// Instantiate worker object
var workers = {};

// Lookup all checks , get their data, send to validator
workers.gatherAllChecks = function() {
    // Get all checks
    _data.list('checks', function(err, checks) {
        if(!err && checks && checks.length > 0) {
            checks.forEach(function(check) {
                // Read in the check data
                _data.read('checks', check, function(err, originalChecksData) {
                    if(!err && originalChecksData) {
                        // Pass it to check validator, and let that function continue or log errors as needed
                        workers.validateCheckData(originalChecksData);
                    } else {
                        console.log("Error: Reading one of the check data");
                    }
                });
            });
        } else {
            console.log("Error: could not find any checks to process");
        }
    });
}

// Sanity-check the check data
workers.validateCheckData = function(originalChecksData) {
    originalChecksData = typeof(originalChecksData) == 'object' && originalChecksData!=null ? originalChecksData : {};
    originalChecksData.id = typeof(originalChecksData.id) == 'string' && originalChecksData.id.trim().length == 20 ? originalChecksData.id.trim() : false;
    originalChecksData.userPhone = typeof(originalChecksData.userPhone) == 'string' && originalChecksData.userPhone.trim().length == 10 ? originalChecksData.userPhone.trim() : false;
    originalChecksData.protocol = typeof(originalChecksData.protocol) == 'string' && ['http', 'https'].indexOf(originalChecksData.protocol.trim()) > -1 ? originalChecksData.protocol.trim() : false;
    originalChecksData.url = typeof(originalChecksData.url) == 'string' && originalChecksData.url.trim().length > 0 ? originalChecksData.url.trim() : false;
    originalChecksData.method = typeof(originalChecksData.method) == 'string' && ['get', 'post', 'put', 'delete'].indexOf(originalChecksData.method.trim()) > -1 ? originalChecksData.method.trim() : false;
    originalChecksData.timeoutSeconds = typeof(originalChecksData.timeoutSeconds) == 'number' && originalChecksData.timeoutSeconds >= 1 && originalChecksData.timeoutSeconds <= 5 ? originalChecksData.timeoutSeconds : false;
    originalChecksData.successCodes = typeof(originalChecksData.successCodes) == 'object' && originalChecksData.successCodes instanceof Array && originalChecksData.successCodes.length > 0 ? originalChecksData.successCodes : false;

    // Set the keys that may not set (if the workers is never seen the check)
    originalChecksData.state = typeof(originalChecksData.state) == 'string' && ['up', 'down'].indexOf(originalChecksData.state.trim()) > -1 ? originalChecksData.state.trim() : 'down';
    originalChecksData.lastChecked = typeof(originalChecksData.lastChecked) == 'number' && originalChecksData.lastChecked >= 1? originalChecksData.lastChecked : false;

    // If all the check passed, pass the data along to next step
    if(originalChecksData.id && 
        originalChecksData.userPhone &&
        originalChecksData.url &&
        originalChecksData.protocol &&
        originalChecksData.method &&
        originalChecksData.timeoutSeconds &&
        originalChecksData.successCodes
    ) {
        workers.performCheck(originalChecksData);
    } else {
        console.log('Error: One of the checks is not properly formatted, Shipping it');
    }

};

// Perform the check, send the original data and perfor the check process and pass iut to next step
workers.performCheck = function(originalChecksData) {
    // Prepare the initial check outcome
    var checkOutcome = {
        'error': false,
        'responseCode': false
    };

    // Mark that the outcome is not been sent yet
    var outcomeSent = false;

    // Parse the host name and ppath out of the original data
    var parsedUrl = url.parse(originalChecksData.protocol + '://' + originalChecksData.url);
    var hostname = parsedUrl.hostname;
    var path = parsedUrl.path; // Using path and not the "pathname", because we need the querystring

    // Construct the request
    var requestDetails = {
        'protocol': originalChecksData.protocol + ':',
        'hostname': hostname,
        'method': originalChecksData.method.toUpperCase(),
        'path': path,
        'timeout': originalChecksData.timeoutSeconds * 1000
    };

    // Instantiate the request object (using http or https model)
    var _moduleToUse = originalChecksData.protocol == 'http' ? http : https;

    var req = _moduleToUse.request(requestDetails, function(res) {
        // Grab the status of sent request
        var status = res.statusCode;

        // Update  the check outcome and pass the data along
        checkOutcome.responseCode = status;
        if(!outcomeSent) {
            workers.processCheckOutcome(originalChecksData, checkOutcome);
            outcomeSent = true;
        }
    });

    // Bind to the error event so it doesnot get thrown
    req.on('error', function(e) {
        // Update the check outcome and pass the data along.
        checkOutcome.error = {
            'error': true,
            'value': e
        };

        if(!outcomeSent) {
            workers.processCheckOutcome(originalChecksData, checkOutcome);
            outcomeSent = true;
        }
    });

    // Bind to the timeout event so it doesnot get thrown
    req.on('timeout', function(e) {
        // Update the check outcome and pass the data along.
        checkOutcome.error = {
            'error': true,
            'value': 'timeout'
        };

        if(!outcomeSent) {
            workers.processCheckOutcome(originalChecksData, checkOutcome);
            outcomeSent = true;
        }
    });

    // End the request
    req.end();
};

// To process the check outcome and update check data if needed, trigger an alert if needed.
// Special logic for check taht has never been tested before.
workers.processCheckOutcome = function(originalCheckData, checkOutcome) {
    // Decide if the check is considered up or down.
    var state = !checkOutcome.error && checkOutcome.responseCode && originalCheckData.successCodes.indexOf[checkOutcome.responseCode] > -1 ? 'up' : 'down';

    // Decide if an alert is warranted.
    var alertWarranted = originalCheckData.lastChecked && originalCheckData.state != state? true : false;

    // Log the outcome of the check
    var timeOfCheck = Date.now();
    workers.log(originalCheckData, checkOutcome, state, alertWarranted, timeOfCheck);

    // Update the check data.
    var newCheckData = originalCheckData;
    newCheckData.state = state;
    newCheckData.lastChecked = Date.now();
    
  
    // Save the updates.
    _data.update('checks', newCheckData.id, newCheckData, function(err) {
        if(!err) {
            // Send the new check data to next phase of the process if needed.
            if(alertWarranted) {
                workers.alertUserToStatusChange(newCheckData);
            } else {
                console.log('Check outcome has not changed , no alert needed');
            }
        } else {
            console.log('Error trying to save updates to one of the checks');
        }
    })

};

// Alert the user as to a change in their check status
workers.alertUserToStatusChange = function(newCheckData) {
    var msg = 'Alert: Your check for ' + newCheckData.method.toUpperCase()+ ' ' + newCheckData.protocol + '://' + newCheckData.url + ' is currently ' + newCheckData.state;
    helpers.sendTwilioSms(newCheckData.userPhone, msg, function(err) {
        if(!err) {
            console.log('Success: The user was alerted to a status change in their checks. via sms:' + msg);
        } else {
            console.log('Error: could not send sms alert');
        }
    })
}

// Timer to execute worker-process once per minute
workers.loop = function() {
    setInterval(function(){
        workers.gatherAllChecks();
    }, 1000 * 60);  
};


// Rotate (compress the log files)
workers.rotateLogs = function() {
    // List all non compressed log files
    _logs.list(false, function(err, logs) {
        if(!err && logs && logs.length > 0) {
            logs.forEach(function(logName) {
                // Compress the data to a different file
                var logId = logName.replace('.log', '');
                var newFileId = logId + '-' + Date.now();
                _logs.compress(logId, newFileId, function(err) {
                    if(!err) {
                        // Truncate the log
                        _logs.truncate(logId, function(err) {
                            if(!err) {
                                console.log('Success truncating log file');
                            } else {
                                console.log('Error truncating log file');
                            }
                        })
                    } else {
                        console.log('Error compressing one of the log file')
                    }
                });
            });
        } else {
            console.log('Could not find any logs to rotate');
        }
    })
}

// Timer to execute log-rotation process once in a day
workers.logRotationLoop = function() {
    setInterval(function() {
        workers.rotateLogs();
    }, 1000 * 60 * 60 * 24)
};


// Init Script
workers.init = function() {
    // Execute all the checks immediately
    workers.gatherAllChecks();
    // Call the loop so the check will execute later on
    workers.loop();

    // Compress all the logs immediatly
    workers.rotateLogs();

    // Call the compression loop so the logs will be compressed later on
    workers.logRotationLoop();
}


workers.log = function(originalCheckData, checkOutcome, state, alertWarranted, timeOfCheck) {
    // Form the log data
    var logData = {
        check: originalCheckData,
        outcome: checkOutcome,
        state: state,
        alert: alertWarranted,
        time: timeOfCheck
    };

    // Convert data to a string
    var logString = JSON.stringify(logData);

    // Determine the log file
    var logFileName = originalCheckData.id;

    // Append the log sting to the file
    _logs.append(logFileName, logString, function(err) {
        if(!err) {
            console.log('Logging to the file successed')
        }
        else {
            console.log('Logging to the file failed');
        }
    });

}

 // Export worker object
module.exports = workers;