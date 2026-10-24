import { defaultWorkout, validateWorkout, Workout } from './timer';
import { decodeEventSounds, defaultEventSounds, EventSounds, Intensity } from './audio';
export interface Settings { sound: boolean; soundType: 'beep' | 'whistle' | 'gong'; eventSounds: EventSounds; intensity: Intensity; voice: boolean; vibration: boolean; countdown: boolean; volume: number; keepAwake: boolean; orientation: 'auto' | 'portrait' | 'landscape'; fullscreen: boolean; appearance: 'dark' | 'contrast' }
export interface Preset { id: string; name: string; workout: Workout; builtin?: boolean }
export interface Preferences { settings: Settings; workout: Workout; presets: Preset[]; selectedPresetId?: string }
export const defaultSettings: Settings = { sound: true, soundType: 'gong', eventSounds: defaultEventSounds(), intensity: 'strong', voice: false, vibration: false, countdown: true, volume: 1, keepAwake: true, orientation: 'landscape', fullscreen: false, appearance: 'dark' };
export const builtinPresets = (): Preset[] => [
  { id: 'quick', name: 'Rola rápido', workout: { ...defaultWorkout, fight: 180, rest: 30 }, builtin: true },
  { id: 'standard', name: 'Rola padrão', workout: { ...defaultWorkout }, builtin: true },
  { id: 'long', name: 'Rola longo', workout: { ...defaultWorkout, fight: 420 }, builtin: true },
];
export const defaults = (): Preferences => ({ settings: { ...defaultSettings, eventSounds: defaultEventSounds() }, workout: { ...defaultWorkout }, presets: builtinPresets() });
export interface Storage { getItem(key: string): Promise<string | null>; setItem(key: string, value: string): Promise<void> }
export const PREF_KEY = '@roll-timer/preferences/v1';
export function decodePreferences(raw: string | null): Preferences {
  const fallback = defaults(); if (!raw) return fallback;
  try {
    const value = JSON.parse(raw) as Preferences;
    const settings = { ...fallback.settings };
    const source = value.settings;
    if (source) for (const k of Object.keys(settings) as (keyof Settings)[]) {
      const v = source[k];
      if (typeof v === typeof settings[k]) (settings as unknown as Record<string, unknown>)[k] = v;
    }
    if (!['beep', 'whistle', 'gong'].includes(settings.soundType)) settings.soundType = 'gong';
    settings.eventSounds = decodeEventSounds(source?.eventSounds, !source?.eventSounds && source?.soundType ? settings.soundType : undefined);
    if (!['normal', 'strong', 'maximum'].includes(settings.intensity)) settings.intensity = 'strong';
    if (!['auto', 'portrait', 'landscape'].includes(settings.orientation)) settings.orientation = 'landscape';
    if (!['dark', 'contrast'].includes(settings.appearance)) settings.appearance = 'dark';
    if (!Number.isFinite(settings.volume)) settings.volume = 1;
    settings.volume = Math.min(1, Math.max(0, settings.volume));
    const presets = Array.isArray(value.presets) ? value.presets.filter(p => p && typeof p.id === 'string' && typeof p.name === 'string' && p.name.trim() && p.workout && !validateWorkout(p.workout)).filter((p, i, a) => a.findIndex(x => x.id === p.id) === i) : fallback.presets;
    const result: Preferences = { settings, workout: value.workout && !validateWorkout(value.workout) ? value.workout : fallback.workout, presets };
    if (typeof value.selectedPresetId === 'string' && presets.some(p => p.id === value.selectedPresetId)) result.selectedPresetId = value.selectedPresetId;
    return result;
  } catch { return fallback; }
}
export const loadPreferences = async (storage: Storage) => decodePreferences(await storage.getItem(PREF_KEY));
export const savePreferences = (storage: Storage, p: Preferences) => storage.setItem(PREF_KEY, JSON.stringify(p));
