import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { clockLayout, formatDisplayTime } from './layout';
export function TimerDisplay({ remaining, duration, paused, finished, color }: { remaining: number; duration: number; paused: boolean; finished: boolean; color: string }) {
  const [area, setArea] = useState({ width: 0, height: 0 });
  const text = formatDisplayTime(remaining, duration);
  const { fontSize } = clockLayout(area.width, area.height, text);
  return <View testID="timer-display" onLayout={e => { const { width, height } = e.nativeEvent.layout; setArea(old => old.width === width && old.height === height ? old : { width, height }); }} style={styles.area}>
    <Text testID="timer-digits" allowFontScaling={false} accessibilityLabel={`${Math.ceil(remaining / 1000)} segundos restantes${paused && !finished ? ', pausado' : ''}`} style={[styles.digits, { fontSize, lineHeight: fontSize * .9, color }]}>{text}</Text>
  </View>;
}
const styles = StyleSheet.create({ area: { flex: 1, minHeight: 0, alignSelf: 'stretch', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }, digits: { fontFamily: 'RollTimerClock', fontWeight: '700', fontVariant: ['tabular-nums'], includeFontPadding: false, textAlign: 'center', flexShrink: 0, overflow: 'hidden' } });
