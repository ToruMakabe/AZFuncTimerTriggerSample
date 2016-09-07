'use strict';

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


module.exports = function (context, myTimer, myOutputBlob) {

  context.log('Getting Billing Data: ', now);

  msRestAzure.loginWithServicePrincipalSecret(clientId, secret, domain, function (err, credentials) {
    if (err) return console.log(err);
    credentials.subscriptionId = subscriptionId;
    const client =  commerce.createUsageAggregationManagementClient(credentials);
    var continuationToken = null;

    function getUsage(continuationToken, callback) {
    
      client.usageAggregates.get(startDate, endDate, aggregationGranularity, showDetails, continuationToken,    function (err, response) {
        if (err) return console.log(err);
    
        if (response.nextLink) {
          continuationToken = url.parse(response.nextLink, true).query.continuationToken;
        } else {
          continuationToken = null;
        }
    
      response.usageAggregations.forEach(function(element) {
    //          console.log(element.properties.meterName);
             console.log(element);
      }, this);
  
        callback(continuationToken); 
    
      });
    }

    function loop(continuationToken) {
      getUsage(continuationToken, function(continuationToken) {
        if (continuationToken !== null) loop(continuationToken);
        else return;
      });
    }

    loop(continuationToken);

  });
   
  context.done();
};
