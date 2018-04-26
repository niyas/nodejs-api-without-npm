/**
 * This is a library that demonstrates something throwing when its init is called
 */

 //Container
 var example = {};

 example.init = function() {
     //This is an error created intentionally(bar is nit defined)
     var foo = bar;
 }

 //Export
 module.exports = example;