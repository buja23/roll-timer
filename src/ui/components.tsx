import React from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, TextProps, useWindowDimensions, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, sizes, space, type } from './theme';
import { Icon, IconName } from './Icon';
export { colors } from './theme';
export function Screen({ children }: React.PropsWithChildren) {
  return <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={s.screen}><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.page}>{children}</ScrollView></KeyboardAvoidingView></SafeAreaView>;
}
export function Label({ children, muted = false, style, ...props }: TextProps & { muted?: boolean }) { return <Text {...props} style={[muted ? s.muted : s.text, style]}>{children}</Text>; }
export function Heading({ children, style }: React.PropsWithChildren<{ style?: object }>) { return <Text accessibilityRole="header" style={[s.heading, style]}>{children}</Text>; }
export function Card({ children, style }: React.PropsWithChildren<{ style?: ViewStyle }>) { return <View style={[s.card, style]}>{children}</View>; }
export interface ButtonProps { title: string; onPress: () => void; secondary?: boolean; danger?: boolean; disabled?: boolean; compact?: boolean; icon?: IconName; testID?: string }
export function Button({ title, onPress, secondary = false, danger = false, disabled = false, compact = false, icon, testID }: ButtonProps) {
  const ink = danger ? '#FCA5A5' : colors.text;
  return <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={title} accessibilityState={{ disabled }} onPress={onPress} disabled={disabled} style={({ pressed }) => [s.button, compact && { minHeight: sizes.touch, paddingVertical: 10 }, secondary && s.secondary, danger && s.destructive, { opacity: disabled ? .4 : pressed ? .7 : 1 }]}>{icon && <Icon name={icon} size={20} color={ink} />}<Text style={[s.buttonText, { color: ink }]}>{title}</Text></Pressable>;
}
export const PrimaryButton = Button;
export function IconButton({ name, label, onPress, disabled = false, selected = false }: { name: IconName; label: string; onPress: () => void; disabled?: boolean; selected?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled, selected }} disabled={disabled} onPress={onPress} style={({ pressed }) => [s.iconButton, selected && { backgroundColor: colors.elevated }, { opacity: disabled ? .4 : pressed ? .6 : 1 }]}><Icon name={name} /></Pressable>;
}
export function ScreenHeader({ title, subtitle, action, leading }: { title: string; subtitle?: string; action?: React.ReactNode; leading?: React.ReactNode }) {
  const { width, fontScale } = useWindowDimensions();
  const available = Math.min(600, width - 40) - (leading ? 60 : 0) - (action ? 60 : 0);
  const longestWord = Math.max(...title.split(' ').map(w => w.length));
  const fontSize = Math.min(type.title, available / (longestWord * .65 * fontScale));
  return <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>{leading}<View style={{ flex: 1, minWidth: 0 }}><Heading style={{ fontSize }}>{title}</Heading>{subtitle && <Label muted style={{ marginTop: 4 }}>{subtitle}</Label>}</View>{action}</View>;
}
export function Section({ title, children }: React.PropsWithChildren<{ title: string }>) {
  return <View style={{ gap: 12 }}><Label style={s.sectionTitle}>{title}</Label><Card>{children}</Card></View>;
}
export function ChoiceGroup<T extends string | number>({ title, value, options, onChange }: { title: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  const { fontScale } = useWindowDimensions();
  return <View style={{ gap: 10 }}><Label>{title}</Label><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{options.map(option => <Pressable key={option.value} accessibilityRole="radio" accessibilityLabel={`${title}: ${option.label}`} accessibilityState={{ checked: option.value === value }} onPress={() => onChange(option.value)} style={({ pressed }) => ({ minWidth: Math.max(...option.label.split(' ').map(w => w.length)) * 14 * .62 * fontScale + 24, minHeight: 48, padding: 12, alignItems: 'center', justifyContent: 'center', flexGrow: 1, borderRadius: 8, backgroundColor: value === option.value ? colors.primary : colors.elevated, opacity: pressed ? .6 : 1 })}><Label style={{ fontSize: 14, fontWeight: '600', textAlign: 'center' }}>{option.label}</Label></Pressable>)}</View></View>;
}
export function Toggle({ title, detail, value, onChange }: { title: string; detail?: string; value: boolean; onChange: (v: boolean) => void }) {
  return <View style={s.row}><View style={{ flex: 1, minWidth: 0 }}><Label>{title}</Label>{detail && <Label muted style={{ fontSize: 12, marginTop: 4 }}>{detail}</Label>}</View><Switch accessibilityLabel={title} value={value} onValueChange={onChange} trackColor={{ false: '#45454B', true: '#991B1B' }} thumbColor={value ? colors.accent : '#D4D4D8'} /></View>;
}
export function Field({ title, value, onChange, numeric = false, maxLength = 40, accessibilityLabel = title }: { title: string; value: string; onChange: (value: string) => void; numeric?: boolean; maxLength?: number; accessibilityLabel?: string }) {
  return <View style={{ flex: 1, minWidth: 0, gap: 6 }}><Label muted style={{ fontSize: 12 }}>{title}</Label><TextInput accessibilityLabel={accessibilityLabel} value={value} onChangeText={onChange} keyboardType={numeric ? 'number-pad' : 'default'} maxLength={maxLength} selectTextOnFocus style={s.input} placeholderTextColor={colors.muted} /></View>;
}
export function DurationField({ title, value, onChange }: { title: string; value: string[]; onChange: (v: string[]) => void }) {
  const { width, fontScale } = useWindowDimensions();
  const compact = width >= 360 && fontScale <= 1.15;
  return <View style={{ gap: compact ? 16 : 8, flexDirection: compact ? 'row' : 'column', alignItems: compact ? 'center' : 'stretch' }}><Label style={{ fontWeight: '600', flex: compact ? 1 : undefined }}>{title}</Label><View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', width: compact ? 164 : undefined }}><Field title="Minutos" accessibilityLabel={`${title} · min`} numeric maxLength={2} value={value[0]} onChange={v => onChange([v, value[1]])} /><Label muted>:</Label><Field title="Segundos" accessibilityLabel={`${title} · seg`} numeric maxLength={2} value={value[1]} onChange={v => onChange([value[0], v])} /></View></View>;
}
export const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg }, page: { padding: 20, gap: 24, maxWidth: 640, width: '100%', alignSelf: 'center', paddingBottom: 32 },
  heading: { color: colors.text, fontWeight: '800', fontSize: type.title, letterSpacing: -.6 }, text: { color: colors.text, fontSize: type.body }, muted: { color: colors.muted, fontSize: 13, lineHeight: 20 },
  sectionTitle: { color: colors.muted, fontSize: type.caption, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: space.lg, gap: 16 },
  button: { backgroundColor: colors.primary, borderRadius: radius.sm, paddingVertical: 14, paddingHorizontal: 16, minHeight: sizes.button, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  secondary: { backgroundColor: colors.elevated }, destructive: { backgroundColor: '#321619' }, buttonText: { color: colors.text, fontSize: type.button, fontWeight: '700', textAlign: 'center', flexShrink: 1 },
  iconButton: { width: sizes.touch, height: sizes.touch, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 }, input: { backgroundColor: colors.bg, color: colors.text, borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, padding: 12, fontSize: 18, minHeight: sizes.touch, fontVariant: ['tabular-nums'] },
});
