const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const { v4: uuidv4 } = require('uuid');

exports.handler = async (event) => {
  try {
    // Extract file info from query parameters
    const contentType = event.queryStringParameters?.contentType || 'image/jpeg';
    const extension = contentType.split('/')[1] || 'jpg';
    
    // Generate unique filename
    const fileName = `${uuidv4()}.${extension}`;
    const bucketName = process.env.IMAGE_BUCKET;
    
    // Generate pre-signed URL
    const params = {
      Bucket: bucketName,
      Key: `originals/${fileName}`,
      Expires: 300, // URL valid for 5 minutes
      ContentType: contentType
    };
    
    const uploadUrl = await s3.getSignedUrlPromise('putObject', params);
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({
        uploadUrl,
        fileName,
        key: `originals/${fileName}`
      })
    };
  } catch (error) {
    console.error('Error generating pre-signed URL:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({ error: 'Failed to generate upload URL' })
    };
  }
};
