export const sounds = [
  { id: 'beep', label: 'Bip eletrônico forte' },
  { id: 'competition', label: 'Bip de competição' },
  { id: 'gong', label: 'Gongo tradicional' },
  { id: 'bell', label: 'Sino de boxe' },
  { id: 'horn', label: 'Buzina esportiva' },
  { id: 'whistle', label: 'Apito de árbitro' },
  { id: 'alarm', label: 'Alarme eletrônico' },
] as const;
export type SoundId = typeof sounds[number]['id'];
export type EventSound = SoundId | 'none';
export type Intensity = 'normal' | 'strong' | 'maximum';
export const audioEvents = [
  { id: 'countdown', label: 'Últimos 5 segundos' },
  { id: 'fightStart', label: 'Início da luta' },
  { id: 'fightEnd', label: 'Fim da luta' },
  { id: 'restStart', label: 'Início do descanso' },
  { id: 'restEnd', label: 'Fim do descanso' },
  { id: 'workoutEnd', label: 'Treino finalizado' },
] as const;
export type AudioEvent = typeof audioEvents[number]['id'];
export type EventSounds = Record<AudioEvent, EventSound>;
export const defaultEventSounds = (): EventSounds => ({ countdown: 'competition', fightStart: 'gong', fightEnd: 'bell', restStart: 'none', restEnd: 'gong', workoutEnd: 'gong' });
export function decodeEventSounds(value: unknown, legacy?: SoundId): EventSounds {
  const result = defaultEventSounds();
  if (legacy) for (const key of ['fightStart', 'fightEnd', 'restEnd', 'workoutEnd'] as const) result[key] = legacy;
  if (value && typeof value === 'object') for (const { id } of audioEvents) {
    const v = (value as Record<string, unknown>)[id];
    if (v === 'none' || sounds.some(s => s.id === v)) result[id] = v as EventSound;
  }
  return result;
}
