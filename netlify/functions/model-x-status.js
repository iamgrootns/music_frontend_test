const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const taskId = event.path.split('/').pop();
    console.log('Model X - Checking status for task ID:', taskId);
    
    // Log environment variables (without exposing sensitive data)
    console.log('Model X Environment check:', {
      hasEndpoint: !!process.env.RUNPOD_ENDPOINT_X,
      hasApiKey: !!process.env.RUNPOD_API_KEY,
      endpointUrl: process.env.RUNPOD_ENDPOINT_X
    });
    
    const statusUrl = `${process.env.RUNPOD_ENDPOINT_X}/status/${taskId}`;
    console.log('Model X - Fetching status from:', statusUrl);
    
    const response = await fetch(statusUrl, {
      headers: {
        'Authorization': `Bearer ${process.env.RUNPOD_API_KEY}`
      }
    });

    console.log('Model X RunPod status response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Model X RunPod status error:', errorText);
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: `RunPod status error: ${response.status}` })
      };
    }

    const result = await response.json();
    console.log('Model X RunPod status result:', result);
    
    // If completed and has large audio data
    if (result.status === 'COMPLETED' && result.output?.audio_base64) {
      try {
        console.log('Model X - Processing completed audio, size:', result.output.audio_base64.length);
        
        // Generate unique filename
        const fileId = crypto.randomUUID();
        const fileName = `${fileId}.wav`;
        
        // Use os.tmpdir() for cross-platform compatibility
        const tempDir = os.tmpdir();
        const filePath = path.join(tempDir, fileName);
        
        console.log('Model X - Saving audio to:', filePath);
        
        // Ensure temp directory exists
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        
        // Save audio to temporary file
        const audioBuffer = Buffer.from(result.output.audio_base64, 'base64');
        fs.writeFileSync(filePath, audioBuffer);
        
        console.log('Model X - Audio file saved:', filePath, 'Size:', audioBuffer.length);
        
        // Return download URL instead of large data
        return {
          statusCode: 200,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({
            status: 'COMPLETED',
            output: {
              download_url: `/.netlify/functions/download/${fileId}`,
              sample_rate: result.output.sample_rate,
              format: result.output.format,
              file_size: audioBuffer.length
            }
          })
        };
      } catch (fileError) {
        console.error('Model X - File processing error:', fileError);
        return {
          statusCode: 500,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ error: `File processing error: ${fileError.message}` })
        };
      }
    }
    
    // For other statuses, return as-is
    console.log('Model X - Returning status as-is:', result.status);
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(result)
    };
  } catch (error) {
    console.error('Model X - Status function error:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: error.message })
    };
  }
};