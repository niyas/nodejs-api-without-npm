
/**
 * These are the request handlers
 */

// Dependencies
var _data = require('./data');
var helpers = require('./helpers');

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
// @TODO Only let authenticated user access their object, dont let them access anyone's data
handlers._users.get = function(data, callback) {
    // Check that the phone number is valid
    var phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
    if(phone) {
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
        callback(400, {'Error': 'Missing required field'});
    }
};

// Users - put
// Required data: phone
// Optional data: firstName, lastName, password(atleast one must be specified)
// @TODO Only let an authenticated user modify their object, dont let them modify anyone's data
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
            callback(400, {'Error': 'Missing field to update'});
        }
    } else {
        callback(400, {'Error': 'Missing required field'});
    }
};

// Users - Delete
// Required data : phone
// Optional data : none
// @TODO : Only let an authenticated user can delete their Object
// @TODO : Cleanup (delete) any other data files associated with the user 
handlers._users.delete = function(data, callback) {
    // Check the phone number is valid
    var phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
    
    if(phone) {
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
        })
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
            if(!err && data) {
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
handlers._tokens.put = function(data, callback) {

}

// Token - Delete
handlers._tokens.delete = function(data, callback) {

}



// Export the module
module.exports = handlers;