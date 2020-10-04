// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');
var attr = require('dynamodb-data-types').AttributeValue;
// Set the region
AWS.config.update({ region: 'INSERT_REGION_NAME' });
let data = require(process.argv[2]);
// Create DynamoDB service object
var ddb = new AWS.DynamoDB({ apiVersion: '2012-08-10' });
let items = [];
for (let index = 0; index < data.length; index++) {
    const element = data[index];
    let item = {
        PutRequest: {
            Item: attr.wrap(element)
        }
    };
    items.push(item);
    if (items.length == 25 || index == data.length-1) {
        let params = {
            RequestItems: {
                "INSERT_TABLE_NAME": items
            }
        }
        ddb.batchWriteItem(params, function (err, data) {
            if (err) {
                console.log("Error", err);
            } else {
                console.log("Success", data);
            }
        });
        items = []
    }
}