
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Music, Sparkles, Edit3, ArrowLeft, Volume2, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Scene3D } from './3d/Scene3D';
import { CyberInput } from './ui/CyberInput';
import { CyberButton } from './ui/CyberButton';
import { AudioPlayer } from './AudioPlayer';
import { useToast } from '@/hooks/use-toast';
import { MusicGenerationService } from '@/services/musicGenerationService';
import { ModelYService } from '@/services/modelYService';
import { Slider } from '@/components/ui/slider';

const PROMPT_EXAMPLES = [
  "Epic cinematic orchestra with thunderous drums and soaring strings",
  "Ambient space music with ethereal synths and cosmic textures", 
  "Dark electronic beats with heavy bass and industrial sounds",
  "Peaceful acoustic guitar with soft piano and nature sounds",
  "Uplifting pop melody with energetic drums and catchy hooks",
  "Mysterious jazz with smoky saxophone and vintage piano",
  "Intense rock anthem with electric guitars and powerful vocals",
  "Meditative world music with traditional instruments and chants"
];

export const ModelComparison = () => {
  const [prompt, setPrompt] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isGeneratingX, setIsGeneratingX] = useState(false);
  const [isGeneratingY, setIsGeneratingY] = useState(false);
  const [audioUrlX, setAudioUrlX] = useState<string | null>(null);
  const [audioUrlY, setAudioUrlY] = useState<string | null>(null);
  const [progressX, setProgressX] = useState<number>(0);
  const [progressY, setProgressY] = useState<number>(0);
  const [duration, setDuration] = useState([60]); // Add duration state
  const { toast } = useToast();
  const navigate = useNavigate();

  const enhancePrompt = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Empty prompt",
        description: "Please enter a prompt to enhance.",
        variant: "destructive",
      });
      return;
    }

    setIsEnhancing(true);

    try {
      const response = await axios.post('https://vjpblx3a7irz7k-8000.proxy.runpod.net/enhance', {
        prompt: prompt.trim(),
        max_new_tokens: 300
      }, {
        timeout: 600000, // 10 minutes (changed from 30 seconds)
      });

      console.log('Enhancement response:', response.data);

      if (response.data && response.data.enhanced) {
        setPrompt(response.data.enhanced);
        toast({
          title: "Prompt Enhanced! ✨",
          description: "Your music prompt has been improved with AI.",
        });
      } else {
        console.error('No enhanced field in response:', response.data);
        toast({
          title: "Enhancement Failed",
          description: "Could not get enhanced prompt from API.",
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('Error enhancing prompt:', error);
      toast({
        title: "Enhancement Failed",
        description: "Failed to enhance prompt. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsEnhancing(false);
    }
  };

  const generateMusic = async (model: 'modelx' | 'modely') => {
    if (!prompt.trim()) {
      toast({
        title: "Empty prompt",
        description: "Please enter a music prompt to generate audio.",
        variant: "destructive",
      });
      return;
    }

    const setGenerating = model === 'modelx' ? setIsGeneratingX : setIsGeneratingY;
    const setAudioUrl = model === 'modelx' ? setAudioUrlX : setAudioUrlY;
    const setProgress = model === 'modelx' ? setProgressX : setProgressY;
    
    setGenerating(true);
    setAudioUrl(null);
    setProgress(0);

    try {
      let result: { audioUrl: string; taskId: string };
      
      if (model === 'modely') {
        // Use the new proxy service for Model Y
        const modelYService = new ModelYService();
        result = await modelYService.generateMusic(
          prompt.trim(),
          duration[0], // Add duration parameter
          (progressValue) => {
            setProgress(progressValue);
            console.log(`${model} generation progress: ${progressValue}%`);
          }
        );
      } else {
        // Use existing service for ModelX
        const baseUrl = 'https://5027xuzk5dk6sd-8000.proxy.runpod.net';
        const service = new MusicGenerationService(baseUrl);
        
        result = await service.generateMusic(
          prompt.trim(),
          duration[0], // Use dynamic duration instead of fixed 30
          32000, // Default sample rate
          (progressValue) => {
            setProgress(progressValue);
            console.log(`${model} generation progress: ${progressValue}%`);
          }
        );
      }

      // Download the audio and create a blob URL for local playback
      const audioBlob = model === 'modely'
        ? await new ModelYService().downloadAudio(result.audioUrl)
        : await new MusicGenerationService('').downloadAudio(result.audioUrl);
      const localUrl = URL.createObjectURL(audioBlob);
      setAudioUrl(localUrl);
      
      toast({
        title: `${model === 'modelx' ? 'ModelX' : 'ModelY'} Generated! 🎵`,
        description: "Your AI composition is ready to play.",
      });

    } catch (error) {
      console.error(`Error generating music with ${model}:`, error);
      toast({
        title: "Generation Failed",
        description: `Failed to generate music with ${model === 'modelx' ? 'ModelX' : 'ModelY'}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
      setProgress(0);
    }
  };

  const generateBoth = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Empty prompt",
        description: "Please enter a music prompt to generate audio.",
        variant: "destructive",
      });
      return;
    }

    // Generate both models simultaneously
    await Promise.all([
      generateMusic('modelx'),
      generateMusic('modely')
    ]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generateBoth();
  };

  const handleExampleClick = (example: string) => {
    setPrompt(example);
  };

  return (
    <div className="min-h-screen cyber-grid">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-4 mb-4">
            <CyberButton
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="absolute left-4 top-8"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </CyberButton>
            <h1 className="text-4xl md:text-6xl font-bold gradient-text float">
              Model Comparison
            </h1>
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Compare ModelX and ModelY side by side with the same prompt
          </p>
        </motion.div>

        {/* Input Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-2xl mx-auto mb-8"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">
                Music Prompt
              </label>
              <div className="relative flex gap-2">
                <CyberInput
                  placeholder="epic cinematic orchestra with drums, dark ambient space music..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  disabled={isGeneratingX || isGeneratingY || isEnhancing}
                  className="flex-1"
                />
                <CyberButton
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={enhancePrompt}
                  disabled={isGeneratingX || isGeneratingY || isEnhancing || !prompt.trim()}
                  isLoading={isEnhancing}
                  className="px-4 py-3 shrink-0"
                >
                  <Edit3 className="w-4 h-4" />
                </CyberButton>
              </div>
              {isEnhancing && (
                <p className="text-xs text-muted-foreground">
                  Enhancing your prompt with AI...
                </p>
              )}
            </div>

            {/* Prompt Examples */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground block">
                Or try these examples:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PROMPT_EXAMPLES.map((example, index) => (
                  <motion.button
                    key={index}
                    type="button"
                    onClick={() => handleExampleClick(example)}
                    disabled={isGeneratingX || isGeneratingY || isEnhancing}
                    className="text-left p-3 text-sm bg-card/30 hover:bg-card/50 border border-border/50 hover:border-neon-blue/50 rounded-lg transition-all duration-300 hover:neon-glow disabled:opacity-50 disabled:cursor-not-allowed"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="text-muted-foreground line-clamp-2">{example}</span>
                  </motion.button>
                ))}
              </div>
            </div>
            
            {/* Duration Slider */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground block">
                Duration: {duration[0]} seconds
              </label>
              <div className="max-w-md mx-auto space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">Duration</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{duration[0]}s</span>
                </div>
                <Slider
                  value={duration}
                  onValueChange={setDuration}
                  max={120}
                  min={10}
                  step={5}
                  className="w-full"
                  disabled={isGeneratingX || isGeneratingY || isEnhancing}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>10s</span>
                  <span>120s</span>
                </div>
              </div>
            </div>
            
            <CyberButton
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isGeneratingX || isGeneratingY}
              className="w-full"
              disabled={isGeneratingX || isGeneratingY || isEnhancing}
            >
              <Music className="w-5 h-5" />
              {(isGeneratingX || isGeneratingY) ? 'Generating Both Models...' : 'Generate Both Models'}
              <Sparkles className="w-5 h-5" />
            </CyberButton>
          </form>
        </motion.div>

        {/* Comparison Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto"
        >
          {/* ModelX Side */}
          <div className="glass-morphism rounded-lg p-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-neon-blue mb-2">ModelX</h2>
              <p className="text-muted-foreground text-sm">Classic & Vintage</p>
            </div>
            
            <div className="space-y-4">
              <CyberButton
                variant="secondary"
                size="md"
                onClick={() => generateMusic('modelx')}
                disabled={isGeneratingX || isGeneratingY || isEnhancing || !prompt.trim()}
                isLoading={isGeneratingX}
                className="w-full"
              >
                <Volume2 className="w-4 h-4" />
                {isGeneratingX ? 'Generating...' : 'Generate ModelX'}
              </CyberButton>

              {isGeneratingX && (
                <div className="space-y-2">
                  <div className="w-full bg-muted rounded-full h-2">
                    <motion.div
                      className="bg-gradient-to-r from-neon-blue to-neon-blue/70 h-2 rounded-full"
                      style={{ width: `${progressX}%` }}
                      animate={{ boxShadow: '0 0 10px hsl(var(--neon-blue))' }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    {progressX > 0 ? `${progressX}% complete` : 'Generating ModelX...'}
                  </p>
                </div>
              )}

              <AnimatePresence>
                {audioUrlX && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                  >
                    <AudioPlayer
                      audioUrl={audioUrlX}
                      onClose={() => setAudioUrlX(null)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* ModelY Side */}
          <div className="glass-morphism rounded-lg p-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-neon-purple mb-2">ModelY</h2>
              <p className="text-muted-foreground text-sm">Futuristic & Synthetic</p>
            </div>
            
            <div className="space-y-4">
              <CyberButton
                variant="secondary"
                size="md"
                onClick={() => generateMusic('modely')}
                disabled={isGeneratingX || isGeneratingY || isEnhancing || !prompt.trim()}
                isLoading={isGeneratingY}
                className="w-full"
              >
                <Volume2 className="w-4 h-4" />
                {isGeneratingY ? 'Generating...' : 'Generate ModelY'}
              </CyberButton>

              {isGeneratingY && (
                <div className="space-y-2">
                  <div className="w-full bg-muted rounded-full h-2">
                    <motion.div
                      className="bg-gradient-to-r from-neon-purple to-neon-purple/70 h-2 rounded-full"
                      style={{ width: `${progressY}%` }}
                      animate={{ boxShadow: '0 0 10px hsl(var(--neon-purple))' }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    {progressY > 0 ? `${progressY}% complete` : 'Generating ModelY...'}
                  </p>
                </div>
              )}

              <AnimatePresence>
                {audioUrlY && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                  >
                    <AudioPlayer
                      audioUrl={audioUrlY}
                      onClose={() => setAudioUrlY(null)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="fixed bottom-4 right-4 z-50"
        >
          <div className="glass-morphism rounded-full px-4 py-2 text-sm text-muted-foreground float">
            Made with ❤️ by Groot
          </div>
        </motion.div>
      </div>
    </div>
  );
};
