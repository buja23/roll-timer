import { requireOptionalNativeModule } from 'expo';
import { Settings } from '../core/preferences';
import { makePlan, Plan, Workout } from '../core/timer';
interface NativeTimer {
  snapshot(): string | null;
  command(command: string, payload: string | null): void;
  preview(settings: string): void;
  stopPreview(): void;
}
export interface NativeSession { workout: Workout; plan: Plan; settings: Settings; currentElapsed: number; paused: boolean }
const native = requireOptionalNativeModule<NativeTimer>('RollTimer');
export const nativeAvailable = Boolean(native);
export const getSession = (): NativeSession | null => { const raw = native?.snapshot(); return raw ? JSON.parse(raw) as NativeSession : null; };
export function startSession(workout: Workout, settings: Settings) {
  if (!native) throw new Error('Instale a build Android do Roll Timer. O Expo Go não inclui o serviço nativo necessário para o treino.');
  native.stopPreview();
  native.command('start', JSON.stringify({ workout, plan: makePlan(workout), settings }));
}
export function command(command: 'pause' | 'resume' | 'skip' | 'restart' | 'stop' | 'restore') { native?.command(command, null); }
export function previewSound(settings: Settings) {
  if (!native) throw new Error('O teste de som está disponível na build Android, com o módulo nativo instalado.');
  native.preview(JSON.stringify({ ...settings, sound: true }));
}
export const stopPreview = () => native?.stopPreview();
