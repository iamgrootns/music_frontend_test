/**
 * Service for Model Y music generation using Vite proxy
 * 
 * Reference: Direct RunPod API usage (for documentation purposes)
 * 
 * async function directRunPodCall() {
 *   const url = "https://api.runpod.ai/v2/6jx8w05r889z4o/run";
 *   
 *   const requestConfig = {
 *     method: "POST",
 *     headers: {
 *       "Content-Type": "application/json",
 *       "Authorization": "Bearer YOUR_API_KEY"
 *     },
 *     body: JSON.stringify({ "input": { "text": "Your prompt" } })
 *   };
 *   
 *   try {
 *     const response = await fetch(url, requestConfig);
 *     
 *     if (!response.ok) {
 *       throw new Error(`HTTP error! status: ${response.status}`);
 *     }
 *     
 *     const data = await response.json();
 *     console.log(data);
 *     return data;
 *   } catch (error) {
 *     console.error('Error:', error);
 *     throw error;
 *   }
 * }
 */

export interface RunPodResponse {
  id: string;
  status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  output?: {
    audio_base64?: string;
    sample_rate?: number;
    format?: string;
  };
  error?: string;
}

export class ModelYService {
  /**
   * Generate music using Model Y via Vite proxy
   * @param prompt The music generation prompt
   * @param onProgress Optional progress callback
   * @returns Promise with audio URL and task ID
   */
  async generateMusic(
    prompt: string,
    duration?: number, // Add duration parameter
    onProgress?: (progress: number) => void
  ): Promise<{ audioUrl: string; taskId: string }> {
    // Start generation via proxy - Include duration in request
    const response = await fetch("/api/model-y", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        input: { 
          text: prompt,
          duration: duration || 30 // Default to 30 seconds if not provided
        } 
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: RunPodResponse = await response.json();
    console.log("Proxy result:", data);

    if (!data.id) {
      throw new Error('No task ID received from Model Y');
    }

    // Poll for completion
    const audioUrl = await this.pollTaskStatus(data.id, onProgress);
    return { audioUrl, taskId: data.id };
  }

  /**
   * Poll task status until completion
   * @param taskId The task ID to poll
   * @param onProgress Optional progress callback
   * @returns Promise with audio data URL
   */
  private async pollTaskStatus(
    taskId: string, 
    onProgress?: (progress: number) => void
  ): Promise<string> {
    const startTime = Date.now();
    const timeout = 10 * 60 * 1000; // 10 minutes
    
    while (Date.now() - startTime < timeout) {
      try {
        const response = await fetch(`/.netlify/functions/model-y-status/${taskId}`);
        const result = await response.json();
        
        if (result.status === 'COMPLETED') {
          if (result.output?.download_url) {
            // Download the audio file
            const audioResponse = await fetch(result.output.download_url);
            const audioBlob = await audioResponse.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            
            return audioUrl;
          }
          return result.output;
        }
        
        if (result.status === 'FAILED') {
          throw new Error(result.error || 'Generation failed');
        }
        
        // Update progress if available
        if (onProgress && result.progress) {
          onProgress(result.progress);
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error('Polling error:', error);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    throw new Error('Task timeout after 10 minutes');
  }

  /**
   * Convert base64 data URL to blob for download
   * @param audioDataUrl The audio data URL (data:audio/wav;base64,...)
   * @returns Promise with audio blob
   */
  async downloadAudio(audioDataUrl: string): Promise<Blob> {
    if (audioDataUrl.startsWith('data:audio/')) {
      // Convert data URL to blob
      const response = await fetch(audioDataUrl);
      return response.blob();
    } else {
      // Fallback for regular URLs (shouldn't happen with your backend)
      const response = await fetch(audioDataUrl);
      if (!response.ok) {
        throw new Error(`Failed to download audio: ${response.status}`);
      }
      return response.blob();
    }
  }
}