import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import * as Orientation from 'expo-screen-orientation';
import * as NavigationBar from 'expo-navigation-bar';
import { Platform } from 'react-native';
import { Settings } from '../core/preferences';
import { DisplayOrientation, OrientationController } from './orientationController';
const locks = { auto: Orientation.OrientationLock.DEFAULT, portrait: Orientation.OrientationLock.PORTRAIT_UP, landscape: Orientation.OrientationLock.LANDSCAPE };
export function useTrainingDisplay(active: boolean, settings: Settings | undefined, isLandscape: boolean, onSelected: (mode: DisplayOrientation) => void) {
  const [error, setError] = useState<string | null>(null);
  const [rotating, setRotating] = useState(false);
  const [screenOrientation, setScreenOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const desired = useRef<DisplayOrientation>('landscape');
  const busy = useRef(false);
  const [controller] = useState(() => new OrientationController({
    lock: async mode => {
      if (Platform.OS === 'web') return;
      if (!(await Orientation.supportsOrientationLockAsync(locks[mode]))) throw new Error('Orientação não suportada');
      await Orientation.lockAsync(locks[mode]);
    },
    restore: async () => { if (Platform.OS !== 'web') await Orientation.lockAsync(await Orientation.supportsOrientationLockAsync(Orientation.OrientationLock.PORTRAIT_UP) ? Orientation.OrientationLock.PORTRAIT_UP : Orientation.OrientationLock.DEFAULT); },
  }));
  useFocusEffect(useCallback(() => {
    desired.current = 'landscape';
    setScreenOrientation('landscape');
    void controller.enter(desired.current).catch(() => setError('Não foi possível aplicar a orientação. Você pode tentar pelo botão de rotação.'));
    return () => { busy.current = false; void controller.leave().catch(() => undefined); };
  }, [controller]));
  useFocusEffect(useCallback(() => {
    if (Platform.OS !== 'android') return;
    void NavigationBar.setVisibilityAsync(active && settings?.fullscreen ? 'hidden' : 'visible').catch(() => setError('O aparelho não permitiu ocultar a barra de navegação.'));
    return () => { void NavigationBar.setVisibilityAsync('visible').catch(() => undefined); };
  }, [active, settings?.fullscreen]));
  const toggleOrientation = async () => {
    if (busy.current) return;
    busy.current = true; setRotating(true);
    const previous = desired.current;
    const landscape = previous === 'auto' ? isLandscape : previous === 'landscape';
    const mode = landscape ? 'portrait' : 'landscape';
    desired.current = mode;
    try { if (await controller.rotate(mode)) { setScreenOrientation(mode); setError(null); onSelected(mode); } }
    catch { desired.current = previous; setError('Não foi possível girar a tela. Tente novamente ou confira as restrições do aparelho.'); }
    finally { busy.current = false; setRotating(false); }
  };
  return { error, rotating, toggleOrientation, screenOrientation };
}
