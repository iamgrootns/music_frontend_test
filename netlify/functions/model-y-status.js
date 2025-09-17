export async function handler(event, context) {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const taskId = event.path.split("/").pop();
    const statusUrl = `${process.env.RUNPOD_ENDPOINT_Y}/status/${taskId}`;

    const response = await fetch(statusUrl, {
      headers: { Authorization: `Bearer ${process.env.RUNPOD_API_KEY}` },
    });

    if (!response.ok) {
      return {
        statusCode: 500,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: `RunPod status error: ${response.status}` }),
      };
    }

    const result = await response.json();

    // ✅ Return audio inline instead of writing temp files
    if (result.status === "COMPLETED" && result.output?.audio_base64) {
      return {
        statusCode: 200,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({
          status: "COMPLETED",
          output: {
            audio_base64: result.output.audio_base64,
            sample_rate: result.output.sample_rate,
            format: result.output.format,
          },
        }),
      };
    }

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(result),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: error.message }),
    };
  }
}
