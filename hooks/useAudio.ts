/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { useCallback, useEffect, useRef, useState } from "react";

export default function useAudio(initialSoundEnabled: boolean = true) {
  const bgSource = useRef<HTMLAudioElement | null>(null);
  const fgSource = useRef<HTMLAudioElement | null>(null);
  const audioCache = useRef<Record<string, HTMLAudioElement>>({});
  const [bgPlaying, setBgPlaying] = useState(false);
  const soundEnabledRef = useRef(initialSoundEnabled);

  // Keep ref in sync with external state
  useEffect(() => {
    soundEnabledRef.current = initialSoundEnabled;
  }, [initialSoundEnabled]);

  const playBackground = (path: string, volume = 0.5) => {
    if (!soundEnabledRef.current) return;
    
    if (bgSource.current && bgSource.current.src.endsWith(path)) {
      if (!bgPlaying) {
        bgSource.current.play().catch(err => console.error("Audio playback failed:", err));
        setBgPlaying(true);
      }
      return;
    }

    if (bgSource.current) {
      bgSource.current.pause();
      bgSource.current = null;
    }

    const audio = new Audio(path);
    audio.loop = true;
    audio.volume = volume;
    audio.play().catch(err => console.error("Audio playback failed:", err));
    bgSource.current = audio;
    setBgPlaying(true);
  };

  const playForeground = (path: string, volume = 0.5) => {
    if (!soundEnabledRef.current) return;

    let audio = audioCache.current[path];
    if (!audio) {
      audio = new Audio(path);
      audio.preload = "auto";
      audioCache.current[path] = audio;
    }

    audio.currentTime = 0;
    audio.loop = false;
    audio.volume = volume;

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(err => console.error("Audio playback failed:", err));
    }
    fgSource.current = audio;
  };

  const toggleBackgroundPause = useCallback(() => {
    if (!bgSource.current) return;
    bgPlaying ? bgSource.current.pause() : bgSource.current.play();
    setBgPlaying(prev => !prev);
  }, [bgPlaying]);

  const pauseBackground = useCallback(() => {
    if (bgSource.current) {
      bgSource.current.pause();
      setBgPlaying(false);
    }
  }, []);

  const resumeBackground = useCallback(() => {
    if (bgSource.current && soundEnabledRef.current) {
      bgSource.current.play().catch(err => console.error("Audio playback failed:", err));
      setBgPlaying(true);
    }
  }, []);

  useEffect(() => {
    const handleVisiblityChange = function() {
      if (document.hidden) {
        pauseBackground()
      } else {
        resumeBackground();
      }
    };
    document.addEventListener("visibilitychange", handleVisiblityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisiblityChange);
    };
  },[])

  const stopAll = () => {
    bgSource.current?.pause();
    Object.values(audioCache.current).forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
    setBgPlaying(false);
  };

  const preloadCache = (paths: string[]) => {
    paths.forEach(path => {
      if (!audioCache.current[path]) {
        const audio = new Audio(path);
        audio.preload = "auto";
        audioCache.current[path] = audio;
      }
    });
  };

  return {
    playBackground,
    playForeground,
    stopAll,
    toggleBackgroundPause,
    preloadCache
  };
}
