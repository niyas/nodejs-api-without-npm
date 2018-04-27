

 //Dependencies
 var helpers = require('./../lib/helpers');
 var assert = require('assert');
 var logs = require('./../lib/logs');
 var exampleDebuggingProblem = require('./../lib/exampleDebuggingProblem');

 // Holder for these test

 var unit = {};


// Assert that the getANumber function is returning a number
unit['helpers.getANumber should return a number'] = function(done){
    var val = helpers.getANumber();
    assert.equal(typeof(val), 'number');
    done();
};


// Assert that the getANumber function is returning 1
unit['helpers.getANumber should return 1'] = function(done){
    var val = helpers.getANumber();
    assert.equal(val, 1);
    done();
};

// Assert that the getANumber function is returning 2
unit['helpers.getNumberOne should return 2'] = function(done){
    var val = helpers.getANumber();
    assert.equal(val, 2);
    done();
};

// Logs.list should call back an array or false
unit['logs.list should call back a false error and an array of log'] = function(done) {
    logs.list(true, function(err, logFileNames) {
        assert.equal(err, false);
        assert.ok(logFileNames instanceof Array);
        assert.ok(logFileNames.length > 1);
    });
};

// Logs.truncate should not throw if the log id doesnt exist
unit['Logs.truncate should not throw if the log id doesnt exist it should callback'] = function(done) {
    assert.doesNotThrow(function() {
        logs.truncate('I do not exist', function(err) {
            assert.ok(err);
            done();
        });
    }, TypeError);
};

// exampleDebuggingProblem.init should not throw(but iit does)
unit['exampleDebuggingProblem.init should not throw when called'] = function(done) {
    assert.doesNotThrow(function() {
        exampleDebuggingProblem.init('I do not exist', function(err) {
            assert.ok(err);
            done();
        });
    }, TypeError);
};

//Export
module.exports = unit;