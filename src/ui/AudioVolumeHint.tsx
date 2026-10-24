import React from 'react';
import { useAudioStatus } from '../platform/useAudioStatus';
import { Label } from './components';
export function AudioVolumeHint({ enabled, color }: { enabled: boolean; color?: string }) {
  const status = useAudioStatus();
  if (!enabled || !status || (!status.lowVolume && !status.silent)) return null;
  return <Label accessibilityLiveRegion="polite" style={{ fontSize: 12, color: color ?? '#A1A1AA', textAlign: 'center' }}>{status.silent ? 'Modo silencioso: os avisos sonoros ficam suspensos.' : 'Volume de mídia baixo. Ajuste pelos botões do celular.'}</Label>;
}
