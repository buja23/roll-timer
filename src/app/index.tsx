import React, { useState } from 'react';
import { router } from 'expo-router';
import { Alert, PermissionsAndroid, Platform } from 'react-native';
import { useApp } from '../state/AppProvider';
import { builtinPresets, Preset } from '../core/preferences';
import { nativeAvailable, startSession } from '../platform/nativeTimer';
import { ActionMenu, MenuAction } from '../ui/ActionMenu';
import { HomeContent } from '../ui/HomeContent';
export default function Home() {
  const { prefs, update, session } = useApp();
  const [menu, setMenu] = useState<Preset | 'list' | null>(null);
  const start = async (preset?: Preset) => {
    try {
      if (Platform.OS === 'android' && Number(Platform.Version) >= 33 && nativeAvailable) await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS, { title: 'Controles do treino', message: 'Mostrar o tempo e os controles de pausa e encerramento na notificação durante o treino.', buttonPositive: 'Continuar', buttonNegative: 'Agora não' });
      startSession(preset?.workout ?? prefs.workout, prefs.settings); router.push('/timer');
    } catch (e) { Alert.alert('Não foi possível iniciar', (e as Error).message); }
  };
  const requestStart = (preset?: Preset) => {
    if (session) Alert.alert('Substituir sessão?', 'O treino anterior será encerrado.', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Iniciar novo', onPress: () => void start(preset) }]);
    else void start(preset);
  };
  const presetActions = (preset: Preset): MenuAction[] => [
    { title: 'Iniciar este treino', icon: 'play', onPress: () => requestStart(preset) },
    { title: 'Editar favorito', icon: 'edit', onPress: () => router.push({ pathname: '/workout', params: { presetId: preset.id } }) },
    { title: 'Duplicar favorito', icon: 'copy', onPress: () => { const entry = { ...preset, id: `custom-${Date.now()}`, name: `${preset.name} (cópia)`, builtin: false, workout: { ...preset.workout } }; void update({ ...prefs, presets: [...prefs.presets, entry], workout: entry.workout, selectedPresetId: entry.id }); } },
    ...(!preset.builtin ? [{ title: 'Excluir favorito', icon: 'delete' as const, danger: true, onPress: () => Alert.alert('Excluir favorito?', preset.name, [{ text: 'Cancelar', style: 'cancel' }, { text: 'Excluir', style: 'destructive', onPress: () => void update({ ...prefs, presets: prefs.presets.filter(x => x.id !== preset.id), selectedPresetId: prefs.selectedPresetId === preset.id ? undefined : prefs.selectedPresetId }) }]) }] : []),
  ];
  const listActions: MenuAction[] = [
    { title: 'Criar favorito', icon: 'plus', onPress: () => router.push({ pathname: '/workout', params: { create: '1' } }) },
    { title: 'Restaurar favoritos padrão', icon: 'restart', onPress: () => Alert.alert('Restaurar padrões?', 'Os favoritos personalizados serão mantidos.', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Restaurar', onPress: () => void update({ ...prefs, presets: [...builtinPresets(), ...prefs.presets.filter(x => !x.builtin && !['quick', 'standard', 'long'].includes(x.id))] }) }]) },
  ];
  return <><HomeContent prefs={prefs} sessionExists={Boolean(session)} onStart={() => requestStart()} onResume={() => router.push('/timer')} onConfigure={() => router.push('/workout')} onSettings={() => router.push('/settings')} onCreate={() => router.push({ pathname: '/workout', params: { create: '1' } })} onSelect={p => void update({ ...prefs, workout: { ...p.workout }, selectedPresetId: p.id })} onPresetMenu={setMenu} onListMenu={() => setMenu('list')} /><ActionMenu visible={menu !== null} title={menu && menu !== 'list' ? menu.name : 'Favoritos'} actions={menu && menu !== 'list' ? presetActions(menu) : listActions} onClose={() => setMenu(null)} /></>;
}
