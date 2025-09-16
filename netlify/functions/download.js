const fs = require('fs');
const path = require('path');
const os = require('os');

exports.handler = async (event, context) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'GET') {
    return { 
      statusCode: 405, 
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: 'Method Not Allowed' 
    };
  }

  try {
    const fileId = event.path.split('/').pop();
    console.log('Download request for fileId:', fileId);
    
    // Since Netlify Functions are stateless, we need to fetch the audio from RunPod again
    // The fileId should be the RunPod job ID
    const runpodUrl = `https://api.runpod.ai/v2/${process.env.RUNPOD_ENDPOINT_ID}/status/${fileId}`;
    
    console.log('Fetching from RunPod:', runpodUrl);
    
    const response = await fetch(runpodUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.RUNPOD_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('RunPod API error:', response.status);
      return {
        statusCode: 404,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Audio file not found or expired' })
      };
    }

    const result = await response.json();
    console.log('RunPod result status:', result.status);
    
    if (result.status !== 'COMPLETED' || !result.output?.audio_base64) {
      return {
        statusCode: 404,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Audio file not ready or not found' })
      };
    }
    
    const audioBuffer = Buffer.from(result.output.audio_base64, 'base64');
    console.log('Audio buffer size:', audioBuffer.length);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'audio/wav',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Expose-Headers': 'Content-Length, Content-Type',
        'Cache-Control': 'public, max-age=3600',
        'Content-Length': audioBuffer.length.toString(),
        'Accept-Ranges': 'bytes'
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