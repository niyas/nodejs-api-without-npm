/**
 * This is a library for storing and rotating logs
 */

 var fs = require('fs');
 var path = require('path');
 var zlib = require('zlib');

 var lib = {};

  // Base directory of the logs folder
  lib.baseDir = path.join(__dirname,'/../.logs/');

  // Append the sting to the file if the file exist, or create a new file and write the logs
  lib.append = function(file, str, callback) {
      // Openthe file for appending
      fs.open(lib.baseDir + file + '.log', 'a', function(err, fileDescriptor) {
        if(!err && fileDescriptor) {
            // Appeend to the file and close it
            fs.appendFile(fileDescriptor, str + '\n', function(err) {
                if(!err) {
                    fs.close(fileDescriptor, function(err) {
                        if(!err) {
                            callback(false);
                        } else {
                            callback('Error closing file that was being appended');
                        }
                    });
                } else {
                    callback('Error appending file');
                }
            });
        } else {
            callback('Could not open file for append');
        }
      });
  }



 // Export the module
 module.exports = lib;