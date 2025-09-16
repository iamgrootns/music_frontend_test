const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const taskId = event.path.split('/').pop();
    
    console.log('Checking status for task ID:', taskId);
    console.log('Environment check:', {
      hasEndpoint: !!process.env.RUNPOD_ENDPOINT_Y,
      hasApiKey: !!process.env.RUNPOD_API_KEY,
      endpointUrl: process.env.RUNPOD_ENDPOINT_Y
    });
    
    const statusUrl = `${process.env.RUNPOD_ENDPOINT_Y}/status/${taskId}`;
    console.log('Fetching status from:', statusUrl);
    
    const response = await fetch(statusUrl, {
      headers: {
        'Authorization': `Bearer ${process.env.RUNPOD_API_KEY}`
      }
    });

    console.log('RunPod status response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log('RunPod status error response:', errorText);
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ 
          error: `RunPod status API error: ${response.status} - ${errorText}` 
        })
      };
    }

    const result = await response.json();
    console.log('RunPod status result:', result);
    
    // If completed and has large audio data
    if (result.status === 'COMPLETED' && result.output?.audio_base64) {
      console.log('Processing completed audio, size:', result.output.audio_base64.length);
      
      // Generate unique filename
      const fileId = crypto.randomUUID();
      const fileName = `${fileId}.wav`;
      
      // Use the correct temporary directory
      const tempDir = os.tmpdir();
      const filePath = path.join(tempDir, fileName);
      
      console.log('Saving audio to:', filePath);
      
      try {
        // Save audio to temporary file
        const audioBuffer = Buffer.from(result.output.audio_base64, 'base64');
        fs.writeFileSync(filePath, audioBuffer);
        console.log('Audio file saved:', filePath, 'Size:', audioBuffer.length);
        
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
        console.error('File processing error:', fileError);
        return {
          statusCode: 500,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ error: `File processing error: ${fileError.message}` })
        };
      }
    }
    
    // For other statuses, return as-is
    console.log('Returning status as-is:', result.status);
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(result)
    };
  } catch (error) {
    console.error('Status function error:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: error.message })
    };
  }
};