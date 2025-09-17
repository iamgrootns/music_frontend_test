import fs from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";

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

    // ✅ Only return immediately (never block >1s)
    if (result.status === "COMPLETED" && result.output?.audio_base64) {
      // Save audio to tmp file
      const fileId = crypto.randomUUID();
      const filePath = path.join(os.tmpdir(), `${fileId}.wav`);
      const audioBuffer = Buffer.from(result.output.audio_base64, "base64");
      fs.writeFileSync(filePath, audioBuffer);

      return {
        statusCode: 200,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({
          status: "COMPLETED",
          output: {
            download_url: `/api/download/${fileId}`,
            sample_rate: result.output.sample_rate,
            format: result.output.format,
          },
        }),
      };
    }

    // Otherwise return the raw RunPod status
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
