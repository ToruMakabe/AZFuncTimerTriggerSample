'use strict';

const azureStorage = require('azure-storage');
const msRestAzure = require('ms-rest-azure');
const commerce = require('azure-arm-commerce');
const url = require('url');

const clientId = process.env['CLIENT_ID'];
const domain = process.env['DOMAIN'];
const secret = process.env['APPLICATION_SECRET'];
const subscriptionId = process.env['AZURE_SUBSCRIPTION_ID'];

const now = new Date(Date.now());
const twoDaysAgo = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() -2));
const yesterday =  new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() -1));
const startDateForFileName = twoDaysAgo.getUTCFullYear() + '-' + (twoDaysAgo.getUTCMonth() +1) + '-' + twoDaysAgo.getUTCDate(); 
const startDate = twoDaysAgo.toISOString();
const endDate = yesterday.toISOString();
const aggregationGranularity = 'Daily';
const showDetails = true;

const myContainer = 'billingdata'
const blobSvc = azureStorage.createBlobService(process.env.azfuncpoc_STORAGE);

module.exports = (context, myTimer, myOutputBlob) => {

  msRestAzure.loginWithServicePrincipalSecret(clientId, secret, domain, (err, credentials) => {
    if (err) context.log(err);
    credentials.subscriptionId = subscriptionId;
    const client =  commerce.createUsageAggregationManagementClient(credentials);
    var continuationToken = null;

    function createContainer () {
      return new Promise( (resolve, reject) => {
        blobSvc.createContainerIfNotExists(myContainer, (err, result, response) => {
          (!err) ? resolve() : reject(err);
        });
      });
    }

    function getUsage() {
      return new Promise( (resolve, reject) => {
        client.usageAggregates.get(startDate, endDate, aggregationGranularity, showDetails, continuationToken,  (err, response) => {
          if (err) reject(err);
      
          if (response.nextLink) {
            continuationToken = url.parse(response.nextLink, true).query.continuationToken;
          } else {
            continuationToken = null;
          }
   
          resolve(response.usageAggregations);
      
        });
      });
    }

    function createOrAppendText (usageAggregations) {
      return new Promise( (resolve, reject) => {
        blobSvc.appendFromText(myContainer, startDateForFileName + '.json', usageAggregations, (err, result, response) => {
          if (err.statusCode == 404) {
            blobSvc.createAppendBlobFromText(myContainer, startDateForFileName + '.json', usageAggregations, (err, result, response) => {
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

    const promise = (function loop() {
      return createContainer()
        .then(getUsage())
        .then(() => {
          if (continuationToken) {
            return createOrAppendText(usageAggregations).then(loop);
          } else {
            return createOrAppendText(usageAggregations);
          }
        })
        .catch((err) => {
          context.log(err);
        });
    })();

    promise.then( () => {
      context.log('Getting bliing info completed');
    });

  });
   
  context.done();
};
