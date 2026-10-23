import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { defaults, loadPreferences, Preferences, savePreferences } from '../core/preferences';
import { command, getSession, NativeSession } from '../platform/nativeTimer';
import { frameAt } from '../core/timer';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
interface AppData {
  prefs: Preferences; update: (next: Preferences) => Promise<boolean>; ready: boolean;
  error: string | null; session: NativeSession | null; refresh: () => void;
}
const AppContext = createContext<AppData | null>(null);
export function AppProvider({ children }: React.PropsWithChildren) {
  const [prefs, setPrefs] = useState(defaults);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<NativeSession | null>(null);
  const alive = useRef(true);
  const saving = useRef<Promise<unknown>>(Promise.resolve());
  const stayAwake = Boolean(session?.settings.keepAwake && frameAt(session.plan, session.currentElapsed).phase !== 'finished');
  useEffect(() => {
    let cancelled = false;
    if (stayAwake) void activateKeepAwakeAsync('roll-training').then(() => { if (cancelled) void deactivateKeepAwake('roll-training').catch(() => undefined); }).catch(() => setError('Não foi possível manter a tela ligada.'));
    else void deactivateKeepAwake('roll-training').catch(() => undefined);
    return () => { cancelled = true; void deactivateKeepAwake('roll-training').catch(() => undefined); };
  }, [stayAwake]);
  const refresh = () => { try { setSession(getSession()); } catch (e) { setError(`Não foi possível ler a sessão: ${String(e)}`); } };
  useEffect(() => {
    alive.current = true;
    loadPreferences(AsyncStorage).then(p => { if (alive.current) setPrefs(p); }).catch(() => setError('Não foi possível carregar as preferências locais.')).finally(() => setReady(true));
    const timer = setInterval(refresh, 150);
    const sub = AppState.addEventListener('change', state => { if (state === 'active') refresh(); });
    try { const current = getSession(); if (current && frameAt(current.plan, current.currentElapsed).phase !== 'finished') command('restore'); } catch { /* Displayed by refresh. */ }
    return () => { alive.current = false; clearInterval(timer); sub.remove(); };
  }, []);
  const update = async (next: Preferences) => {
    setPrefs(next);
    const operation = saving.current.then(() => savePreferences(AsyncStorage, next));
    saving.current = operation.catch(() => undefined);
    try { await operation; setError(null); return true; }
    catch { setError('Falha ao salvar. Verifique o armazenamento do aparelho e tente novamente.'); return false; }
  };
  return <AppContext.Provider value={{ prefs, update, ready, error, session, refresh }}>{children}</AppContext.Provider>;
}
export function useApp() { const app = useContext(AppContext); if (!app) throw new Error('AppProvider ausente'); return app; }
