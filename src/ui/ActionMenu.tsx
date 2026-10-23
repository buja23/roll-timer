import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, IconName } from './Icon';
import { colors, IconButton, Label } from './components';
export interface MenuAction { title: string; icon: IconName; onPress: () => void; danger?: boolean }
export function ActionMenu({ visible, title, actions, onClose }: { visible: boolean; title: string; actions: MenuAction[]; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} supportedOrientations={['portrait', 'landscape']}>
    <View style={styles.overlay} accessibilityViewIsModal>
      <Pressable accessible={false} style={StyleSheet.absoluteFill} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16), marginLeft: insets.left, marginRight: insets.right, marginTop: insets.top + 8 }]}>
        <View style={styles.header}><Label accessibilityRole="header" style={{ fontSize: 17, fontWeight: '700', flex: 1 }}>{title}</Label><IconButton name="back" label="Fechar menu" onPress={onClose} /></View>
        <ScrollView keyboardShouldPersistTaps="handled">{actions.map(action => <Pressable key={action.title} accessibilityRole="button" onPress={() => { onClose(); action.onPress(); }} style={({ pressed }) => [styles.action, { opacity: pressed ? .6 : 1 }]}><Icon name={action.icon} color={action.danger ? '#FCA5A5' : colors.text} /><Label style={{ flex: 1, color: action.danger ? '#FCA5A5' : colors.text }}>{action.title}</Label></Pressable>)}</ScrollView>
      </View>
    </View>
  </Modal>;
}
const styles = StyleSheet.create({ overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000099', paddingHorizontal: 12 }, sheet: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, maxHeight: '85%', width: '100%', maxWidth: 560, alignSelf: 'center' }, header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 8 }, action: { minHeight: 52, flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 8, gap: 16 } });
