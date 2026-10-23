import { mkdirSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { Buffer } from 'node:buffer';
const audio = 'modules/roll-timer/android/src/main/assets/roll-timer';
mkdirSync(audio, { recursive: true });
// Original synthesized PCM assets, generated locally; no downloaded media/licenses.
for (const [name, duration] of [['tick', .09], ['beep', .45], ['whistle', .6], ['gong', 1.1]]) {
  const rate = 22050, n = Math.floor(rate * duration), wav = Buffer.alloc(44 + n * 2);
  wav.write('RIFF'); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVEfmt ', 8); wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22); wav.writeUInt32LE(rate, 24); wav.writeUInt32LE(rate * 2, 28); wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34); wav.write('data', 36); wav.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    const t = i / rate, fade = Math.min(1, t / .008, (duration - t) / .025);
    const sample = name === 'gong' ? (Math.sin(t * 2 * Math.PI * 190) + .45 * Math.sin(t * 2 * Math.PI * 393) + .25 * Math.sin(t * 2 * Math.PI * 657)) / 1.7 * Math.exp(-t * 3) : name === 'whistle' ? Math.sin(2 * Math.PI * 2200 * t + 3 * Math.sin(2 * Math.PI * 27 * t)) * .55 : Math.sin(2 * Math.PI * (name === 'tick' ? 1100 : 750) * t) * (name === 'beep' && t > .15 && t < .23 ? 0 : .65);
    wav.writeInt16LE(Math.round(sample * fade * 26000), 44 + i * 2);
  }
  writeFileSync(`${audio}/${name}.wav`, wav);
}
function crc32(buffer) { let c = 0xffffffff; for (const b of buffer) { c ^= b; for (let i = 0; i < 8; i++) c = (c >>> 1) ^ ((c & 1) ? 0xedb88320 : 0); } return (c ^ 0xffffffff) >>> 0; }
function chunk(type, data) { const head = Buffer.alloc(4); head.writeUInt32BE(data.length); const body = Buffer.concat([Buffer.from(type), data]); const tail = Buffer.alloc(4); tail.writeUInt32BE(crc32(body)); return Buffer.concat([head, body, tail]); }
function icon(file, size, transparent = false) {
  const rows = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const dx = x / size - .5, dy = y / size - .53, r = Math.hypot(dx, dy);
    const ring = r > .235 && r < .29;
    const top = Math.abs(dx) < .095 && y / size > .15 && y / size < .20;
    const hand = Math.abs(dx) < .02 && dy > -.18 && dy < .02 || Math.abs(dy) < .02 && dx > 0 && dx < .14;
    const color = ring || top || hand ? [220, 38, 38, 255] : [10, 10, 11, transparent ? 0 : 255];
    const offset = y * (size * 4 + 1) + 1 + x * 4; color.forEach((v, i) => rows[offset + i] = v);
  }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(size); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 6;
  writeFileSync(file, Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(rows)), chunk('IEND', Buffer.alloc(0))]));
}
icon('assets/icon.png', 1024); icon('assets/adaptive-icon.png', 1024, true); icon('assets/splash-icon.png', 512, true); icon('assets/favicon.png', 64);
