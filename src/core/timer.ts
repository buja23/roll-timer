export type Phase = 'prepare' | 'fight' | 'rest' | 'finished';
export interface Workout {
  prepare: number; fight: number; rest: number; rounds: number;
  infinite: boolean; cycles: number; cycleRest: number;
}
export const defaultWorkout: Workout = { prepare: 10, fight: 300, rest: 60, rounds: 8, infinite: false, cycles: 1, cycleRest: 120 };
export interface Segment { phase: 'fight' | 'rest'; duration: number; round: number }
export interface Plan { prepare: number; segments: Segment[]; period: number; repeats: number; total: number; rounds: number; tail: number }
export function validateWorkout(w: Workout): string | null {
  for (const k of ['prepare', 'fight', 'rest', 'cycleRest'] as const)
    if (!Number.isInteger(w[k]) || w[k] < (k === 'fight' ? 1 : 0) || w[k] > 5999) return 'Use durações entre 0:00 e 99:59; a luta precisa de pelo menos 1 segundo.';
  if (!Number.isInteger(w.rounds) || w.rounds < 1 || w.rounds > 99 || !Number.isInteger(w.cycles) || w.cycles < 1 || w.cycles > 99) return 'Rodadas e ciclos devem estar entre 1 e 99.';
  if (typeof w.infinite !== 'boolean') return 'Modo infinito inválido.';
  return null;
}
export function makePlan(w: Workout): Plan {
  const error = validateWorkout(w); if (error) throw new Error(error);
  const segments: Segment[] = [];
  for (let round = 1; round <= w.rounds; round++) {
    segments.push({ phase: 'fight', duration: w.fight * 1000, round });
    const rest = round === w.rounds ? (w.cycles > 1 || w.infinite ? w.cycleRest : w.rest) : w.rest;
    if (rest > 0) segments.push({ phase: 'rest', duration: rest * 1000, round });
  }
  const period = segments.reduce((sum, s) => sum + s.duration, 0);
  const tail = segments.at(-1)?.phase === 'rest' ? segments.at(-1)!.duration : 0;
  return { prepare: w.prepare * 1000, segments, period, repeats: w.infinite ? 0 : w.cycles, total: w.infinite ? -1 : w.prepare * 1000 + period * w.cycles - tail, rounds: w.rounds, tail };
}
export interface Frame { phase: Phase; remaining: number; duration: number; start: number; end: number; round: number; cycle: number; completed: number; key: string }
export function frameAt(p: Plan, elapsed: number): Frame {
  const time = Math.max(0, elapsed);
  if (p.total >= 0 && time >= p.total) return { phase: 'finished', remaining: 0, duration: 0, start: p.total, end: p.total, round: p.rounds, cycle: p.repeats, completed: p.rounds * p.repeats, key: 'finished' };
  if (time < p.prepare) return { phase: 'prepare', remaining: p.prepare - time, duration: p.prepare, start: 0, end: p.prepare, round: 1, cycle: 1, completed: 0, key: 'prepare' };
  const cycle = Math.floor((time - p.prepare) / p.period);
  let start = p.prepare + cycle * p.period;
  for (const [i, s] of p.segments.entries()) {
    const end = start + s.duration;
    if (time < end) return { phase: s.phase, remaining: end - time, duration: s.duration, start, end, round: s.round, cycle: cycle + 1, completed: cycle * p.rounds + s.round - (s.phase === 'fight' ? 1 : 0), key: `${cycle}:${i}` };
    start = end;
  }
  throw new Error('Plano inválido');
}
export const phaseLabel: Record<Phase, string> = { prepare: 'PREPARAR', fight: 'LUTA', rest: 'DESCANSO', finished: 'TREINO FINALIZADO' };
export function formatTime(ms: number): string { const seconds = Math.ceil(Math.max(0, ms) / 1000); return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`; }
export interface Clock { elapsed: number; anchor: number; paused: boolean }
export const elapsedAt = (c: Clock, now: number) => c.elapsed + (c.paused ? 0 : Math.max(0, now - c.anchor));
export const pauseClock = (c: Clock, now: number): Clock => ({ elapsed: elapsedAt(c, now), anchor: now, paused: true });
export const resumeClock = (c: Clock, now: number): Clock => ({ ...c, anchor: now, paused: false });
export const restartClock = (now: number): Clock => ({ elapsed: 0, anchor: now, paused: false });
export const skipClock = (c: Clock, p: Plan, now: number): Clock => ({ ...c, elapsed: frameAt(p, elapsedAt(c, now)).end, anchor: now });
