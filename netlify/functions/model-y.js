const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const requestBody = JSON.parse(event.body);
    
    // Handle both direct format and input wrapper format
    let text, duration = 60, sample_rate = 32000;
    
    if (requestBody.input && requestBody.input.text) {
      // Frontend sends { input: { text: "prompt" } }
      text = requestBody.input.text;
      duration = requestBody.input.duration || 60;
      sample_rate = requestBody.input.sample_rate || 32000;
    } else {
      // Direct format { text: "prompt", duration: 60, sample_rate: 32000 }
      text = requestBody.text;
      duration = requestBody.duration || 60;
      sample_rate = requestBody.sample_rate || 32000;
    }
    
    if (!text) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'No text prompt provided' })
      };
    }
    
    // Log environment variables (without exposing sensitive data)
    console.log('Environment check:', {
      hasEndpoint: !!process.env.RUNPOD_ENDPOINT_Y,
      hasApiKey: !!process.env.RUNPOD_API_KEY,
      endpointUrl: process.env.RUNPOD_ENDPOINT_Y,
      receivedText: text
    });
    
    // Call RunPod API
    const response = await fetch(`${process.env.RUNPOD_ENDPOINT_Y}/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RUNPOD_API_KEY}`
      },
      body: JSON.stringify({
        input: { text, duration, sample_rate }
      })
    });

    console.log('RunPod response status:', response.status);
    console.log('RunPod response headers:', Object.fromEntries(response.headers));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('RunPod error response:', errorText);
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ 
          error: `RunPod API error: ${response.status} - ${errorText}` 
        })
      };
    }

    const result = await response.json();
    console.log('RunPod success response:', result);
    
    if (result.error) {
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: result.error })
      };
    }

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ id: result.id })
    };
  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: error.message })
    };
  }
};