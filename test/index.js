'use strict';

const now = new Date(Date.now());

module.exports = function (context, myTimer) {

  context.log('Starting... ', now);

  context.log('My contexts are... ', context);

  context.log('My connection 1 is...', process.env.AzureWebJobsStorage);
  context.log('My connection 2 is...', process.env.azfuncpoc_STORAGE);
   
  context.done();
};
