import React, { useState } from 'react';
import { Alert, AppState } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useApp } from '../state/AppProvider';
import { defaultSettings, Settings } from '../core/preferences';
import { AudioEvent, audioEvents, defaultEventSounds, sounds } from '../core/audio';
import { previewSound, stopPreview } from '../platform/nativeTimer';
import { Button, ChoiceGroup, IconButton, Label, Screen, ScreenHeader, Section, Toggle } from '../ui/components';
import { SoundPicker } from '../ui/SoundPicker';
import { AudioVolumeHint } from '../ui/AudioVolumeHint';
export default function SettingsScreen() {
  const { prefs, update } = useApp(); const settings = prefs.settings;
  const [editing, setEditing] = useState<AudioEvent | null>(null);
  const change = <K extends keyof Settings>(key: K, value: Settings[K]) => { stopPreview(); void update({ ...prefs, settings: { ...settings, [key]: value } }); };
  useFocusEffect(React.useCallback(() => {
    const listener = AppState.addEventListener('change', state => { if (state !== 'active') stopPreview(); });
    return () => { listener.remove(); stopPreview(); };
  }, []));
  return <Screen>
    <ScreenHeader title="Preferências" leading={<IconButton name="back" label="Voltar" onPress={() => router.back()} />} />
    <Section title="Sons">
      <Toggle title="Avisos sonoros" value={settings.sound} onChange={v => change('sound', v)} />
      <Toggle title="Contagem de 5 segundos" detail="Um bip a cada segundo antes da transição." value={settings.countdown} onChange={v => change('countdown', v)} />
      <ChoiceGroup title="Intensidade" value={settings.intensity} options={[{ value: 'normal', label: 'Normal' }, { value: 'strong', label: 'Forte' }, { value: 'maximum', label: 'Máximo' }]} onChange={v => change('intensity', v)} />
      {audioEvents.map(event => <Button key={event.id} secondary title={`${event.label} · ${sounds.find(s => s.id === settings.eventSounds[event.id])?.label ?? 'Sem som'}`} onPress={() => setEditing(event.id)} />)}
      <ChoiceGroup title={`Volume · ${Math.round(settings.volume * 100)}%`} value={settings.volume} options={[0, .25, .5, .75, 1].map(v => ({ value: v, label: `${v * 100}%` }))} onChange={v => change('volume', v)} />
      <Button title="Testar 5 bips e gongo" icon="sound" secondary compact onPress={() => { try { previewSound(settings, 'gong', true); } catch (e) { Alert.alert('Teste de áudio', (e as Error).message); } }} />
      <Button title="Restaurar áudio padrão" secondary compact onPress={() => Alert.alert('Restaurar áudio?', 'Os sons, a intensidade, o volume relativo, a voz e a vibração voltarão ao padrão.', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Restaurar', onPress: () => { stopPreview(); void update({ ...prefs, settings: { ...settings, sound: true, soundType: 'gong', countdown: true, intensity: 'strong', volume: 1, voice: defaultSettings.voice, vibration: defaultSettings.vibration, eventSounds: defaultEventSounds() } }); } }])} />
      <AudioVolumeHint enabled={settings.sound || settings.voice} />
      <Label muted style={{ fontSize: 12 }}>Intensidade relativa ao volume de mídia do Android.</Label>
    </Section>
    <Section title="Voz e vibração"><Toggle title="Anúncios por voz" detail="Requer uma voz pt-BR offline instalada no Android." value={settings.voice} onChange={v => change('voice', v)} /><Toggle title="Vibração" value={settings.vibration} onChange={v => change('vibration', v)} /></Section>
    <Section title="Tela">
      <Toggle title="Manter tela ligada" detail="Durante a sessão de treino." value={settings.keepAwake} onChange={v => change('keepAwake', v)} />
      <Toggle title="Tela cheia" detail="Ocultar as barras do sistema durante o treino." value={settings.fullscreen} onChange={v => change('fullscreen', v)} />
      <Label muted style={{ fontSize: 12 }}>O treino abre sempre na horizontal. O botão de rotação alterna entre horizontal e vertical. Os menus permanecem na vertical.</Label>
      <ChoiceGroup title="Aparência" value={settings.appearance} options={[{ value: 'dark', label: 'Escuro' }, { value: 'contrast', label: 'Alto contraste' }]} onChange={v => change('appearance', v)} />
    </Section>
    <Label muted style={{ fontSize: 12 }}>Alterações valem para o próximo treino. Os dados ficam salvos neste aparelho. Chamadas e políticas de bateria do Android podem interromper os avisos.</Label>
    {editing && <SoundPicker title={audioEvents.find(e => e.id === editing)!.label} value={settings.eventSounds[editing]} settings={settings} onClose={() => setEditing(null)} onSelect={sound => change('eventSounds', { ...settings.eventSounds, [editing]: sound })} />}
  </Screen>;
}
