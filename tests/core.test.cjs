const { test } = require('node:test');
const assert = require('node:assert/strict');
const { defaultWorkout, makePlan, frameAt, validateWorkout, formatTime, restartClock, elapsedAt, pauseClock, resumeClock, skipClock } = require('../.test-build/core/timer.js');
const { AlertGate } = require('../.test-build/core/alerts.js');
const { defaults, builtinPresets, loadPreferences, savePreferences, decodePreferences } = require('../.test-build/core/preferences.js');
const workout = { ...defaultWorkout, prepare: 2, fight: 10, rest: 3, rounds: 2 };
const p = makePlan(workout);
test('contagem regressiva arredonda para cima e não termina antes do prazo', () => {
  assert.equal(formatTime(frameAt(p, 1).remaining), '00:02');
  assert.equal(frameAt(p, 1999).phase, 'prepare');
  assert.equal(frameAt(p, 2000).phase, 'fight');
});
test('sequência preparação → luta → descanso → luta → final, sem descanso final', () => {
  assert.equal(p.total, 25000);
  assert.equal(frameAt(p, 0).phase, 'prepare');
  assert.equal(frameAt(p, 2000).round, 1);
  assert.equal(frameAt(p, 12000).phase, 'rest');
  assert.equal(frameAt(p, 15000).round, 2);
  assert.equal(frameAt(p, 15000).phase, 'fight');
  assert.equal(frameAt(p, 25000).phase, 'finished');
  assert.equal(frameAt(p, 25000).completed, 2);
});
test('ciclos substituem o descanso, sem duplicação', () => {
  const plan = makePlan({ ...workout, cycles: 2, cycleRest: 7, cycleRestEnabled: true });
  assert.equal(plan.total, 55000);
  assert.equal(frameAt(plan, 25000).phase, 'rest');
  assert.equal(frameAt(plan, 25000).remaining, 7000);
  assert.equal(frameAt(plan, 32000).phase, 'fight');
  assert.equal(frameAt(plan, 32000).cycle, 2);
  assert.equal(frameAt(plan, 55000).completed, 4);
});
test('modo infinito atravessa muitos ciclos sem limitar rodadas', () => {
  const plan = makePlan({ ...workout, infinite: true });
  assert.equal(plan.total, -1);
  assert.equal(frameAt(plan, 28000).phase, 'fight');
  assert.equal(frameAt(plan, 28000).cycle, 2);
  assert.notEqual(frameAt(plan, 100000000000).phase, 'finished');
});
test('infinito aplica descanso comum ou especial conforme preferência', () => {
  const standard = makePlan({ ...workout, infinite: true, cycleRest: 7 });
  const special = makePlan({ ...workout, infinite: true, cycleRest: 7, cycleRestEnabled: true });
  assert.equal(frameAt(standard, 25000).remaining, 3000);
  assert.equal(frameAt(special, 25000).remaining, 7000);
});
test('pausa congela o tempo e retomada conserva frações de segundo', () => {
  let clock = restartClock(100);
  clock = pauseClock(clock, 1345);
  assert.equal(elapsedAt(clock, 100000), 1245);
  clock = resumeClock(clock, 100000);
  assert.equal(elapsedAt(clock, 100321), 1566);
});
test('reinício restaura preparação, primeira rodada e tempo zero', () => {
  const c = restartClock(50000);
  assert.equal(elapsedAt(c, 50000), 0);
  assert.equal(frameAt(p, elapsedAt(c, 50000)).phase, 'prepare');
  assert.equal(frameAt(p, 0).round, 1);
});
test('avanço manual preserva pausa e atualiza rodada corretamente', () => {
  let c = pauseClock(restartClock(0), 1000);
  c = skipClock(c, p, 2000); assert.equal(c.elapsed, 2000); assert.equal(c.paused, true);
  c = skipClock(c, p, 3000); assert.equal(frameAt(p, c.elapsed).phase, 'rest'); assert.equal(frameAt(p, c.elapsed).completed, 1);
  c = skipClock(c, p, 4000); assert.equal(frameAt(p, c.elapsed).round, 2);
  c = skipClock(c, p, 5000); assert.equal(frameAt(p, c.elapsed).phase, 'finished');
});
test('atrasos prolongados atravessam múltiplas etapas sem perder milissegundos', () => {
  const c = restartClock(1000);
  const f = frameAt(p, elapsedAt(c, 17543));
  assert.equal(f.phase, 'fight'); assert.equal(f.round, 2); assert.equal(f.remaining, 8457);
  assert.equal(frameAt(p, elapsedAt(c, 1000000)).phase, 'finished');
});
test('preparação e descansos zero não criam etapas vazias', () => {
  const plan = makePlan({ ...workout, prepare: 0, rest: 0 });
  assert.equal(frameAt(plan, 0).phase, 'fight');
  assert.equal(frameAt(plan, 10000).round, 2);
  assert.equal(frameAt(plan, 20000).phase, 'finished');
});
test('validação rejeita valores vazios, negativos, não finitos e limites inválidos', () => {
  for (const patch of [{ fight: 0 }, { prepare: -1 }, { rest: NaN }, { rounds: 0 }, { cycles: 100 }, { fight: 6000 }, { fight: 1.5 }, { infinite: 'true' }]) assert.ok(validateWorkout({ ...workout, ...patch }));
  assert.equal(validateWorkout(workout), null);
});
test('presets são independentes e alteram durações do plano', () => {
  const [quick, standard, long] = builtinPresets();
  assert.equal(makePlan(quick.workout).segments[0].duration, 180000);
  quick.workout.fight = 1;
  assert.equal(standard.workout.fight, 300); assert.equal(long.workout.fight, 420);
  assert.equal(builtinPresets()[0].workout.fight, 180);
});
test('preferências e favoritos persistem offline sem rede', async () => {
  const memory = new Map(); const storage = { getItem: async k => memory.get(k) ?? null, setItem: async (k, v) => { memory.set(k, v); } };
  const pref = defaults(); pref.settings.voice = true; pref.settings.volume = .25;
  pref.presets.push({ id: 'custom', name: 'Competição', workout: { ...workout } });
  await savePreferences(storage, pref);
  assert.deepEqual(await loadPreferences(storage), pref);
});
test('corrupção no armazenamento é recuperada e preferências inválidas saneadas', () => {
  assert.deepEqual(decodePreferences('{bad'), defaults());
  const p = defaults(); p.workout.fight = -1; p.settings.volume = 10; p.settings.orientation = 'bad'; p.presets.push({ id: 'bad', name: 'Bad', workout: { fight: -1 } });
  const result = decodePreferences(JSON.stringify(p));
  assert.equal(result.workout.fight, 300); assert.equal(result.settings.volume, 1); assert.equal(result.settings.orientation, 'landscape'); assert.equal(result.presets.length, 3);
});
test('falha de armazenamento é propagada ao chamador', async () => {
  await assert.rejects(savePreferences({ setItem: async () => { throw new Error('disk'); } }, defaults()), /disk/);
});
test('aviso único por segundo e por transição', () => {
  const gate = new AlertGate();
  assert.equal(gate.next(frameAt(p, 0), false, true), 'transition');
  assert.equal(gate.next(frameAt(p, 50), false, true), null);
  assert.equal(gate.next(frameAt(p, 1000), false, true), 'tick');
  assert.equal(gate.next(frameAt(p, 1100), false, true), null);
  assert.equal(gate.next(frameAt(p, 2000), false, true), 'transition');
  assert.equal(gate.next(frameAt(p, 2050), false, true), null);
});
test('atraso não reproduz uma fila de alertas ultrapassados', () => {
  const gate = new AlertGate(); gate.next(frameAt(p, 0), false, true);
  assert.equal(gate.next(frameAt(p, 18000), false, true), 'transition');
  assert.equal(gate.next(frameAt(p, 18100), false, true), null);
});
test('pausa impede avisos; opção de contagem desativada mantém transições', () => {
  const gate = new AlertGate(); assert.equal(gate.next(frameAt(p, 0), true, true), null);
  assert.equal(gate.next(frameAt(p, 0), false, false), 'transition');
  assert.equal(gate.next(frameAt(p, 1000), false, false), null);
  assert.equal(gate.next(frameAt(p, 2000), false, false), 'transition');
});
test('falha de áudio não altera relógio ou máquina de estados', () => {
  const gate = new AlertGate(); const c = restartClock(0);
  const audio = () => { throw new Error('audio unavailable'); };
  const frame = frameAt(p, elapsedAt(c, 2000));
  if (gate.next(frame, false, true)) { try { audio(); } catch {} }
  assert.equal(frameAt(p, elapsedAt(c, 15000)).round, 2);
  assert.equal(gate.next(frame, false, true), null);
});
test('plano calculado coincide com sequência linear independente de referência', () => {
  for (const rounds of [1, 2, 5]) for (const cycles of [1, 2, 4]) for (const rest of [0, 3]) for (const special of [false, true]) {
    const w = { ...workout, rounds, cycles, rest, cycleRest: 7, cycleRestEnabled: special };
    const plan = makePlan(w); const reference = [{ phase: 'prepare', duration: 2000, round: 1, cycle: 1 }];
    for (let c = 1; c <= cycles; c++) for (let r = 1; r <= rounds; r++) {
      reference.push({ phase: 'fight', duration: w.fight * 1000, round: r, cycle: c });
      if (c !== cycles || r !== rounds) reference.push({ phase: 'rest', duration: (r === rounds && special ? w.cycleRest : rest) * 1000, round: r, cycle: c });
    }
    let start = 0;
    for (const segment of reference.filter(s => s.duration)) {
      for (const at of [start, start + segment.duration - 1]) {
        const frame = frameAt(plan, at); assert.equal(frame.phase, segment.phase); assert.equal(frame.round, segment.round); assert.equal(frame.cycle, segment.cycle);
      }
      start += segment.duration;
    }
    assert.equal(plan.total, start); assert.equal(frameAt(plan, start).phase, 'finished');
  }
});
test('amostragem extensa mantém progresso dentro da etapa e final consistente', () => {
  for (let rounds = 1; rounds <= 7; rounds++) for (let rest = 0; rest <= 3; rest++) {
    const plan = makePlan({ ...workout, rounds, rest, cycles: 3, cycleRest: 0, cycleRestEnabled: true });
    for (let t = 0; t < plan.total; t += 173) { const f = frameAt(plan, t); assert.ok(f.remaining > 0 && f.remaining <= f.duration); assert.ok(f.end > t); }
    assert.equal(frameAt(plan, plan.total).completed, rounds * 3);
  }
});
