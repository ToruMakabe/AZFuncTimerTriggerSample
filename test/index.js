'use strict';

const azureStorage = require('azure-storage');
const myContainer = 'billingdata'
const now = new Date(Date.now());
const twoDaysAgo = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() -2));
const startDateForFileName = twoDaysAgo.getUTCFullYear() + '-' + (twoDaysAgo.getUTCMonth() +1) + '-' + twoDaysAgo.getUTCDate(); 

module.exports = function (context, myTimer) {

  const blobSvc = azureStorage.azure.createBlobService(process.env.azfuncpoc_STORAGE);
  blobSvc.createContainerIfNotExists(myContainer, function(err, result, response){
    if(err) context.log(err);
  });

  blobSvc.appendFromText(myContainer, startDateForFileName + '.json', 'text to be appended', function(err, result, response){
    if(!err) context.log(err);
  });

  context.done();
};
