import React from 'react';
import { View } from 'react-native';
import { Frame, phaseLabel, Workout } from '../core/timer';
import { Label } from './components';
export const phaseSurface = {
  prepare: { background: '#FACC15', ink: '#000000' },
  fight: { background: '#9AFF3D', ink: '#000000' },
  rest: { background: '#EF3128', ink: '#FFFFFF' },
  finished: { background: '#0A0A0B', ink: '#FFFFFF' },
} as const;
export function PhaseIndicator({ frame, paused, color, compact = false }: { frame: Frame; paused: boolean; color: string; compact?: boolean }) {
  return <View style={{ alignItems: 'center' }}><Label testID="timer-phase" accessibilityRole="header" style={{ color, fontWeight: '900', fontSize: compact ? 16 : 22, letterSpacing: 2, textAlign: 'center' }}>{phaseLabel[frame.phase]}{paused && frame.phase !== 'finished' ? ' · PAUSADO' : ''}</Label></View>;
}
export function RoundIndicator({ frame, workout, color }: { frame: Frame; workout: Workout; color: string }) {
  return <View style={{ alignItems: 'center', gap: 2 }}><Label style={{ color, fontSize: 13, fontWeight: '800', textAlign: 'center' }}>RODADA {frame.round} / {workout.infinite ? '∞' : workout.rounds}</Label>{(workout.cycles > 1 || workout.infinite) && <Label style={{ color, opacity: .75, fontSize: 11, fontWeight: '600', textAlign: 'center' }}>CICLO {frame.cycle}{workout.infinite ? '' : ` / ${workout.cycles}`}</Label>}</View>;
}
export function TimerProgress({ frame, color }: { frame: Frame; color: string }) {
  const progress = frame.duration > 0 ? Math.max(0, Math.min(1, 1 - frame.remaining / frame.duration)) : 1;
  return <View testID="timer-progress" accessibilityRole="progressbar" accessibilityLabel="Progresso da etapa" accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }} style={{ height: 3, backgroundColor: color === '#FFFFFF' ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.12)', borderRadius: 2 }}><View style={{ width: `${progress * 100}%`, height: '100%', backgroundColor: color, opacity: .55, borderRadius: 2 }} /></View>;
}
