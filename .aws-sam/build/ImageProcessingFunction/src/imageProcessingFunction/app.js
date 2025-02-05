const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const sharp = require('sharp');

const s3Client = new S3Client();

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
    const getCommand = new GetObjectCommand({ Bucket: bucket, Key: key });
    const { Body: inputData } = await s3Client.send(getCommand);
    
    // Convert the readable stream to a buffer
    const chunks = [];
    for await (const chunk of inputData) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    
    // Process image to create different sizes
    const sizes = {
      thumbnail: 150,
      medium: 800,
      large: 1600
    };
    
    const fileName = key.split('/').pop();
    const promises = [];
    
    for (const [size, width] of Object.entries(sizes)) {
      const image = sharp(buffer)
        .resize(width, null, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: 80 });
      
      const processedBuffer = await image.toBuffer();
      
      const putCommand = new PutObjectCommand({
        Bucket: bucket,
        Key: `${size}/${fileName}`,
        Body: processedBuffer,
        ContentType: 'image/jpeg'
      });
      
      promises.push(s3Client.send(putCommand));
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
