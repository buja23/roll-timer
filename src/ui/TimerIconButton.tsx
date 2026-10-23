import React from 'react';
import { Pressable } from 'react-native';
import { Icon, IconName } from './Icon';
export function TimerIconButton({ name, label, color, onPress, primary = false, disabled = false }: { name: IconName; label: string; color: string; onPress: () => void; primary?: boolean; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => ({ width: primary ? 64 : 48, height: primary ? 64 : 48, justifyContent: 'center', alignItems: 'center', borderRadius: 32, backgroundColor: primary ? color === '#FFFFFF' ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.10)' : 'transparent', opacity: disabled ? .4 : pressed ? .55 : 1 })}><Icon name={name} color={color} size={primary ? 36 : 28} /></Pressable>;
}
