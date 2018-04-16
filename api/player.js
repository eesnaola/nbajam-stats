'use strict';

const uuid = require('uuid');
const AWS = require('aws-sdk');
const querystring = require('querystring');
AWS.config.setPromisesDependency(require('bluebird'));
const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.create = (event, context, callback) => {
  const requestBody = querystring.parse(event.body);
  const nickname = requestBody.nickname;

  if (typeof nickname !== 'string') {
    console.error('Validation Failed');
    callback(new Error('Couldn\'t submit palyer because of validation errors.'));
    return;
  }

  submitPlayer(playerInfo(nickname))
    .then(res => {
      callback(null, {
        statusCode: 200,
        body: JSON.stringify({
          message: `Sucessfully submitted player with nickname ${nickname}`,
          playerId: res.id
        })
      });
    })
    .catch(err => {
      console.log(err);
      callback(null, {
        statusCode: 500,
        body: JSON.stringify({
          message: `Unable to submit player with nickname ${nickname}`
        })
      })
    });
};


const submitPlayer = player => {
  console.log('Submitting player');
  const playerInfo = {
    TableName: process.env.PLAYER_TABLE,
    Item: player,
  };
  return dynamoDb.put(playerInfo).promise()
    .then(res => player);
};

const playerInfo = (nickname) => {
  return {
    id: uuid.v1(),
    nickname: nickname,
  };
};


module.exports.list = (event, context, callback) => {
    var params = {
        TableName: process.env.PLAYER_TABLE,
        ProjectionExpression: "id, nickname, image"
    };

    console.log("Scanning Player table.");
    const onScan = (err, data) => {
        if (err) {
            console.log('Scan failed to load data. Error JSON:', JSON.stringify(err, null, 2));
            callback(err);
        } else {
            console.log("Scan succeeded.");
            return callback(null, {
                statusCode: 200,
                body: JSON.stringify({
                    players: data.Items
                })
            });
        }
    };

    dynamoDb.scan(params, onScan);

};


module.exports.update = (event, context, callback) => {
  const body = querystring.parse(event.body);

  // validation
  if (typeof body.nickname !== 'string') {
    console.error('Validation Failed');
    callback(new Error('Couldn\'t update the todo item.'));
    return;
  }

  const params = {
    TableName: process.env.PLAYER_TABLE,
    Key: {
      id: event.pathParameters.id,
    },
    ExpressionAttributeValues: {
      ':nickname': body.nickname,
    },
    UpdateExpression: 'SET nickname = :nickname',
    ReturnValues: 'ALL_NEW',
  };

  // update the todo in the database
  dynamoDb.update(params, (error, result) => {
    // handle potential errors
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


module.exports.delete = (event, context, callback) => {
  const params = {
    TableName: process.env.PLAYER_TABLE,
    Key: {
      id: event.pathParameters.id,
    },
  };

  // delete the todo from the database
  dynamoDb.delete(params, (error) => {
    // handle potential errors
    if (error) {
      console.error(error);
      callback(new Error('Couldn\'t remove the todo item.'));
      return;
    }

    // create a response
    const response = {
      statusCode: 200,
    };
    callback(null, response);
  });
};
