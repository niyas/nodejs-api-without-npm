/**
 * Test runner
 */

 //Dependencies
 var helpers = require('./../lib/helpers');
 var assert = require('assert');

 // Application logic for the test runner
 _app = {};

 // Container for the test
 _app.tests = {
     'unit': {}
 };

// Assert that the getANumber function is returning a number
_app.tests.unit['helpers.getANumber should return a number'] = function(done){
    var val = helpers.getANumber();
    assert.equal(typeof(val), 'number');
    done();
  };
  
  
  // Assert that the getANumber function is returning 1
  _app.tests.unit['helpers.getANumber should return 1'] = function(done){
    var val = helpers.getANumber();
    assert.equal(val, 1);
    done();
  };
  
  // Assert that the getANumber function is returning 2
  _app.tests.unit['helpers.getNumberOne should return 2'] = function(done){
    var val = helpers.getANumber();
    assert.equal(val, 2);
    done();
  };

 // Count all the tests
 _app.countTests = function() {
     var counter = 0;
     for(var key in _app.tests) {
         if(_app.tests.hasOwnProperty(key)) {
             var subTests = _app.tests[key];
             for(var testName in subTests) {
                if(subTests.hasOwnProperty(testName)) {
                    counter++;
                }
             }
         }
     }
     return counter;
 }

 // Produce a test outcome result
 _app.produceTestReport = function(limit, successes, errors) {
    console.log(`
-------------------BEGIN TEST REPORT------------------

Total Tests: ${limit}
Pass: ${successes}
Fail: ${errors.length}
    `);

    //If there are errors print them in detail
    if(errors.length > 0) {
        console.log("--------------------BEGIN ERROR DETAILS-------------------------");
        console.log("");
        errors.forEach(function(testError){
            console.log('\x1b[31m%s\x1b[0m',testError.name);
            console.log(testError.error);
            console.log("");
        });
        console.log("");
        console.log("--------------------END ERROR DETAILS--------------------------");
    }
    console.log(`
--------------------END TEST REPORT--------------------------
    `) 
 }

 // Run all the test, collecting the errors and success
 _app.runTests = function() {
    var errors = [];
    var successes = 0;
    var limit = _app.countTests();
    var counter = 0;

    for(var key in _app.tests) {
        if(_app.tests.hasOwnProperty(key)) {
            var subTests = _app.tests[key];
            for(var testName in subTests) {
                debugger;
                if(subTests.hasOwnProperty(testName)) {
                    debugger;
                    (function() {
                        var tempTestName = testName;
                        var testValue = subTests[testName];
                        debugger;
                        // Call thet test
                        try {
                            testValue(function() {
                                // If it calls back without throwing, then its succeded than log it in green
                                console.log('\x1b[32m%s\x1b[0m', tempTestName);
                                counter++;
                                successes++;
                                if(counter == limit) {
                                    _app.produceTestReport(limit, successes, errors);
                                }
                            });
                        } catch(e) {
                            // If it throws then it failed, so capture the error and log it in red
                            errors.push({
                                'name': testName,
                                'error': e
                            });
                            console.log('\x1b[31m%s\x1b[0m', tempTestName);
                            counter++;
                            if(counter == limit) {
                                _app.produceTestReport(limit, successes, errors);
                            }
                        }
                    })();
                }
            }
        }
    }
 }

 // Run the tests
 _app.runTests();