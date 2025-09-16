import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Sparkles, Wand2, Mic, Clock, Play, Pause, Download } from 'lucide-react';
import { AudioPlayer } from '../AudioPlayer';
import { useToast } from '@/hooks/use-toast';
import { MusicGenerationService } from '@/services/musicGenerationService';
import { ModelYService } from '@/services/modelYService';
import { ModelXService } from '@/services/modelXService';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

export const MainGenerationArea = () => {
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('modely'); // Changed from 'modelx' to 'modely'
  const [duration, setDuration] = useState([60]); // Duration in seconds for ModelX Large
  const [sampleRate, setSampleRate] = useState(32000);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loadedSong, setLoadedSong] = useState<any>(null); // Song loaded from sidebar
  const [progress, setProgress] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

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
      const response = await fetch('https://vjpblx3a7irz7k-8000.proxy.runpod.net/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: prompt.trim(),
          max_new_tokens: 300
        }),
      });

      const data = await response.json();

      if (data && data.enhanced) {
        setPrompt(data.enhanced);
        toast({
          title: "Prompt Enhanced! ✨",
          description: "Your music prompt has been improved with AI.",
        });
      } else {
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

  const generateMusic = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Empty prompt",
        description: "Please enter a music prompt to generate audio.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setAudioUrl(null);
    setProgress(0);

    try {
      let result: { audioUrl: string; taskId: string };
      
      if (selectedModel === 'modely') {
        // Use the new proxy service for Model Y
        const modelYService = new ModelYService();
        result = await modelYService.generateMusic(
          prompt.trim(),
          duration[0], // Pass duration from slider
          (progressValue) => {
            setProgress(progressValue);
            console.log(`Generation progress: ${progressValue}%`);
          }
        );
      } else if (selectedModel === 'modelxlarge') {
        // Use ModelXService for Model X Large
        const modelXService = new ModelXService();
        result = await modelXService.generateMusic(
          prompt.trim(),
          duration[0], // Pass duration from slider
          (progressValue) => {
            setProgress(progressValue);
            console.log(`Generation progress: ${progressValue}%`);
          }
        );
      } else {
        // Use existing service for ModelX Classic
        const baseUrl = 'https://5027xuzk5dk6sd-8000.proxy.runpod.net';
        const service = new MusicGenerationService(baseUrl);
        
        result = await service.generateMusic(
          prompt.trim(), 
          30, // Fixed duration for ModelX Classic
          sampleRate,
          (progressValue) => {
            setProgress(progressValue);
            console.log(`Generation progress: ${progressValue}%`);
          }
        );
      }

      // Download the audio and create a blob URL for local playback
      console.log('Original audio URL:', result.audioUrl);
      
      const audioBlob = selectedModel === 'modely' 
        ? await new ModelYService().downloadAudio(result.audioUrl)
        : selectedModel === 'modelxlarge'
        ? await new ModelXService().downloadAudio(result.audioUrl)
        : await new MusicGenerationService('').downloadAudio(result.audioUrl);
      
      console.log('Downloaded audio blob:', audioBlob.size, 'bytes, type:', audioBlob.type);
      
      const localUrl = URL.createObjectURL(audioBlob);
      console.log('Created blob URL:', localUrl);
      
      setAudioUrl(localUrl);

      // Add to sidebar library with taskId for persistence
      if ((window as any).addGeneratedSong) {
        (window as any).addGeneratedSong({
          id: `${selectedModel}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // ✅ Unique ID
          prompt: prompt.trim(),
          audioUrl: localUrl,
          model: selectedModel,
          taskId: result.taskId,
          createdAt: new Date(), // ✅ Add creation timestamp
        });
      }
      
      toast({
        title: "Music Generated! 🎵",
        description: "Your AI composition is ready to play.",
      });

    } catch (error) {
      console.error('Error generating music:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate music. Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generateMusic();
  };

  const togglePlayPause = async () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (error) {
        console.error('Audio playback failed:', error);
        // Handle autoplay restrictions and other errors
        if (error.name === 'NotAllowedError') {
          toast({
            title: "Playback Blocked",
            description: "Audio playback requires user interaction. Please click play again.",
            variant: "destructive"
          });
        } else if (error.name === 'NotSupportedError') {
          toast({
            title: "Format Not Supported",
            description: "Audio format not supported by your browser. Try downloading instead.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Playback Failed",
            description: "Audio playback failed. Please try downloading the file instead.",
            variant: "destructive"
          });
        }
        setIsPlaying(false);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setAudioDuration(audioRef.current.duration);
    }
  };

  const downloadAudio = () => {
    if (audioUrl) {
      const a = document.createElement('a');
      a.href = audioUrl;
      a.download = `generated-music-${Date.now()}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Function to load a song from sidebar into main player
  const loadSongInMainPlayer = (song: any) => {
    setLoadedSong(song);
    
    // Check if the song has valid audio data
    if (!song.audioUrl || song.audioUrl === '') {
      toast({
        title: "Song Unavailable 🚫",
        description: "This song's audio data is no longer available. Please regenerate it.",
        variant: "destructive"
      });
      return;
    }
    
    setAudioUrl(song.audioUrl);
    setIsPlaying(false);
    setCurrentTime(0);
    setAudioDuration(0);
    
    // Force the audio element to load the new source
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.load();
      }
    }, 100);
    
    toast({
      title: "Song Loaded! 🎵",
      description: `"${song.prompt.slice(0, 50)}..." is ready to play.`,
    });
  };

  // Expose the function globally for sidebar to use
  React.useEffect(() => {
    (window as any).loadSongInMainPlayer = loadSongInMainPlayer;
  }, []);

  const genreOptions = [
    { name: 'Indie Pop', description: 'Melodic and upbeat' },
    { name: 'Electronic Dance', description: 'High energy beats' },
    { name: 'Hip Hop Beats', description: 'Rhythmic and bold' },
    { name: 'Ambient Chill', description: 'Relaxing atmosphere' },
    { name: 'Classical Piano', description: 'Elegant and timeless' },
  ];

  return (
    <div className="flex-1 flex flex-col items-center p-12 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full text-center space-y-12"
      >
        {/* Header */}
        <div className="space-y-4">
          <h1 className="text-6xl font-bold text-foreground leading-tight">
            Create the music you<br />imagine.
          </h1>
        </div>

        {/* Input Section */}
        <div className="max-w-2xl mx-auto space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your sound..."
                className="w-full px-6 py-4 text-lg bg-muted border border-border rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                disabled={isGenerating || isEnhancing}
              />
              <button 
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 text-muted-foreground hover:text-foreground"
              >
                <Mic className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex gap-3 justify-center">
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Choose model" />
                </SelectTrigger>
                <SelectContent>
                  {/* <SelectItem value="modelx">ModelX - Classic</SelectItem> */}
                  <SelectItem value="modely">ModelY - Futuristic</SelectItem>
                  <SelectItem value="modelxlarge">ModelX Large - Enhanced</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={sampleRate.toString()} onValueChange={(value) => setSampleRate(parseInt(value))}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Sample Rate" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="32000">32kHz</SelectItem>
                  <SelectItem value="48000">48kHz</SelectItem>
                </SelectContent>
              </Select>
              
              <button
                type="button"
                onClick={enhancePrompt}
                disabled={isGenerating || isEnhancing || !prompt.trim()}
                className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-full transition-all disabled:opacity-50"
              >
                <Wand2 className="w-4 h-4" />
              </button>
              
              <button
                type="submit"
                disabled={isGenerating || isEnhancing || !prompt.trim()}
                className="px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full transition-all disabled:opacity-50 flex items-center gap-2"
              >
                <Music className="w-4 h-4" />
                Generate
                <Sparkles className="w-4 h-4" />
              </button>
            </div>
            
            {/* Duration Slider for Both Models */}
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="max-w-md mx-auto space-y-3"
            >
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
                disabled={isGenerating || isEnhancing}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>10s</span>
                <span>120s</span>
              </div>
            </motion.div>
            {/* {selectedModel === 'modelxlarge' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="max-w-md mx-auto space-y-3"
              >
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
                  disabled={isGenerating || isEnhancing}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>10s</span>
                  <span>120s</span>
                </div>
              </motion.div>
            )} */}
          </form>
          
          {isGenerating && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center space-y-3"
            >
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <div className="text-sm text-muted-foreground">
                Generating your music...
              </div>
            </motion.div>
          )}
        </div>

        {/* Starter Flows */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-foreground text-left">Starter Flows</h2>
          
          <div className="grid grid-cols-5 gap-4">
            {genreOptions.map((genre, index) => (
              <motion.button
                key={genre.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 0.3 }}
                onClick={() => setPrompt(genre.name.toLowerCase() + ' music')}
                className="group p-6 clean-card hover-lift hover:bg-muted/50 transition-all text-left"
                disabled={isGenerating}
              >
                <div className="w-full h-32 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg mb-4 flex items-center justify-center">
                  <Music className="w-8 h-8 text-primary/60" />
                </div>
                <h3 className="font-medium text-foreground mb-1">{genre.name}</h3>
                <p className="text-sm text-muted-foreground">{genre.description}</p>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Generated Music Section */}
        <AnimatePresence>
          {audioUrl && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="max-w-2xl mx-auto space-y-6"
            >
              <div className="text-center space-y-4">
                <h2 className="text-2xl font-semibold text-foreground">
                  {loadedSong ? "Loaded from Library" : "Generated Music"}
                </h2>
                {loadedSong ? (
                  <div className="space-y-2">
                    <p className="text-muted-foreground">"{loadedSong.prompt}"</p>
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                        {loadedSong.model === 'modelx' ? 'ModelX' : 
                         loadedSong.model === 'modely' ? 'ModelY' : 
                         loadedSong.model === 'modelxlarge' ? 'ModelX Large' : loadedSong.model}
                      </span>
                      <span>Generated on {new Date(loadedSong.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Your AI composition is ready!</p>
                )}
              </div>
              
              <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                {/* Audio Element */}
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onEnded={() => setIsPlaying(false)}
                  onError={(e) => {
                    console.error('Audio loading error:', e);
                    console.error('Audio error details:', audioRef.current?.error);
                    toast({
                      title: "Audio Loading Failed",
                      description: "Failed to load audio file. Please try regenerating or downloading.",
                      variant: "destructive"
                    });
                  }}
                  crossOrigin="anonymous"
                  preload="metadata"
                />
                
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="w-full bg-muted rounded-full h-1">
                    <div
                      className="bg-primary h-1 rounded-full transition-all"
                      style={{ width: `${audioDuration ? (currentTime / audioDuration) * 100 : 0}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(audioDuration)}</span>
                  </div>
                </div>
                
                {/* Controls */}
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={togglePlayPause}
                    className="w-12 h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full flex items-center justify-center transition-all"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                  </button>
                  
                  <button
                    onClick={downloadAudio}
                    className="w-10 h-10 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-full flex items-center justify-center transition-all"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => {
                      setAudioUrl(null);
                      setLoadedSong(null);
                    }}
                    className="px-4 py-2 text-muted-foreground hover:text-foreground transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};