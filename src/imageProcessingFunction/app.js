const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const sharp = require('sharp');

exports.handler = async (event) => {
  try {
    const bucket = event.Records[0].s3.bucket.name;
    const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
    
    // Only process files in the originals/ directory
    if (!key.startsWith('originals/')) {
      console.log('Skipping processing for non-original image:', key);
      return;
    }
    
    // Download the image from S3
    const inputParams = { Bucket: bucket, Key: key };
    const inputData = await s3.getObject(inputParams).promise();
    
    // Process image to create different sizes
    const sizes = {
      thumbnail: 150,
      medium: 800,
      large: 1600
    };
    
    const fileName = key.split('/').pop();
    const promises = [];
    
    for (const [size, width] of Object.entries(sizes)) {
      const image = sharp(inputData.Body)
        .resize(width, null, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: 80 });
      
      const buffer = await image.toBuffer();
      
      const uploadParams = {
        Bucket: bucket,
        Key: `${size}/${fileName}`,
        Body: buffer,
        ContentType: 'image/jpeg'
      };
      
      promises.push(s3.putObject(uploadParams).promise());
    }
    
    await Promise.all(promises);
    
    console.log('Successfully processed image:', key);
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Image processed successfully' })
    };
  } catch (error) {
    console.error('Error processing image:', error);
    throw error;
  }
};
