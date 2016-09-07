'use strict';

const now = new Date(Date.now());

module.exports = function (context, myTimer, myOutputBlob) {

  context.log('Starting...: ', now);

  myOutputBlob = 'test' ;
   
  context.done();
};
