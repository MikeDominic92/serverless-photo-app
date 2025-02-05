const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': true
  };
  
  try {
    const tableName = process.env.METADATA_TABLE;
    const method = event.httpMethod;
    const path = event.path;
    
    switch (method) {
      case 'GET':
        if (event.pathParameters?.id) {
          // Get single image metadata
          const getParams = {
            TableName: tableName,
            Key: {
              id: event.pathParameters.id
            }
          };
          
          const item = await dynamodb.get(getParams).promise();
          return {
            statusCode: item.Item ? 200 : 404,
            headers,
            body: JSON.stringify(item.Item || { message: 'Image not found' })
          };
        } else {
          // List all images metadata
          const queryParams = {
            TableName: tableName,
            Limit: 50 // Limit results to prevent large responses
          };
          
          const data = await dynamodb.scan(queryParams).promise();
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(data.Items)
          };
        }
        
      case 'POST':
        const item = JSON.parse(event.body);
        const putParams = {
          TableName: tableName,
          Item: {
            id: item.id,
            fileName: item.fileName,
            uploadedAt: new Date().toISOString(),
            sizes: item.sizes || ['thumbnail', 'medium', 'large'],
            metadata: item.metadata || {}
          }
        };
        
        await dynamodb.put(putParams).promise();
        return {
          statusCode: 201,
          headers,
          body: JSON.stringify(putParams.Item)
        };
        
      case 'DELETE':
        if (!event.pathParameters?.id) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ message: 'Missing image ID' })
          };
        }
        
        const deleteParams = {
          TableName: tableName,
          Key: {
            id: event.pathParameters.id
          }
        };
        
        await dynamodb.delete(deleteParams).promise();
        return {
          statusCode: 204,
          headers
        };
        
      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ message: 'Method not allowed' })
        };
    }
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Internal server error' })
    };
  }
};
