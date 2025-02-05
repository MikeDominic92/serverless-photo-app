const { S3Client } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');

const s3Client = new S3Client();

exports.handler = async (event) => {
  try {
    // Extract file info from query parameters
    const contentType = event.queryStringParameters?.contentType || 'image/jpeg';
    const extension = contentType.split('/')[1] || 'jpg';
    
    // Generate unique filename
    const fileName = `${uuidv4()}.${extension}`;
    const bucketName = process.env.IMAGE_BUCKET;
    
    // Generate pre-signed URL
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: `originals/${fileName}`,
      ContentType: contentType
    });
    
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 }); // URL valid for 5 minutes
    
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
