import axios from "axios";

export class ModelYService {
  async generateMusic(prompt: string, duration: number, onProgress?: (p: number) => void) {
    const startResp = await axios.post<{ id: string }>("/api/model-y", {
      input: { text: prompt, duration },
    });
    const taskId = startResp.data.id;

    const pollUrl = `/api/model-y/status/${taskId}`;
    return this.pollTask(pollUrl, taskId, onProgress);
  }

  private async pollTask(url: string, taskId: string, onProgress?: (p: number) => void) {
    return new Promise<{ audioUrl: string; taskId: string }>((resolve, reject) => {
      const poll = async () => {
        try {
          const resp = await axios.get(url);
          const data = resp.data;

          if (data.status === "COMPLETED" && data.output?.audio_base64) {
            const audioBuffer = Uint8Array.from(atob(data.output.audio_base64), c => c.charCodeAt(0));
            const blob = new Blob([audioBuffer], { type: "audio/wav" });
            const blobUrl = URL.createObjectURL(blob);
            resolve({ audioUrl: blobUrl, taskId });
          } else if (data.status === "FAILED") {
            reject(new Error("Music generation failed"));
          } else {
            if (onProgress && data.progress) onProgress(data.progress);
            setTimeout(poll, 2000);
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
