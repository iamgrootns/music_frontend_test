
import axios from 'axios';

export interface TaskResponse {
  task_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  message: string;
  estimated_time?: number;
}

export interface TaskStatusResponse {
  task_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  message: string;
  audio_url?: string;
  error?: string;
  progress?: number;
}

export class MusicGenerationService {
  constructor(private baseUrl: string) {}

  async startGeneration(text: string, duration: number = 30, sampleRate: number = 32000): Promise<string> {
    const response = await axios.post<TaskResponse>(`${this.baseUrl}/generate`, {
      text,
      duration,
      sample_rate: sampleRate
    }, {
      timeout: 600000 // 10 minutes (changed from 30 seconds)
    });

    return response.data.task_id;
  }

  async pollTaskStatus(taskId: string, onProgress?: (progress: number) => void): Promise<string> {
    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const response = await axios.get<TaskStatusResponse>(`${this.baseUrl}/task/${taskId}/status`, {
            timeout: 600000 // 10 minutes (changed from 10 seconds)
          });

          const data = response.data;

          if (data.status === 'completed') {
            if (data.audio_url) {
              // Convert relative URL to full URL
              const fullUrl = data.audio_url.startsWith('http') 
                ? data.audio_url 
                : `${this.baseUrl}${data.audio_url}`;
              resolve(fullUrl);
            } else {
              reject(new Error('Audio URL not provided'));
            }
          } else if (data.status === 'failed') {
            reject(new Error(data.error || 'Generation failed'));
          } else {
            // Show progress if available
            if (data.progress && onProgress) {
              onProgress(data.progress);
            }
            // Continue polling
            setTimeout(poll, 2000); // Check every 2 seconds
          }
        } catch (error) {
          console.error('Polling error:', error);
          reject(error);
        }
      };
      poll();
    });
  }

  async generateMusic(text: string, duration: number = 30, sampleRate: number = 32000, onProgress?: (progress: number) => void): Promise<{ audioUrl: string; taskId: string }> {
    const taskId = await this.startGeneration(text, duration, sampleRate);
    const audioUrl = await this.pollTaskStatus(taskId, onProgress);
    return { audioUrl, taskId };
  }

  async downloadAudio(audioUrl: string): Promise<Blob> {
    const response = await axios.get(audioUrl, {
      responseType: 'blob',
      timeout: 600000 // 10 minutes (changed from 60 seconds)
    });
    return response.data;
  }
}
