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

  // List all logs and optionally include the compressed logs
  lib.list = function(includeCompressedLogs, callback) {
      fs.readdir(lib.baseDir, function(err, data) {
          if(!err && data) {
            var trimmedFileNames = [];
            data.forEach(function(fileName) {
                // Add the .log file
                if(fileName.indexOf('.log') > -1) {
                    trimmedFileNames.push(fileName.replace('.log',''));
                }

                // Add to .gz files
                if(fileName.indexOf('.gz.b64') > -1) {
                    trimmedFileNames.push(fileName.replace('.gz.b64', ''));
                }
            });
            callback(false, trimmedFileNames);
          } else {
            callback(err, data)
          }
      });
  }

  // Copress the on .log file into a .gz.b64 file within the same directory
  lib.compress = function(logId, newFileId, callback) {
      var sourceFile = logId + '.log';
      var destFile = newFileId + '.gz.b64';

      // Read the source file
      fs.readFile(lib.baseDir + sourceFile, 'utf8', function(err, inputString) {
        if(!err && inputString) {
            // Compress the data using gzip
            zlib.gzip(inputString, function(err, buffer) {
                if(!err && buffer) {
                    // Send the data to the destination file
                    fs.open(lib.baseDir + destFile, 'wx', function(err, fileDescriptor) {
                        if(!err && fileDescriptor) {
                            // Write to the destination file
                            fs.writeFile(fileDescriptor, buffer.toString('base64'), function(err) {
                                if(!err) {
                                    // Close the destination file
                                    fs.close(fileDescriptor, function(err) {
                                        if(!err) {
                                            callback(false);
                                        } else {
                                            callback(err);
                                        }
                                    })
                                } else {
                                    callback(err);
                                }
                            })
                        } else {
                            callback(err);
                        }
                    });
                } else {
                    callback(err);
                }
            });
        } else {
            callback(err);
        }
      });
  };

  // De-compress the contents of a .gz.b64 file into a string variable
  lib.decompress = function(fileId, callback) {
      var fileName = fileId + '.gz.b64';
      fs.readFile(lib.baseDir + fileName, 'utf8', function(err, str) {
        if(!err && str) {
            // Decompress the data
            var inputBuffer = Buffer.from(str, 'base64');
            zlib.unzip(inputBuffer, function(err, outputBuffer) {
                if(!err && outputBuffer) {
                    // callback
                    var str = outputBuffer.toString();
                    callback(false, str);
                } else {
                    callback(err);
                }
            });
        } else {
            callback(err);
        }
      });
  };

  // Truncate the log file
  lib.truncate = function(logId, callback) {
      fs.truncate(lib.baseDir + logId + '.log', 0, function(err) {
          if(!err) {
            callback(false);
          } else {
              callback(err);
          }
      });
  }
 


 // Export the module
 module.exports = lib;