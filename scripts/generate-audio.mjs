import { mkdirSync, writeFileSync, copyFileSync } from 'node:fs';
import { Buffer } from 'node:buffer';
const directory = 'modules/roll-timer/android/src/main/assets/roll-timer';
mkdirSync(directory, { recursive: true });
const rate = 44100, peak = 10 ** (-1 / 20), tau = 2 * Math.PI;
const durations = { beep: .24, competition: .24, gong: 1.35, bell: 1.2, horn: .85, whistle: .7, alarm: .9 };
const sine = (hz, t) => Math.sin(tau * hz * t);
function tone(name, t) {
  switch (name) {
    case 'beep': return sine(1250,t) + .24 * sine(2500,t);
    case 'competition': { const hz = t % .12 < .06 ? 1400 : 1800; return sine(hz,t) + .12 * sine(hz*2,t); }
    case 'gong': return (sine(660,t) + .3 * sine(1343,t) + .15 * sine(2107,t) + .12 * sine(1041,t)) * Math.exp(-t * 1.2);
    case 'bell': return [0,.18,.36].reduce((v, onset) => t < onset ? v : v + (sine(900,t-onset) + .3*sine(1867,t-onset) + .15*sine(2713,t-onset)) * Math.exp(-(t-onset)*4),0);
    case 'horn': return sine(660,t)+.8*sine(880,t)+.3*sine(1320,t)+.22*sine(1980,t)+.15*sine(2640,t);
    case 'whistle': return Math.sin(tau*2450*t + .7*Math.sin(tau*31*t))+.2*sine(3100,t);
    case 'alarm': return sine(Math.floor(t/.09)%2 ? 2100 : 1400,t)+.25*sine(2800,t);
    default: throw new Error(name);
  }
}
const report = [];
for (const [name,duration] of Object.entries(durations)) for (const short of [false,true]) {
  const length = short ? .18 : duration, n = Math.round(rate * length), values = new Float64Array(n);
  let maximum = 0, detector = 0, compressorGain = 1;
  const coefficient = seconds => 1 - Math.exp(-1 / (rate * seconds));
  for (let i=0;i<n;i++) {
    const t=i/rate, envelope=Math.max(0,Math.min(1,t/.003,(length-t-1/rate)/.025));
    // Envelope-based 2:1 compression, without clipping/waveshaping samples.
    // Fast attack and smooth release preserve the identity of each effect.
    const raw = tone(name,t) * envelope, level = Math.abs(raw);
    detector += (level-detector) * coefficient(level > detector ? .002 : .05);
    const target = detector > .5 ? Math.pow(detector / .5, -.5) : 1;
    compressorGain += (target-compressorGain) * coefficient(target < compressorGain ? .003 : .06);
    values[i] = raw * compressorGain;
    maximum=Math.max(maximum,Math.abs(values[i]));
  }
  const wav=Buffer.alloc(44+n*2); wav.write('RIFF'); wav.writeUInt32LE(wav.length-8,4); wav.write('WAVEfmt ',8); wav.writeUInt32LE(16,16); wav.writeUInt16LE(1,20); wav.writeUInt16LE(1,22); wav.writeUInt32LE(rate,24); wav.writeUInt32LE(rate*2,28); wav.writeUInt16LE(2,32); wav.writeUInt16LE(16,34); wav.write('data',36); wav.writeUInt32LE(n*2,40);
  let sum=0;
  for(let i=0;i<n;i++) { const v=Math.round(values[i]/maximum*peak*32767); wav.writeInt16LE(v,44+i*2); sum+=(v/32768)**2; }
  const file=`${name}${short?'-short':''}.wav`; writeFileSync(`${directory}/${file}`,wav);
  report.push({file,duration:length,rate,peakDbFS:-1,rmsDbFS:20*Math.log10(Math.sqrt(sum/n))});
}
// Legacy asset retained for compatibility with existing APK/session resources.
copyFileSync(`${directory}/beep-short.wav`,`${directory}/tick.wav`);
writeFileSync('docs/audio-analysis.json',JSON.stringify(report,null,2)+'\n');
console.log(`Generated ${report.length} PCM WAV files plus the legacy tick alias.`);
