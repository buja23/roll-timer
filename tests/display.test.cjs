const { test } = require('node:test');
const assert = require('node:assert/strict');
const { formatDisplayTime, clockFontSize, clockLayout, clockWidthUnits } = require('../.test-build/ui/layout.js');
const { OrientationController } = require('../.test-build/platform/orientationController.js');
const { defaults, decodePreferences } = require('../.test-build/core/preferences.js');
test('tempo de tela mantém formato de horas até o fim da etapa', () => {
  assert.equal(formatDisplayTime(5000), '00:05'); assert.equal(formatDisplayTime(300000), '05:00');
  assert.equal(formatDisplayTime(3599000), '59:59'); assert.equal(formatDisplayTime(3600000), '01:00:00');
  assert.equal(formatDisplayTime(5999000), '01:39:59'); assert.equal(formatDisplayTime(5000, 5999000), '00:00:05');
  assert.equal(formatDisplayTime(-100), '00:00');
});
test('relógio respeita largura e altura medidas nos dois formatos', () => {
  for (const width of [220, 288, 328, 640, 780]) for (const height of [80, 140, 360]) for (const text of ['00:05', '59:59', '01:39:59']) {
    const font = clockFontSize(width, height, text);
    const fit = clockLayout(width, height, text);
    assert.ok(font * clockWidthUnits(text) * fit.scaleX <= width); assert.ok(font * .9 * fit.scaleY <= height);
  }
  assert.ok(clockFontSize(288, 180, '01:39:59') < clockFontSize(288, 180, '05:00'));
});
test('contagem não muda o tamanho nem a posição dos dígitos', () => {
  for (const [w,h] of [[288,360],[780,180]]) {
    for (const value of ['00:05','00:59','05:00','59:59','11:11']) assert.deepEqual(clockLayout(w,h,value), clockLayout(w,h,'88:88'));
    for (const value of ['01:39:59','00:00:05','11:11:11']) assert.deepEqual(clockLayout(w,h,value), clockLayout(w,h,'88:88:88'));
  }
});
test('rotação serializa solicitações e restaura orientação após sair durante uma rotação', async () => {
  const calls = []; let finish;
  const gate = new Promise(resolve => { finish = resolve; });
  const c = new OrientationController({ lock: async mode => { calls.push(mode); if (mode === 'landscape') await gate; }, restore: async () => { calls.push('restore'); } });
  await c.enter('portrait'); const rotation = c.rotate('landscape');
  await Promise.resolve(); const leaving = c.leave(); finish();
  assert.equal(await rotation, false); await leaving;
  assert.deepEqual(calls, ['portrait', 'landscape', 'restore']);
});
test('troca de tela descarta solicitações antigas e respeita a nova orientação', async () => {
  const calls = []; const c = new OrientationController({ lock: async mode => { calls.push(mode); }, restore: async () => { calls.push('restore'); } });
  const entering = c.enter('landscape'); const oldRotation = c.rotate('portrait');
  const leaving = c.leave(); const reentering = c.enter('landscape');
  await Promise.all([entering, oldRotation, leaving, reentering]);
  assert.deepEqual(calls, ['landscape']);
});
test('falha do Android não bloqueia a próxima tentativa de rotação', async () => {
  let attempts = 0; const c = new OrientationController({ lock: async () => { if (++attempts === 2) throw new Error('unsupported'); }, restore: async () => {} });
  await c.enter('portrait'); await assert.rejects(c.rotate('landscape'), /unsupported/);
  assert.equal(await c.rotate('portrait'), true); await c.leave();
});
test('preferência visual de preset preserva dados antigos e ignora ids excluídos', () => {
  const old = defaults(); assert.deepEqual(decodePreferences(JSON.stringify(old)), old);
  const selected = { ...old, selectedPresetId: 'standard' };
  assert.equal(decodePreferences(JSON.stringify(selected)).selectedPresetId, 'standard');
  assert.equal(decodePreferences(JSON.stringify({ ...old, selectedPresetId: 'deleted' })).selectedPresetId, undefined);
});
