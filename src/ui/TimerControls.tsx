import React from 'react';
import { View } from 'react-native';
import { TimerIconButton } from './TimerIconButton';
export function TimerControls({ paused, finished, color, onPause, onRestart }: { paused: boolean; finished: boolean; color: string; onPause: () => void; onRestart: () => void }) {
  return <View testID="timer-controls" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 48 }}>
    {!finished && <TimerIconButton name="restart" label="Reiniciar treino" color={color} onPress={onRestart} />}
    <TimerIconButton primary name={finished ? 'restart' : paused ? 'play' : 'pause'} label={finished ? 'Repetir treino' : paused ? 'Retomar treino' : 'Pausar treino'} color={color} onPress={finished ? onRestart : onPause} />
  </View>;
}
