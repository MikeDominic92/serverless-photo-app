const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  DeleteCommand,
  ScanCommand
} = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);

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
          const getCommand = new GetCommand({
            TableName: tableName,
            Key: {
              id: event.pathParameters.id
            }
          });
          
          const { Item } = await dynamodb.send(getCommand);
          return {
            statusCode: Item ? 200 : 404,
            headers,
            body: JSON.stringify(Item || { message: 'Image not found' })
          };
        } else {
          // List all images metadata
          const scanCommand = new ScanCommand({
            TableName: tableName,
            Limit: 50 // Limit results to prevent large responses
          });
          
          const { Items } = await dynamodb.send(scanCommand);
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(Items)
          };
        }
        
      case 'POST':
        const item = JSON.parse(event.body);
        const putCommand = new PutCommand({
          TableName: tableName,
          Item: {
            id: item.id,
            fileName: item.fileName,
            uploadedAt: new Date().toISOString(),
            sizes: item.sizes || ['thumbnail', 'medium', 'large'],
            metadata: item.metadata || {}
          }
        });
        
        await dynamodb.send(putCommand);
        return {
          statusCode: 201,
          headers,
          body: JSON.stringify(putCommand.input.Item)
        };
        
      case 'DELETE':
        if (!event.pathParameters?.id) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ message: 'Missing image ID' })
          };
        }
        
        const deleteCommand = new DeleteCommand({
          TableName: tableName,
          Key: {
            id: event.pathParameters.id
          }
        });
        
        await dynamodb.send(deleteCommand);
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
