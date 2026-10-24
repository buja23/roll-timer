import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { audioStatus, AudioStatus } from './nativeTimer';
export function useAudioStatus() {
  const [status, setStatus] = useState<AudioStatus | null>(null);
  useFocusEffect(useCallback(() => {
    const refresh = () => { try { setStatus(audioStatus()); } catch { setStatus(null); } };
    refresh(); const timer = setInterval(refresh, 2500);
    return () => clearInterval(timer);
  }, []));
  return status;
}
