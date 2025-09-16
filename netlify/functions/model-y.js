exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const requestBody = JSON.parse(event.body);

    let text, duration = 60, sample_rate = 32000;

    if (requestBody.input && requestBody.input.text) {
      text = requestBody.input.text;
      duration = requestBody.input.duration || 60;
      sample_rate = requestBody.input.sample_rate || 32000;
    } else {
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

    // Call RunPod API (Model Y)
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

    if (!response.ok) {
      const errorText = await response.text();
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: `RunPod API error: ${response.status} - ${errorText}` })
      };
    }

    const result = await response.json();

    if (result.error) {
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: result.error })
      };
    }

    // Convert base64 into a Data URI for frontend playback
    const audioUrl = `data:audio/wav;base64,${result.audio_base64}`;

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        audioUrl,
        sample_rate: result.sample_rate,
        format: result.format
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: error.message })
    };
  }
};
