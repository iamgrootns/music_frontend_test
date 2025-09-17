
import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Download } from 'lucide-react';
import { CyberButton } from './ui/CyberButton';

interface AudioPlayerProps {
  audioUrl: string | null;
  onClose: () => void;
}

export const AudioPlayer = ({ audioUrl, onClose }: AudioPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current && audioUrl) {
      audioRef.current.load();
    }
  }, [audioUrl]);

  const togglePlayPause = async () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        try {
          await audioRef.current.play();
          setIsPlaying(true);
        } catch (error) {
          console.error('Audio playback failed:', error);
          // Handle autoplay restrictions
          if (error.name === 'NotAllowedError') {
            alert('Audio playback requires user interaction. Please click play again.');
          } else if (error.name === 'NotSupportedError') {
            alert('Audio format not supported by your browser.');
          } else {
            alert('Audio playback failed. Please try downloading the file instead.');
          }
          setIsPlaying(false);
          return;
        }
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (audioRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const newTime = (clickX / rect.width) * duration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const downloadAudio = () => {
    if (audioUrl) {
      const a = document.createElement('a');
      a.href = audioUrl;
      a.download = 'generated-music.wav';
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

  if (!audioUrl) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="w-full max-w-md mx-auto glass-morphism rounded-xl p-6 neon-glow"
    >
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        onError={(e) => {
          console.error('Audio loading error:', e);
          console.error('Audio error details:', audioRef.current?.error);
        }}
        crossOrigin="anonymous"
        preload="metadata"
      />
      
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold gradient-text">Generated Music</h3>
        <p className="text-muted-foreground text-sm">Your AI composition is ready!</p>
      </div>

      {/* Progress bar */}
      <div
        className="w-full h-2 bg-muted rounded-full cursor-pointer mb-4 overflow-hidden"
        onClick={handleSeek}
      >
        <motion.div
          className="h-full bg-gradient-to-r from-neon-blue to-neon-purple rounded-full"
          style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
          animate={{ boxShadow: '0 0 10px hsl(var(--neon-blue))' }}
        />
      </div>

      {/* Time display */}
      <div className="flex justify-between text-sm text-muted-foreground mb-6">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        <CyberButton
          variant="primary"
          size="lg"
          onClick={togglePlayPause}
          className="rounded-full w-16 h-16 flex items-center justify-center"
        >
          {isPlaying ? <Pause size={24} /> : <Play size={24} />}
        </CyberButton>
        
        <CyberButton
          variant="secondary"
          onClick={downloadAudio}
          className="rounded-full w-12 h-12 flex items-center justify-center"
        >
          <Download size={20} />
        </CyberButton>
        
        <CyberButton
          variant="ghost"
          onClick={onClose}
          size="sm"
        >
          Close
        </CyberButton>
      </div>
    </motion.div>
  );
};
