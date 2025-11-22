"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Music, Play, Pause, X, Volume2 } from "lucide-react";

interface Track {
  id: string;
  name: string;
  url: string;
  emoji: string;
}

const tracks: Track[] = [
  {
    id: "lofi",
    name: "Lo-fi Beats",
    url: "https://www.youtube.com/embed/jfKfPfyJRdk?enablejsapi=1&autoplay=1&loop=1&playlist=jfKfPfyJRdk&controls=0&modestbranding=1&rel=0",
    emoji: "🎵",
  },
  {
    id: "rain",
    name: "Rain Sounds",
    url: "https://www.youtube.com/embed/nDq6TstdEi8?enablejsapi=1&autoplay=1&loop=1&playlist=nDq6TstdEi8&controls=0&modestbranding=1&rel=0",
    emoji: "🌧️",
  },
  {
    id: "cafe",
    name: "Cafe Ambience",
    url: "https://www.youtube.com/embed/gaGehpJlt6c?enablejsapi=1&autoplay=1&loop=1&playlist=gaGehpJlt6c&controls=0&modestbranding=1&rel=0",
    emoji: "☕",
  },
  {
    id: "forest",
    name: "Forest Sounds",
    url: "https://www.youtube.com/embed/xNN7iTA57jM?enablejsapi=1&autoplay=1&loop=1&playlist=xNN7iTA57jM&controls=0&modestbranding=1&rel=0",
    emoji: "🌲",
  },
];

export default function MusicPlayer() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackId, setCurrentTrackId] = useState<string>("lofi");
  const [volume, setVolume] = useState(50);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<any>(null);

  // Load saved preferences from localStorage
  useEffect(() => {
    const savedTrack = localStorage.getItem("music-player-track");
    const savedVolume = localStorage.getItem("music-player-volume");
    const savedPlaying = localStorage.getItem("music-player-playing");

    if (savedTrack) setCurrentTrackId(savedTrack);
    if (savedVolume) setVolume(parseInt(savedVolume));
    if (savedPlaying === "true") setIsPlaying(true);
  }, []);

  // Listen for toggle event from navbar
  useEffect(() => {
    const handleToggle = () => {
      setIsOpen((prev) => !prev);
    };

    window.addEventListener("toggleMusicPlayer", handleToggle);
    return () => window.removeEventListener("toggleMusicPlayer", handleToggle);
  }, []);

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem("music-player-track", currentTrackId);
    localStorage.setItem("music-player-volume", volume.toString());
    localStorage.setItem("music-player-playing", isPlaying.toString());
  }, [currentTrackId, volume, isPlaying]);

  // Initialize YouTube IFrame API
  useEffect(() => {
    // Load YouTube IFrame API
    if (typeof window !== 'undefined' && !(window as any).YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      (window as any).onYouTubeIframeAPIReady = () => {
        console.log('YouTube API Ready');
      };
    }
  }, []);

  // Control volume when it changes
  useEffect(() => {
    if (iframeRef.current && isPlaying) {
      try {
        iframeRef.current.contentWindow?.postMessage(
          JSON.stringify({
            event: "command",
            func: "setVolume",
            args: [volume],
          }),
          "*"
        );
      } catch (error) {
        console.log("Volume control message sent");
      }
    }
  }, [volume, isPlaying]);

  const currentTrack = tracks.find((t) => t.id === currentTrackId) || tracks[0];

  const togglePlay = () => {
    if (iframeRef.current) {
      try {
        const command = isPlaying ? "pauseVideo" : "playVideo";
        iframeRef.current.contentWindow?.postMessage(
          JSON.stringify({
            event: "command",
            func: command,
          }),
          "*"
        );
      } catch (error) {
        console.log("Playback control sent");
      }
    }
    setIsPlaying(!isPlaying);
  };

  const changeTrack = (trackId: string) => {
    setCurrentTrackId(trackId);
    setIsPlaying(true);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
  };

  return (
    <>
      {/* Toggle Button in Navbar - This should be added to Navbar component */}
      
      {/* Floating Music Player */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: 200, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 200, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-6 right-6 z-50 w-80 sm:w-96"
          >
            <div className="bg-white/20 dark:bg-black/30 white:bg-white/50 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border border-white/30 dark:border-gray-700/30">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Music className="w-5 h-5 text-purple-400" />
                  <h3 className="font-bold text-gray-800 dark:text-white">
                    Study Music
                  </h3>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg hover:bg-white/20 dark:hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </motion.button>
              </div>

              {/* Current Track Display */}
              <div className="mb-4 p-3 bg-white/30 dark:bg-white/10 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{currentTrack.emoji}</span>
                    <div>
                      <p className="font-bold text-gray-800 dark:text-white">
                        {currentTrack.name}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {isPlaying ? "Now Playing" : "Paused"}
                      </p>
                    </div>
                  </div>

                  {/* Waveform Animation */}
                  {isPlaying && (
                    <div className="flex items-center gap-1 h-8">
                      {[0, 1, 2, 3].map((i) => (
                        <motion.div
                          key={i}
                          animate={{
                            height: [10, 20, 10],
                          }}
                          transition={{
                            duration: 0.8,
                            repeat: Infinity,
                            delay: i * 0.1,
                            ease: "easeInOut",
                          }}
                          className="w-1 bg-gradient-to-t from-gray-600 to-gray-700 rounded-full"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Track Selection */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {tracks.map((track) => (
                  <motion.button
                    key={track.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => changeTrack(track.id)}
                    className={`p-3 rounded-xl transition-all ${
                      currentTrackId === track.id
                        ? "bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-lg"
                        : "bg-white/20 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-white/30"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{track.emoji}</span>
                      <span className="text-sm font-semibold">{track.name}</span>
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Controls */}
              <div className="flex items-center gap-4">
                {/* Play/Pause Button */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={togglePlay}
                  className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-lg"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5" fill="currentColor" />
                  ) : (
                    <Play className="w-5 h-5 ml-0.5" fill="currentColor" />
                  )}
                </motion.button>

                {/* Volume Control */}
                <div className="flex-1 flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="flex-1 h-2 bg-white/30 dark:bg-white/10 rounded-lg appearance-none cursor-pointer
                      [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
                      [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r 
                      [&::-webkit-slider-thumb]:from-gray-600 [&::-webkit-slider-thumb]:to-gray-700
                      [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg
                      [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full 
                      [&::-moz-range-thumb]:bg-gradient-to-r [&::-moz-range-thumb]:from-gray-600 
                      [&::-moz-range-thumb]:to-gray-700 [&::-moz-range-thumb]:border-0 
                      [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:shadow-lg"
                  />
                  <span className="text-xs text-gray-600 dark:text-gray-400 font-semibold w-8">
                    {volume}%
                  </span>
                </div>
              </div>

              {/* Hidden YouTube Iframe */}
              <iframe
                key={currentTrackId}
                ref={iframeRef}
                src={currentTrack.url}
                allow="autoplay; encrypted-media"
                className="hidden"
                title="Music Player"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile: Compact floating button when closed */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-2xl flex items-center justify-center"
        >
          <Music className="w-6 h-6" />
        </motion.button>
      )}
    </>
  );
}
