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

  export class ModelXService {
    private static instance: ModelXService;

    static getInstance(): ModelXService {
      if (!ModelXService.instance) {
        ModelXService.instance = new ModelXService();
      }
      return ModelXService.instance;
    }

    async generateMusic(
      prompt: string,
      duration?: number, // Add duration parameter
      onProgress?: (progress: number) => void
    ): Promise<{ audioUrl: string; taskId: string }> {
      try {
        // Start generation via proxy
        const response = await fetch("/api/model-x", {
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
          const errorText = await response.text();
          console.error('Model X generation failed:', response.status, errorText);
          throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }

        const data: RunPodResponse = await response.json();
        console.log("Model X Proxy result:", data);

        if (!data.id) {
          throw new Error('No task ID received from Model X');
        }

        // Poll for completion
        const audioUrl = await this.pollTaskStatus(data.id, onProgress);
        return { audioUrl, taskId: data.id };
      } catch (error) {
        console.error('Model X generateMusic error:', error);
        throw error;
      }
    }

    private async pollTaskStatus(taskId: string, onProgress?: (progress: number) => void): Promise<any> {
      const startTime = Date.now();
      const timeout = 10 * 60 * 1000; // 10 minutes
      
      while (Date.now() - startTime < timeout) {
        try {
          const response = await fetch(`/.netlify/functions/model-x-status/${taskId}`);
          const result = await response.json();
          
          if (result.status === 'COMPLETED') {
            if (result.output?.download_url) {
              // Download the audio file
              const audioResponse = await fetch(result.output.download_url);
              const audioBlob = await audioResponse.blob();
              const audioUrl = URL.createObjectURL(audioBlob);
              
              return audioUrl;  // ✅ Return the URL directly like Model Y does
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

    async downloadAudio(audioDataUrl: string): Promise<Blob> {
      const response = await fetch(audioDataUrl);
      if (!response.ok) {
        throw new Error('Failed to download audio');
      }
      return response.blob();
    }
  }