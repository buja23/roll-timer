import React from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Frame, Workout } from '../core/timer';
import { Label } from './components';
import { TimerDisplay } from './TimerDisplay';
import { phaseSurface, PhaseIndicator, RoundIndicator, TimerProgress } from './TimerIndicators';
import { OrientationToggle } from './OrientationToggle';
import { TimerControls } from './TimerControls';
import { TimerIconButton } from './TimerIconButton';
import { AudioVolumeHint } from './AudioVolumeHint';
export interface TimerPresentationProps {
  frame: Frame; workout: Workout; paused: boolean;
  rotating: boolean; error?: string | null;
  audioEnabled?: boolean;
  onBack: () => void; onRotate: () => void; onPause: () => void; onRestart: () => void;
}
export function TimerPresentation(p: TimerPresentationProps) {
  const { width, height, fontScale } = useWindowDimensions();
  const landscape = width > height;
  const compact = landscape && width / fontScale >= 600;
  const finished = p.frame.phase === 'finished';
  const { background, ink } = phaseSurface[p.frame.phase];
  return <SafeAreaView testID={landscape ? 'timer-landscape' : 'timer-portrait'} edges={['top', 'right', 'bottom', 'left']} style={[styles.root, { backgroundColor: background }]}>
    <View style={[styles.content, { gap: landscape ? 2 : 8 }]}>
      <View testID="timer-header" style={styles.header}>
        <TimerIconButton name="arrow-left" label="Encerrar treino e voltar" color={ink} onPress={p.onBack} />
        <View style={{ flex: 1 }}><RoundIndicator frame={p.frame} workout={p.workout} color={ink} /></View>
        {compact && <View style={{ flex: 1 }}><PhaseIndicator frame={p.frame} paused={p.paused} color={ink} compact /></View>}
        <OrientationToggle landscape={landscape} busy={p.rotating} onPress={p.onRotate} color={ink} />
      </View>
      {!compact && <PhaseIndicator frame={p.frame} paused={p.paused} color={ink} compact={landscape} />}
      <TimerDisplay remaining={p.frame.remaining} duration={p.frame.duration} paused={p.paused} finished={finished} color={ink} />
      {finished && <Label style={{ textAlign: 'center', color: ink }}>{p.frame.completed} rodadas concluídas</Label>}
      <TimerProgress frame={p.frame} color={ink} />
      <TimerControls paused={p.paused} finished={finished} color={ink} onPause={p.onPause} onRestart={p.onRestart} />
      <AudioVolumeHint enabled={p.audioEnabled ?? false} color={ink} />
      {p.error && <Label accessibilityLiveRegion="polite" style={{ color: ink, fontSize: 12 }}>{p.error}</Label>}
    </View>
  </SafeAreaView>;
}
const styles = StyleSheet.create({ root: { flex: 1 }, content: { flex: 1, paddingHorizontal: 12, paddingTop: 2, paddingBottom: 4 }, header: { flexDirection: 'row', alignItems: 'center', minHeight: 48, gap: 4 } });
