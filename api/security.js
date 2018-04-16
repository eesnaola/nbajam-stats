'use strict';

const generatePolicy = function(principalId, effect, resource) {
  const authResponse = {};
  authResponse.principalId = principalId;
  if (effect && resource) {
    const policyDocument = {};
    policyDocument.Version = '2012-10-17';
    policyDocument.Statement = [];
    const statementOne = {};
    statementOne.Action = 'execute-api:Invoke';
    statementOne.Effect = effect;
    statementOne.Resource = resource;
    policyDocument.Statement[0] = statementOne;
    authResponse.policyDocument = policyDocument;
  }
  // authResponse.context = {};
  // authResponse.context.stringKey = "stringval";
  // authResponse.context.numberKey = 123;
  // authResponse.context.booleanKey = true;
  return authResponse;
};

module.exports.test = (event, context, callback) => {
   const body = {
     test: event.requestContext.authorizer.principalId,
     message: 'Successs - Profile Retrieved!',
     input: event,
   };

   const response = {
     statusCode: 200,
     body: JSON.stringify(body),
   };

   callback(null, response);
};

module.exports.auth = (event, context, callback) => {
  var token = event.authorizationToken;
  console.log(event.methodArn);
    switch (token) {
      case 'allow':
        callback(null, generatePolicy('testerino', 'Allow', event.methodArn));
        break;
      case 'deny':
        callback(null, generatePolicy('user', 'Deny', event.methodArn));
        break;
      case 'unauthorized':
        callback('Unauthorized');
        break;
      default:
        callback('Error: Invalid token');
    }
};
