const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { defaults, decodePreferences, savePreferences, loadPreferences } = require('../.test-build/core/preferences.js');
const { sounds, defaultEventSounds } = require('../.test-build/core/audio.js');
test('áudio novo inicia Forte e migra escolhas antigas sem apagar favoritos', () => {
  const p = defaults(); assert.equal(p.settings.intensity, 'strong'); assert.equal(p.settings.orientation, 'landscape');
  const old = JSON.parse(JSON.stringify(p)); delete old.settings.eventSounds; delete old.settings.intensity; old.settings.soundType = 'whistle';
  const migrated = decodePreferences(JSON.stringify(old));
  assert.equal(migrated.settings.eventSounds.fightStart, 'whistle'); assert.equal(migrated.settings.eventSounds.workoutEnd, 'whistle');
  assert.equal(migrated.settings.eventSounds.countdown, 'competition'); assert.equal(migrated.settings.intensity, 'strong');
  assert.deepEqual(migrated.presets, p.presets);
});
test('preferências de som rejeitam ids inválidos e preservam silêncio explícito', () => {
  const p = defaults(); p.settings.eventSounds = { countdown: 'none', fightStart: '../../invalid', fightEnd: 1 }; p.settings.intensity = 'invalid';
  const decoded = decodePreferences(JSON.stringify(p));
  assert.equal(decoded.settings.eventSounds.countdown, 'none'); assert.equal(decoded.settings.eventSounds.fightStart, 'gong'); assert.equal(decoded.settings.eventSounds.fightEnd, 'bell'); assert.equal(decoded.settings.intensity, 'strong');
});
test('seleções independentes e intensidade persistem offline', async () => {
  const p = defaults(); p.settings.eventSounds = { countdown: 'beep', fightStart: 'horn', fightEnd: 'bell', restStart: 'alarm', restEnd: 'whistle', workoutEnd: 'gong' }; p.settings.intensity = 'maximum';
  let raw = null; const store = { getItem: async () => raw, setItem: async (_key,value) => { raw=value; } };
  await savePreferences(store,p); const restored=await loadPreferences(store); assert.deepEqual(restored,p);
  assert.deepEqual(defaultEventSounds(), defaults().settings.eventSounds);
});
test('14 WAV reais têm ataque rápido, headroom, energia e versões curtas sem clipping', () => {
  const fingerprints = new Set();
  for(const {id} of sounds) for(const short of [false,true]) {
    const data=fs.readFileSync(`modules/roll-timer/android/src/main/assets/roll-timer/${id}${short?'-short':''}.wav`);
    assert.equal(data.toString('ascii',0,4),'RIFF'); assert.equal(data.toString('ascii',8,12),'WAVE'); assert.equal(data.readUInt16LE(20),1); assert.equal(data.readUInt16LE(22),1); assert.equal(data.readUInt32LE(24),44100); assert.equal(data.readUInt16LE(34),16);
    const n=(data.length-44)/2; let max=0,sum=0,mean=0,first=-1;
    for(let i=0;i<n;i++) { const v=data.readInt16LE(44+i*2)/32768; max=Math.max(max,Math.abs(v)); sum+=v*v; mean+=v; if(first<0&&Math.abs(v)>.01)first=i; }
    assert.ok(max>.88&&max<.90,`${id}: peak ${max}`); assert.ok(Math.sqrt(sum/n)>.15,`${id}: RMS`); assert.ok(Math.abs(mean/n)<.03,`${id}: DC offset`);
    assert.ok(first>=0&&first/44100<.005,`${id}: attack`); assert.equal(data.readInt16LE(44),0); assert.equal(data.readInt16LE(data.length-2),0);
    if(short) assert.equal(n/44100,.18); else fingerprints.add(require('node:crypto').createHash('sha256').update(data).digest('hex'));
  }
  assert.equal(fingerprints.size,7,'Os sete efeitos precisam ser distintos');
});
