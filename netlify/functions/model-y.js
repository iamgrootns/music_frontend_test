export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const { input } = body;
    const text = input?.text || body.text;
    const duration = input?.duration || body.duration || 60;
    const sample_rate = input?.sample_rate || body.sample_rate || 32000;

    if (!text) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "No text prompt provided" }),
      };
    }

    const response = await fetch(`${process.env.RUNPOD_ENDPOINT_Y}/run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RUNPOD_API_KEY}`,
      },
      body: JSON.stringify({ input: { text, duration, sample_rate } }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        statusCode: 500,
        body: JSON.stringify({ error: `RunPod API error: ${errorText}` }),
      };
    }

    const result = await response.json();
    return {
      statusCode: 200,
      body: JSON.stringify({ id: result.id }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
