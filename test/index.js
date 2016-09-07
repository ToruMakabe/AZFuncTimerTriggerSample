'use strict';

const azureStorage = require('azure-storage');
const myContainer = 'billingdata'
const now = new Date(Date.now());
const twoDaysAgo = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() -2));
const startDateForFileName = twoDaysAgo.getUTCFullYear() + '-' + (twoDaysAgo.getUTCMonth() +1) + '-' + twoDaysAgo.getUTCDate(); 

module.exports = (context, myTimer) => {

  const blobSvc = azureStorage.createBlobService(process.env.azfuncpoc_STORAGE);

  function createContainer () {
    return new Promise( (resolve, reject) => {
      blobSvc.createContainerIfNotExists(myContainer, (err, result, response) => {
        (!err) ? resolve() : reject(err);
      });
    });
  }

  function createOrAppendText () {
    return new Promise( (resolve, reject) => {
      blobSvc.appendFromText(myContainer, startDateForFileName + '.json', 'text to be appended', (err, result, response) => {
        if (err.statusCode == 404) {
          blobSvc.createAppendBlobFromText(myContainer, startDateForFileName + '.json', 'text to be appended', (err, result, response) => {
            (!err) ? resolve() : reject(err);
          });
        } else if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  createContainer()
    .then(createOrAppendText())
    .catch((err) => {
      context.log(err);
    })
    .then(context.done());

}
