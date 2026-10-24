import React from 'react';
import { Alert, Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EventSound, sounds } from '../core/audio';
import { Settings } from '../core/preferences';
import { previewSound, stopPreview } from '../platform/nativeTimer';
import { colors, IconButton, Label } from './components';
export function SoundPicker({ title, value, settings, onSelect, onClose }: { title: string; value: EventSound; settings: Settings; onSelect: (value: EventSound) => void; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const close = () => { stopPreview(); onClose(); };
  return <Modal visible transparent animationType="fade" onRequestClose={close} supportedOrientations={['portrait']}>
    <View accessibilityViewIsModal style={{ flex: 1, backgroundColor: '#000000AA', justifyContent: 'center', paddingHorizontal: 16, paddingTop: insets.top + 8, paddingBottom: insets.bottom + 8 }}>
      <View style={{ maxHeight: '90%', backgroundColor: colors.surface, borderRadius: 16, padding: 16, gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Label accessibilityRole="header" style={{ flex: 1, fontSize: 18, fontWeight: '700' }}>{title}</Label><IconButton name="back" label="Fechar sons" onPress={close} /></View>
        <Label muted style={{ fontSize: 12 }}>Ouça pela opção ao lado antes de selecionar.</Label>
        <ScrollView>{[{ id: 'none' as const, label: 'Sem som' }, ...sounds].map(sound => <View key={sound.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderBottomWidth: 1, borderBottomColor: colors.line }}>
          <Pressable accessibilityRole="radio" accessibilityLabel={`Selecionar ${sound.label}`} accessibilityState={{ checked: value === sound.id }} onPress={() => { stopPreview(); onSelect(sound.id); onClose(); }} style={({ pressed }) => ({ flex: 1, minHeight: 64, justifyContent: 'center', padding: 10, borderRadius: 8, backgroundColor: value === sound.id ? '#451A1A' : 'transparent', opacity: pressed ? .6 : 1 })}><Label style={{ fontWeight: value === sound.id ? '800' : '500' }}>{sound.label}</Label></Pressable>
          {sound.id !== 'none' && <IconButton name="sound" label={`Ouvir ${sound.label}`} onPress={() => { try { previewSound(settings, sound.id); } catch (e) { Alert.alert('Teste de áudio', (e as Error).message); } }} />}
        </View>)}</ScrollView>
      </View>
    </View>
  </Modal>;
}
