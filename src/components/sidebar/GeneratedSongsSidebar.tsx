import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Play, Pause, Download, Trash2 } from 'lucide-react';

interface GeneratedSong {
  id: string;
  prompt: string;
  audioUrl: string;
  createdAt: Date;
  model: string;
  taskId?: string;
}

interface StoredSong {
  id: string;
  prompt: string;
  createdAt: string;
  model: string;
  taskId: string;
  audioData?: string; // Store base64 audio data
}

export const GeneratedSongsSidebar = () => {
  const [songs, setSongs] = useState<GeneratedSong[]>([]);
  
  // COMMENTED OUT: Load songs from localStorage on mount
  // useEffect(() => {
  //   const savedSongs = localStorage.getItem('generated-songs');
  //   if (savedSongs) {
  //     try {
  //       const parsedSongs: StoredSong[] = JSON.parse(savedSongs);
  //       // Convert stored songs back to GeneratedSong format
  //       const songsWithDates: GeneratedSong[] = parsedSongs.map((song) => ({
  //         ...song,
  //         createdAt: new Date(song.createdAt),
  //         audioUrl: song.audioData || '', // Use stored audio data if available
  //       }));
  //       setSongs(songsWithDates);
  //     } catch (error) {
  //       console.error('Error loading songs from localStorage:', error);
  //       setSongs([]);
  //     }
  //   }
  // }, []);

  const addSong = (song: GeneratedSong) => {
    // Ensure the song has a valid ID
    const songWithId = {
      ...song,
      id: song.id || `song-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: song.createdAt || new Date()
    };
    setSongs(prev => [songWithId, ...prev.slice(0, 9)]); // Keep max 10 songs
  };

  const handleDelete = (songId: string) => {
    setSongs(prev => prev.filter(song => song.id !== songId));
  };

  // COMMENTED OUT: Save songs to localStorage whenever songs change (with audioData for base64)
  // useEffect(() => {
  //   try {
  //     const songsToStore: StoredSong[] = songs
  //       .filter(song => song.taskId)
  //       .map((song) => ({
  //         id: song.id,
  //         prompt: song.prompt,
  //         createdAt: song.createdAt.toISOString(),
  //         model: song.model,
  //         taskId: song.taskId!,
  //         audioData: song.audioUrl.startsWith('data:audio/') ? song.audioUrl : undefined, // Store base64 data
  //       }));
  //     localStorage.setItem('generated-songs', JSON.stringify(songsToStore));
  //   } catch (error) {
  //     console.error('Error saving songs to localStorage:', error);
  //     // If storage is full, remove oldest songs and try again
  //     if (songs.length > 5) {
  //       const trimmedSongs = songs.slice(0, 5);
  //       setSongs(trimmedSongs);
  //     }
  //   }
  // }, [songs]);

  const handleLoadInMainPlayer = (song: GeneratedSong) => {
    // Load song into main player
    if ((window as any).loadSongInMainPlayer) {
      (window as any).loadSongInMainPlayer(song);
    }
  };

  const handleDownload = (song: GeneratedSong) => {
    if (!song.audioUrl || song.audioUrl === '') {
      alert('Audio data not available for download');
      return;
    }
    const a = document.createElement('a');
    a.href = song.audioUrl;
    a.download = `${song.prompt.slice(0, 20)}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Expose addSong function globally for other components to use
  useEffect(() => {
    (window as any).addGeneratedSong = addSong;
  }, []);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6">
        <h2 className="text-lg font-medium text-foreground mb-6">LIBRARY</h2>
        <div className="space-y-1">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-secondary text-secondary-foreground">
            <Music className="w-4 h-4" />
            <span className="text-sm font-medium">Songs</span>
          </div>
        </div>
      </div>

      {/* Songs List */}
      <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-2">
        <AnimatePresence>
          {songs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <Music className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">
                No songs yet
              </p>
            </motion.div>
          ) : (
            songs.map((song, index) => (
              <motion.div
                key={song.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: index * 0.05 }}
                className={`clean-card p-3 hover-lift hover:bg-muted/50 transition-all group cursor-pointer ${
                  !song.audioUrl || song.audioUrl === '' ? 'opacity-50' : ''
                }`}
                onClick={() => handleLoadInMainPlayer(song)}
              >
                {/* Song Info */}
                <div className="mb-2">
                  <h3 className="text-sm font-medium text-foreground line-clamp-2 mb-1">
                    {song.prompt}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs">
                      {song.model === 'modelx' ? 'ModelX' : 
                       song.model === 'modely' ? 'ModelY' : 
                       song.model === 'modelxlarge' ? 'ModelX Large' : song.model}
                    </span>
                    <span>
                      {new Date(song.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Play indicator */}
                <div className="mb-2 flex items-center justify-center p-2 bg-primary/5 rounded-lg">
                  {song.audioUrl && song.audioUrl !== '' ? (
                    <>
                      <Play className="w-4 h-4 text-primary/60" />
                      <span className="ml-2 text-xs text-primary/60">Click to play in main area</span>
                    </>
                  ) : (
                    <>
                      <Music className="w-4 h-4 text-muted-foreground" />
                      <span className="ml-2 text-xs text-muted-foreground">Audio unavailable</span>
                    </>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(song);
                    }}
                    disabled={!song.audioUrl || song.audioUrl === ''}
                    className="flex-1 px-2 py-1 bg-muted hover:bg-muted-foreground/10 text-muted-foreground rounded transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(song.id);
                    }}
                    className="flex-1 px-2 py-1 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded transition-all flex items-center justify-center"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};