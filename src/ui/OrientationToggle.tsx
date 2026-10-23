import React from 'react';
import { TimerIconButton } from './TimerIconButton';
export function OrientationToggle({ landscape, busy, onPress, color }: { landscape: boolean; busy: boolean; onPress: () => void; color: string }) {
  return <TimerIconButton name="rotate" label={busy ? 'Girando tela' : `Girar para ${landscape ? 'vertical' : 'horizontal'}`} onPress={onPress} disabled={busy} color={color} />;
}
