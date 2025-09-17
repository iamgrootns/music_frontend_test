import axios from "axios";

export class ModelXService {
  private endpoint = import.meta.env.VITE_RUNPOD_ENDPOINT_X;
  private apiKey = import.meta.env.VITE_RUNPOD_API_KEY;

  async generateMusic(
    prompt: string,
    duration: number,
    onProgress?: (p: number) => void
  ) {
    // Start generation
    const startResp = await axios.post<{ id: string }>(
      `${this.endpoint}/run`,
      { input: { text: prompt, duration } },
      {
        headers: { Authorization: `Bearer ${this.apiKey}` },
        timeout: 60000, // 1 min
      }
    );

    const taskId = startResp.data.id;
    const pollUrl = `${this.endpoint}/status/${taskId}`;
    return this.pollTask(pollUrl, taskId, onProgress);
  }

  private async pollTask(
    url: string,
    taskId: string,
    onProgress?: (p: number) => void
  ): Promise<{ audioUrl: string; taskId: string }> {
    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const resp = await axios.get(url, {
            headers: { Authorization: `Bearer ${this.apiKey}` },
            timeout: 60000,
          });

          const data = resp.data;

          if (data.status === "COMPLETED" && data.output?.audio_base64) {
            // Convert base64 -> Blob -> Object URL
            const audioBuffer = Uint8Array.from(
              atob(data.output.audio_base64),
              (c) => c.charCodeAt(0)
            );
            const blob = new Blob([audioBuffer], { type: "audio/wav" });
            const blobUrl = URL.createObjectURL(blob);
            resolve({ audioUrl: blobUrl, taskId });
          } else if (data.status === "FAILED") {
            reject(new Error("Music generation failed"));
          } else {
            if (onProgress && data.progress) onProgress(data.progress);
            setTimeout(poll, 4000); // poll every 4s
          }
        } catch (err) {
          reject(err);
        }
      };
      poll();
    });
  }

  async downloadAudio(audioUrl: string): Promise<Blob> {
    const resp = await fetch(audioUrl);
    return await resp.blob();
  }
}
