import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Preset } from '../core/preferences';
import { formatDisplayTime } from './layout';
import { colors, IconButton, Label } from './components';
export function PresetCard({ preset, selected, onSelect, onMenu }: { preset: Preset; selected: boolean; onSelect: () => void; onMenu: () => void }) {
  return <View style={[styles.item, selected && { backgroundColor: '#231113' }]}>
    <Pressable testID={`preset-${preset.id}`} accessibilityRole="radio" accessibilityState={{ checked: selected }} accessibilityLabel={`${preset.name}, ${formatDisplayTime(preset.workout.fight * 1000)} de luta, ${preset.workout.rounds} rodadas`} onPress={onSelect} style={({ pressed }) => [styles.select, { opacity: pressed ? .6 : 1 }]}>
      <View style={[styles.dot, selected && { borderColor: colors.accent }]}>{selected && <View style={styles.fill} />}</View>
      <View style={{ flex: 1, minWidth: 0, gap: 5 }}><Label style={{ fontWeight: '700' }}>{preset.name}</Label><Label muted>{formatDisplayTime(preset.workout.fight * 1000)} luta · {formatDisplayTime(preset.workout.rest * 1000)} descanso · {preset.workout.infinite ? '∞' : preset.workout.rounds} rodadas</Label></View>
    </Pressable>
    <IconButton name="more" label={`Opções de ${preset.name}`} onPress={onMenu} />
  </View>;
}
const styles = StyleSheet.create({ item: { flexDirection: 'row', alignItems: 'center', borderRadius: 8, paddingRight: 4 }, select: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, minHeight: 72 }, dot: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: '#626269', alignItems: 'center', justifyContent: 'center' }, fill: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent } });
