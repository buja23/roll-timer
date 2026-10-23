import React from 'react';
import { Alert } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useApp } from '../state/AppProvider';
import { Settings } from '../core/preferences';
import { previewSound, stopPreview } from '../platform/nativeTimer';
import { Button, ChoiceGroup, IconButton, Label, Screen, ScreenHeader, Section, Toggle } from '../ui/components';
export default function SettingsScreen() {
  const { prefs, update } = useApp(); const settings = prefs.settings;
  const change = <K extends keyof Settings>(key: K, value: Settings[K]) => void update({ ...prefs, settings: { ...settings, [key]: value } });
  useFocusEffect(React.useCallback(() => () => stopPreview(), []));
  return <Screen>
    <ScreenHeader title="Preferências" leading={<IconButton name="back" label="Voltar" onPress={() => router.back()} />} />
    <Section title="Sons">
      <Toggle title="Avisos sonoros" value={settings.sound} onChange={v => change('sound', v)} />
      <Toggle title="Contagem de 5 segundos" detail="Um bip a cada segundo antes da transição." value={settings.countdown} onChange={v => change('countdown', v)} />
      <ChoiceGroup title="Som de transição" value={settings.soundType} options={[{ value: 'beep', label: 'Bip' }, { value: 'whistle', label: 'Apito' }, { value: 'gong', label: 'Gongo' }]} onChange={v => change('soundType', v)} />
      <ChoiceGroup title={`Volume · ${Math.round(settings.volume * 100)}%`} value={settings.volume} options={[0, .25, .5, .75, 1].map(v => ({ value: v, label: `${v * 100}%` }))} onChange={v => change('volume', v)} />
      <Button title="Testar som" icon="sound" secondary compact onPress={() => { try { previewSound(settings); } catch (e) { Alert.alert('Teste de áudio', (e as Error).message); } }} />
      <Label muted style={{ fontSize: 12 }}>Intensidade relativa ao volume de mídia do Android.</Label>
    </Section>
    <Section title="Voz e vibração"><Toggle title="Anúncios por voz" detail="Requer uma voz pt-BR offline instalada no Android." value={settings.voice} onChange={v => change('voice', v)} /><Toggle title="Vibração" value={settings.vibration} onChange={v => change('vibration', v)} /></Section>
    <Section title="Tela">
      <Toggle title="Manter tela ligada" detail="Durante a sessão de treino." value={settings.keepAwake} onChange={v => change('keepAwake', v)} />
      <Toggle title="Tela cheia" detail="Ocultar as barras do sistema durante o treino." value={settings.fullscreen} onChange={v => change('fullscreen', v)} />
      <ChoiceGroup title="Orientação inicial" value={settings.orientation} options={[{ value: 'auto', label: 'Automática' }, { value: 'portrait', label: 'Vertical' }, { value: 'landscape', label: 'Horizontal' }]} onChange={v => change('orientation', v)} />
      <Label muted style={{ fontSize: 12 }}>O botão de rotação permite mudar a orientação durante o treino.</Label>
      <ChoiceGroup title="Aparência" value={settings.appearance} options={[{ value: 'dark', label: 'Escuro' }, { value: 'contrast', label: 'Alto contraste' }]} onChange={v => change('appearance', v)} />
    </Section>
    <Label muted style={{ fontSize: 12 }}>Alterações valem para o próximo treino. Os dados ficam salvos neste aparelho. Chamadas e políticas de bateria do Android podem interromper os avisos.</Label>
  </Screen>;
}
