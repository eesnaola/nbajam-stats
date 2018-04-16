'use strict';

const uuid = require('uuid');
const AWS = require('aws-sdk');
const querystring = require('querystring');
AWS.config.setPromisesDependency(require('bluebird'));
const dynamoDb = new AWS.DynamoDB.DocumentClient();
var S3 = new AWS.S3({ params: {Bucket: process.env.BUCKET} });
var urlPrefix = `https://${process.env.BUCKET}.s3.amazonaws.com/`;


module.exports.handler = function (event, context, callback) {
  const body = querystring.parse(event.body);
  var key = 'profile/' + String(Date.now()) + '.jpg';
  var buf = new Buffer(body.image,'base64');

  const params = {
    Key: key,
    Body: buf,
    ContentEncoding: 'base64',
    ContentType: 'image/jpeg',
    ACL: 'public-read'
  };

  S3.putObject(params, function(err, url){
    if (err) {
      console.log('Error uploading data: ', err);
    } else {
      console.log('succesfully uploaded the image!');
    }
  });

  const paramsDb = {
    TableName: process.env.PLAYER_TABLE,
    Key: {
      id: event.pathParameters.id,
    },
    ExpressionAttributeValues: {
      ':image': urlPrefix + key,
      ':s3_key': key,
    },
    UpdateExpression: 'SET image = :image, s3_key = :s3_key',
    ReturnValues: 'ALL_NEW',
  };


  dynamoDb.update(paramsDb, (error, result) => {
    if (error) {
      console.error(error);
      callback(new Error('Couldn\'t update the todo item.'));
      return;
    }

    // create a response
    const response = {
      statusCode: 200,
      body: JSON.stringify(result.Attributes),
    };
    callback(null, response);
  });

};
