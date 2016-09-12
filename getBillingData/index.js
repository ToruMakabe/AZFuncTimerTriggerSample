'use strict';

const azureStorage = require('azure-storage');
const msRestAzure = require('ms-rest-azure');
const commerce = require('azure-arm-commerce');
const url = require('url');
const async = require('async');
const util = require('util');

const clientId = process.env.CLIENT_ID;
const domain = process.env.DOMAIN;
const secret = process.env.APPLICATION_SECRET;
const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID;

const now = new Date(Date.now());
const twoDaysAgo = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() -2));
const yesterday =  new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() -1));
const startDateForFileName = twoDaysAgo.getUTCFullYear() + '-' + (twoDaysAgo.getUTCMonth() +1) + '-' + twoDaysAgo.getUTCDate(); 
const startDate = twoDaysAgo.toISOString();
const endDate = yesterday.toISOString();
const aggregationGranularity = 'Daily';
const showDetails = true;

const myContainerName = 'billingdata';
const blobSvc = azureStorage.createBlobService(process.env.azfuncpoc_STORAGE);

//Main flow
module.exports = (context, myTimer) => {

  msRestAzure.loginWithServicePrincipalSecret(clientId, secret, domain, (err, credentials) => {
    if (err) return context.log(err);
    credentials.subscriptionId = subscriptionId;

    async.series([
      function (callback) {
        context.log('Creatig a container...');
        createContainer((err, result) => {
          if (err) return callback(err);
          context.log('Created container: ' + result);
          callback(null);
        });
      },
      function (callback) {
        context.log('Getting bliing data...');
        getUsageLoop(credentials, (err, index) => {
          if (err) return callback(err);
          context.log('Created ' + index + ' file(s)');
          callback(null);
        });
      }
    ],
    function (err) {
      if (err) {
        context.log(util.format('Error occurred in one of the operations.\n%s', 
            util.inspect(err, { depth: null })));
      }
      context.log('Done.');
      context.done();
    });

  });

};


// functions
function createContainer(callback) {
  blobSvc.createContainerIfNotExists(myContainerName, (err, result, response) => {
    if (err) return callback(err);
    return callback(null, result.created);
  });
}

function createUsageBlob (usageAggregates, index, callback) {
  blobSvc.createBlockBlobFromText(myContainerName, startDateForFileName + '_' + index + '.json', usageAggregates, (err, result, response) => {
    if (err) return callback(err); 
    return callback(null);
  });
}

function getUsage(credentials, continuationToken, index, callback) {
  const client =  commerce.createUsageAggregationManagementClient(credentials);

  client.usageAggregates.get(startDate, endDate, aggregationGranularity, showDetails, continuationToken, (err, response) => {
    if (err) return callback(err);
    if (response.nextLink) {
      continuationToken = url.parse(response.nextLink, true).query.continuationToken;
    } else {
      continuationToken = null;
    }
    
    const usageAggregates = JSON.stringify(response.usageAggregations);
    createUsageBlob(usageAggregates, index, (err) => {
      if (err) return callback(err);
      return callback(null, continuationToken);
    });
  });
}

function getUsageLoop(credentials, callback){
  function iterate(credentials, continuationToken, index){
    getUsage(credentials, continuationToken, index, (err, continuationToken) => {
      if (err) {
        return callback(err);
      }
      if (continuationToken === null) {
        return callback(null, index);
      }
      iterate(credentials, continuationToken, index +1);
    });
  }
  let continuationToken;
  iterate(credentials, continuationToken, 1);
}