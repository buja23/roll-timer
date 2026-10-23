import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, BackHandler, useWindowDimensions } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useApp } from '../state/AppProvider';
import { frameAt } from '../core/timer';
import { command } from '../platform/nativeTimer';
import { useTrainingDisplay } from '../platform/useTrainingDisplay';
import { Button, Label, Screen } from '../ui/components';
import { phaseSurface } from '../ui/TimerIndicators';
import { TimerPresentation } from '../ui/TimerPresentation';
export default function TimerScreen() {
  const { session, prefs, update } = useApp();
  const { width, height } = useWindowDimensions();
  const confirming = useRef(false);
  const [waiting, setWaiting] = useState(true);
  const frame = session ? frameAt(session.plan, session.currentElapsed) : null;
  const hasSession = Boolean(session);
  const finished = frame?.phase === 'finished';
  const { error, rotating, toggleOrientation } = useTrainingDisplay(Boolean(session && !finished), session?.settings, width > height, mode => void update({ ...prefs, settings: { ...prefs.settings, orientation: mode } }));
  useEffect(() => { const timeout = setTimeout(() => setWaiting(false), 1500); return () => clearTimeout(timeout); }, []);
  const invoke = useCallback((action: Parameters<typeof command>[0]) => { try { command(action); return true; } catch (e) { Alert.alert('Ação indisponível', String(e)); return false; } }, []);
  const restart = () => {
    if (finished) invoke('restart');
    else Alert.alert('Reiniciar treino?', 'O tempo e as rodadas voltarão ao início.', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Reiniciar', onPress: () => invoke('restart') }]);
  };
  const end = useCallback(() => {
    const stop = () => { confirming.current = false; if (invoke('stop')) router.replace('/'); };
    if (!hasSession) { router.replace('/'); return; }
    if (finished) { stop(); return; }
    if (confirming.current) return;
    confirming.current = true;
    const cancel = () => { confirming.current = false; };
    Alert.alert('Encerrar treino?', 'O temporizador e os avisos serão interrompidos.', [{ text: 'Continuar treino', style: 'cancel', onPress: cancel }, { text: 'Encerrar', style: 'destructive', onPress: stop }], { cancelable: true, onDismiss: cancel });
  }, [finished, hasSession, invoke]);
  useFocusEffect(useCallback(() => { const listener = BackHandler.addEventListener('hardwareBackPress', () => { end(); return true; }); return () => listener.remove(); }, [end]));
  if (!session || !frame) return <Screen><Label>{waiting ? 'Iniciando sessão…' : 'Nenhuma sessão ativa.'}</Label><Button title="Voltar ao início" onPress={() => router.replace('/')} /></Screen>;
  return <>
    <StatusBar style={phaseSurface[frame.phase].ink === '#FFFFFF' ? 'light' : 'dark'} hidden={session.settings.fullscreen && !finished} />
    <TimerPresentation frame={frame} workout={session.workout} paused={session.paused} rotating={rotating} error={error} onBack={end} onRotate={() => void toggleOrientation()} onPause={() => invoke(session.paused ? 'resume' : 'pause')} onRestart={restart} />
  </>;
}
