'use strict';

const now = new Date(Date.now());

module.exports = function (context, myTimer, myOutputBlob) {

  context.log('Starting... ', now);

  context.log('My contexts are... ', context);

  context.log('Before copying... ', myOutputBlob);

  myOutputBlob = 'test' ;
  context.log('After copying... ', myOutputBlob);
   
  context.done();
};
