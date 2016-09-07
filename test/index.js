'use strict';

const now = new Date(Date.now());

module.exports = function (context, myTimer, myOutputBlob) {

  context.log('Starting... ', now);

  context.log('myTimer binsing is... ', myTimer);

  context.log('Before copying... ', myOutputBlob);

  myOutputBlob = 'test' ;
  context.log('After copying... ', myOutputBlob);
   
  context.done();
};
