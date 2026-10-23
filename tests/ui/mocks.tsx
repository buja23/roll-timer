// Development-only harness. Native APIs are replaced for browser layout checks.
import React, { createContext, useContext, useEffect, useState } from 'react';
import { defaults, Preferences, Settings } from '../../src/core/preferences';
import { defaultWorkout, makePlan, Workout } from '../../src/core/timer';
import type { NativeSession } from '../../src/platform/nativeTimer';
const query = new URLSearchParams(window.location.search);
const workout = { ...defaultWorkout, fight: query.has('hours') ? 5999 : query.has('seconds') ? Number(query.get('seconds')) : 300 };
const plan = makePlan(workout);
const phase = query.get('phase');
const elapsed = phase === 'prepare' ? 5000 : phase === 'rest' ? 310000 : phase === 'finished' ? plan.total : query.has('running') ? 309200 : query.has('urgent') ? 307000 : 10000;
export const trace = { commands: [] as string[], locks: [] as number[], alerts: [] as string[], session: null as NativeSession | null, prefs: defaults(), selectedLock: 0, confirm: true, hardwareBack: null as null | (() => boolean), tick: (_elapsed: number) => {} };
declare global { interface Window { __rollPreview: typeof trace } }
window.__rollPreview = trace;
const initial: NativeSession = { workout, plan, currentElapsed: elapsed, settings: { ...defaults().settings }, paused: query.has('paused') };
const AppContext = createContext({ prefs: defaults(), session: null as NativeSession | null, update: async (_next: Preferences) => true, ready: true, error: null, refresh: () => {} });
const NavContext = createContext<Record<string, string>>({});
const runtime = { setSession: (_s: NativeSession | null) => {} };
export const PreviewParams = NavContext.Provider;
export function PreviewProvider({ children }: React.PropsWithChildren) {
  const [prefs, setPrefs] = useState(() => { try { return JSON.parse(localStorage.getItem('roll-preview') ?? 'null') ?? defaults(); } catch { return defaults(); } });
  const [session, setSession] = useState<NativeSession | null>(query.get('screen') === 'timer' ? initial : null);
  useEffect(() => { runtime.setSession = setSession; trace.tick = next => setSession(s => s ? { ...s, currentElapsed: next } : s); }, []);
  useEffect(() => {
    if (!query.has('running')) return;
    const anchor = performance.now();
    const interval = setInterval(() => setSession(s => s ? { ...s, currentElapsed: elapsed + performance.now() - anchor } : s), 80);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => { trace.session = session; trace.prefs = prefs; }, [session, prefs]);
  return <AppContext.Provider value={{ prefs, session, update: async next => { setPrefs(next); localStorage.setItem('roll-preview', JSON.stringify(next)); return true; }, ready: true, error: null, refresh: () => {} }}>{children}</AppContext.Provider>;
}
export const useApp = () => useContext(AppContext);
export function useFocusEffect(effect: () => void | (() => void)) { useEffect(effect, [effect]); }
export const useLocalSearchParams = () => useContext(NavContext);
const navigate = (type: string, path?: string | { pathname: string; params?: Record<string, string> }) => window.dispatchEvent(new CustomEvent('preview-navigation', { detail: { type, path } }));
export const router = { push: (p: string | { pathname: string; params?: Record<string, string> }) => navigate('push', p), replace: (p: string) => navigate('replace', p), back: () => navigate('back') };
export const nativeAvailable = true;
export const command = (action: string) => { trace.commands.push(action); const s = trace.session; if (!s) return; if (action === 'stop') runtime.setSession(null); else if (action === 'pause' || action === 'resume') runtime.setSession({ ...s, paused: action === 'pause' }); else if (action === 'restart') runtime.setSession({ ...s, currentElapsed: 0, paused: false }); };
export const stopPreview = () => {};
export const previewSound = (_settings: Settings) => { trace.commands.push('preview'); };
export const startSession = (w: Workout, settings: Settings) => { trace.commands.push('start'); runtime.setSession({ workout: w, plan: makePlan(w), settings, currentElapsed: 0, paused: false }); };
export const StatusBar = () => null;
export const OrientationLock = { DEFAULT: 0, PORTRAIT_UP: 1, LANDSCAPE: 2 };
export const supportsOrientationLockAsync = async () => true;
export const lockAsync = async (mode: number) => { trace.locks.push(mode); trace.selectedLock = mode; };
export const setVisibilityAsync = async () => {};
