const fs = require('fs');
const path = require('path');
const os = require('os');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const fileId = event.path.split('/').pop();
    // Use os.tmpdir() to match the path used in model-y-status.js
    const filePath = path.join(os.tmpdir(), `${fileId}.wav`);
    
    console.log('Looking for file at:', filePath);
    
    if (!fs.existsSync(filePath)) {
      console.log('File not found at:', filePath);
      return {
        statusCode: 404,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'File not found or expired' })
      };
    }
    
    const audioBuffer = fs.readFileSync(filePath);
    console.log('File found and read, size:', audioBuffer.length);
    
    // Clean up file after reading
    fs.unlinkSync(filePath);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Disposition': `attachment; filename="generated-music-${fileId}.wav"`,
        'Access-Control-Allow-Origin': '*',
        'Content-Length': audioBuffer.length.toString()
      },
      body: audioBuffer.toString('base64'),
      isBase64Encoded: true
    };
  } catch (error) {
    console.error('Download error:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: error.message })
    };
  }
};