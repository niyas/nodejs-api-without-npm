
/**
 * These are the request handlers
 */

// Dependencies
var _data = require('./data');
var helpers = require('./helpers');
var config = require('./config');

// Define handlers
var handlers = {};

handlers.ping = function(data, callback) {
    callback(200);
}

// Not found handler
handlers.notFound = function(data, callback) {
    callback(404);
};

// Define Users
handlers.users = function(data, callback) {
    var acceptableMethods = ['post', 'get', 'put', 'delete'];
    if(acceptableMethods.indexOf(data.method) > -1) {
        handlers._users[data.method](data, callback);
    } else {
        callback(405);
    }
}

// Container for user submethods
handlers._users = {};

// Users - Post
// Required data: firstName, lastName, phone, password, tosAgreement
// Optional data: none
handlers._users.post = function(data, callback) {
    // Check that all the required fields are  filled out
    var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
    var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    var tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false;

    if(firstName && lastName && phone && password && tosAgreement) {
        // Make sure taht the user doesnt already exists
        _data.read('users', phone, function(err, data) {
            if(err) {
                // Hash the password
                var hashedPassword = helpers.hash(password);

                // Create the user object
                if(hashedPassword) {
                    var userObject = {
                        'firstName': firstName,
                        'lastName': lastName,
                        'phone': phone,
                        'hashedPassword': hashedPassword,
                        'tosAgreement': tosAgreement
                    };
    
                    // Store the user
                    _data.create('users', phone, userObject, function(err) {
                        if(!err) {
                            callback(200);
                        } else {
                            callback(500, {'Error': 'Could not create the new user'});
                        }
                    });
                } else {
                    callback(500, {'Error': 'Couldnot has the user\'s password'});
                }
               
            } else {
                callback(400, {'Error': 'A user with that phone number already exists.'});
            }
        })
    } else {
        callback(400, {'Error': 'Missing required fields'});
    }
};

// Users - Get
// Required data: phone
// Optional data: none
handlers._users.get = function(data, callback) {
    // Check that the phone number is valid
    var phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
    if(phone) {
        // Get token from headers
        var token = typeof(data.headers.token) == 'string' && data.headers.token.trim().length == '20'? data.headers.token.trim() : false;
         
        // Verify the given token is valid for the phone number
        handlers._tokens.verifyToken(token, phone, function(tokenIsValid) {
            if(tokenIsValid) {  
                _data.read('users', phone, function(err, data) {
                    if(!err && data) {
                        // Remove the hash password before returning it to the user
                        delete data.hashedPassword;
                        callback(200, data);    
                    } else {
                        callback(404)
                    }
                });
            } else {
                callback(403, {'Error': 'Missing required token in header, or token is invalid'});
            }
        });
    } else {
        callback(400, {'Error': 'Missing required field'});
    }
};

// Users - put
// Required data: phone
// Optional data: firstName, lastName, password(atleast one must be specified)
handlers._users.put = function(data, callback) {
    // Check that the phone number is valid
    var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;

    // Check for the optional fields
    var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

    // Error if phone is invalid
    if(phone) {
        if(firstName || lastName || password) {
            var token = typeof(data.headers.token) == 'string' && data.headers.token.trim().length == '20'? data.headers.token.trim() : false;
         
            // Verify the given token is valid for the phone number
            handlers._tokens.verifyToken(token, phone, function(tokenIsValid) {
                if(tokenIsValid) {
                    // Lookup for user
                    _data.read('users', phone, function(err, userData) {
                        if(!err && userData) {
                            // Update the fields necessary
                            if(firstName) {
                                userData.firstName = firstName;
                            }
                            if(lastName) {
                                userData.lastName = lastName;
                            }
                            if(password) {
                                userData.hashedPassword = helpers.hash(password);
                            }
                            // Store the new updates
                            _data.update('users', phone, userData, function(err) {
                                if(!err) {
                                    callback(200);
                                } else {
                                    console.log(err);
                                    callback(500, {'Error': 'Could not update the user'});
                                }
                            })
                        } else {
                            callback(400, {'Error': 'The specified user does not exist'});
                        }
                    });
                } else {
                    callback(403, {'Error': 'Missing required token in header, or token is invalid'});
                }
                    
            });
        } else {
            callback(400, {'Error': 'Missing field to update'});
        }
    } else {
        callback(400, {'Error': 'Missing required field'});
    }
};

// Users - Delete
// Required data : phone
// Optional data : none
handlers._users.delete = function(data, callback) {
    // Check the phone number is valid
    var phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
    
    if(phone) {
        // Get token from headers
        var token = typeof(data.headers.token) == 'string' && data.headers.token.trim().length == '20'? data.headers.token.trim() : false;
         
        // Verify the given token is valid for the phone number
        handlers._tokens.verifyToken(token, phone, function(tokenIsValid) {
            if(tokenIsValid) {
                _data.read('users', phone, function(err, userData) {
                    if(!err && userData) {
                        _data.delete('users', phone, function(err) {
                            if(!err) {
                                callback(200);
                            } else {
                                callback(500, {'Error': 'Unable to delete the user'});
                            }
                        })
                    } else {
                        callback(400, {'Error': 'The specified user does not exist'});
                    }
                });
            } else {
                callback(403, {'Error': 'Missing required token in header, or token is invalid'});
            }
        });
    } else {
        callback(400, {'Error': 'Missing required field'})
    }
};

// Define Tokens
handlers.tokens = function(data, callback) {
    var acceptableMethods = ['get', 'put', 'post', 'delete'];
    if(acceptableMethods.indexOf(data.method) > -1) {
        handlers._tokens[data.method](data, callback);
    } else {
        callback(405, {'Error': 'The specified method not allowded'})
    }
}

// Container for token submethods
handlers._tokens = {};

// Token - Post
// Required data : phone, password
// Optional data : none
handlers._tokens.post = function(data, callback) {
    var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
    var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

    if(phone && password) {
        // Lookup the user who matches the phone number
        _data.read('users', phone, function(err, userData) {
            if(!err && userData) {
                // hash the sent password and compare it to the password stored in the user object
                var hashedPassword = helpers.hash(password);
                if(hashedPassword == userData.hashedPassword) {
                    // Create a new token with a valid name set exparation data one hour in future
                    var tokenId = helpers.createRandomString(20);
                    var expires = Date.now() + 1000 * 60 * 60;
                    var tokenObject = {
                        'phone': phone,
                        'id': tokenId,
                        'expires': expires
                    };

                    // Store the token
                    _data.create('tokens', tokenId, tokenObject, function(err) {
                        if(!err) {
                            callback(200, tokenObject);
                        } else {
                            callback(500, {'Error': 'Could not create new token'})
                        }
                    });
                } else {
                    callback(400, {'Error': 'The password did not match the specified user stored password'})
                }
            } else {
                callback(400, {'Error' : 'The user doed not exist'});
            }
        })
    } else {
        callback(400, {'Error' : 'Missing required fields'});
    }
}

// Tokens - Get
// Required data : id
// Optional data : none
handlers._tokens.get = function(data, callback) {
    // Check the Id id valid
    var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
    if(id) {
        // Lookup the token
        _data.read('tokens', id, function(err, tokenData) {
            if(!err && tokenData) {
                callback(200, tokenData);
            } else {
                callback(400, {'Error': 'Invalid token id'});
            }
        });
    } else {
        callback(400, {'Error': 'Missing required fields'});
    }
}


// Token - Put
// Required Data : id, extend
// Optional data : none
handlers._tokens.put = function(data, callback) {
    // Check that the id and extend is valid
    var id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
    var extend = typeof(data.payload.extend) == 'boolean' && data.payload.extend == true ? true : false;

    if(id && extend) {
        // Lookup the token
        _data.read('tokens', id, function(err, tokenData) {
            if(!err && tokenData) {
                // Check if the token is expired
                if(tokenData.expires > Date.now()) {
                    tokenData.expires = Date.now() + 1000 * 60 * 60;

                    // Store the new updates
                    _data.update('tokens', id, tokenData, function(err) {
                        if(!err) {
                            callback(200);
                        } else {
                            callback(500, {'Error': 'Could not update the token\'s expiration'});
                        }
                    });
                } else {
                    callback(400, {'Error': 'The token has already expired, and cannot be extended'})
                }
            } else {
                callback(400, {'Error': 'The token id does not exist'});
            }
        });
    } else {
        callback(400, {'Error': 'Missing required field(s) or field(s) are invalid'});
    }
}

// Token - Delete
// Required data : id
// Optional data : none
handlers._tokens.delete = function(data, callback) {
    // Check that the id is valid
    var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
    if(id) {
        // Lookup for token
        _data.read('tokens', id, function(err, tokenData) {
            if(!err && tokenData) {
                // Delete the token if exist
                _data.delete('tokens', id, function(err) {
                    if(!err) {
                        callback(200);
                    } else {
                        callback(500, {'Error': 'Unable to delete the token'});
                    }
                });
            } else {
                callback(400, {'Error': 'Could not find the token id'});
            }   
        });
    } else {
        callback(400, {'Error': 'Missing required field'});
    }
}

 // Verify if the given token id is currently valid for a given user
 handlers._tokens.verifyToken = function(id, phone, callback) {
     // Lookup the token
     _data.read('tokens', id, function(err, tokenData) {
         if(!err && tokenData) {
            // Check the token is for given user and not expired
            if(phone == tokenData.phone && tokenData.expires > Date.now()) {
                callback(true)
            } else {
                callback(false)
            }
         } else {
             callback(false)
         }
     });
 }

 // Setup checks handler
 handlers.checks = function(data, callback) {
     var acceptableMethods = ['get', 'post', 'put', 'delete'];
     if(acceptableMethods.indexOf(data.method) > -1) {
         handlers._checks[data.method](data, callback);
     } else {
         callback(405);
     }
 }

 // Container for all the checks method
 handlers._checks = {}

 // Checks - Post
 // Required data : protocol, url, method, successCodes, timeoutSeconds
 // Optional data : none
 handlers._checks.post = function(data, callback) {
     // Validate all the inputs
     var protocol = typeof(data.payload.protocol) == 'string' && ['http','https'].indexOf(data.payload.protocol.trim()) > -1 ? data.payload.protocol.trim() : false;
     var method = typeof(data.payload.method) == 'string' && ['get','put','post','delete'].indexOf(data.payload.method.trim()) > -1 ? data.payload.method.trim() : false;
     var url = typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
     var successCodes = typeof(data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0? data.payload.successCodes : false;
     var timeoutSeconds = typeof(data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >=1 && data.payload.timeoutSeconds <=5? data.payload.timeoutSeconds : false;

     if(protocol && url && method && successCodes && timeoutSeconds) {
        //Get the token from headers
        var token = typeof(data.headers.token) == 'string'? data.headers.token : false;

        // Lookup the user by reading the token
        _data.read('tokens', token, function(err, tokenData) {
            if(!err && tokenData) {
                var userPhone = tokenData.phone;
                
                // Lookup the user data
                _data.read('users', userPhone, function(err, userData) {
                    if(!err && userData) {
                        var userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array? userData.checks : [];

                        // Verify that the user has less than the number of max checks
                        if(userChecks.length < config.maxChecks) {
                            // Create a random id for checks
                            var checkId =  helpers.createRandomString(20);

                            // Create the check object, and include the user phone
                            checkObject = {
                                'id': checkId,
                                'userPhone': userPhone,
                                'protocol': url,
                                'method': method,
                                'successCodes': successCodes,
                                'timeoutSeconds': timeoutSeconds
                            };

                            // Create the check object and include the user's phone
                            _data.create('checks', checkId, checkObject, function(err) {
                                if(!err) {
                                    // Add the checkId to user's object
                                    userData.checks = userChecks;
                                    userData.checks.push(checkId);

                                    // Save the user data
                                    _data.update('users', userPhone, userData, function(err) {
                                        if(!err) {
                                            // Return the data about the new check
                                            callback(200, checkObject);
                                        } else {
                                            callback(500, {'Error': 'Could not update the user with new check'})
                                        }
                                    })
                                } else {
                                    callback(500, {'Error': 'Unable to create the check object.'})
                                }
                            });
                        } else {
                            callback(400, {'Error': 'The user already has the maximum number of checks(' + config.maxChecks + ')'})
                        }
                    } else {
                        callback(403, {'Error': 'Invalid user'});
                    }
                });
            } else {
                callback(403, {'Error': 'The token is not valild'});
            }
        });
     } else {
         callback(400, {'Error': 'Missing Required fields'});
     }
 }


// Export the module
module.exports = handlers;