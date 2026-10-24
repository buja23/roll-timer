import { build } from 'esbuild';
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const out = path.resolve('.expo/ui-preview'); mkdirSync(out, { recursive: true });
const mock = path.resolve('tests/ui/mocks.tsx');
await build({ entryPoints: ['tests/ui/preview.tsx'], outfile: path.join(out, 'preview.js'), bundle: true, platform: 'browser', format: 'iife', jsx: 'automatic', define: { 'process.env.NODE_ENV': '"development"', __DEV__: 'true' }, resolveExtensions: ['.web.tsx', '.web.ts', '.web.js', '.tsx', '.ts', '.jsx', '.js', '.json'], plugins: [{ name: 'native-layout-harness', setup(b) {
  b.onResolve({ filter: /^react-native$/ }, () => ({ path: path.resolve('tests/ui/native-web.ts') }));
  b.onResolve({ filter: /^@react-native\/assets-registry\/registry$/ }, () => ({ path: path.resolve('node_modules/react-native-web/dist/modules/AssetRegistry/index.js') }));
  b.onResolve({ filter: /^(expo-router|expo-status-bar|expo-screen-orientation|expo-navigation-bar)$/ }, () => ({ path: mock }));
  b.onResolve({ filter: /\/(AppProvider|nativeTimer)$/ }, () => ({ path: mock }));
} }], logLevel: 'warning' });
const html = '<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Roll Timer · verificação de componentes</title><style>@font-face{font-family:RollTimerClock;src:url(/clock.ttf);font-weight:100 900}html,body,#root{height:100%;margin:0;background:#0A0A0B}#root{display:flex;flex-direction:column}*{box-sizing:border-box}</style><div id="root"></div><script src="/preview.js"></script></html>';
const server = createServer((req, res) => { res.setHeader('content-type', req.url === '/clock.ttf' ? 'font/ttf' : req.url === '/preview.js' ? 'text/javascript' : 'text/html; charset=utf-8'); res.end(req.url === '/clock.ttf' ? readFileSync('assets/fonts/RobotoCondensed.ttf') : req.url === '/preview.js' ? readFileSync(path.join(out, 'preview.js')) : html); });
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;
const executablePath = process.env.ROLL_TIMER_CHROME ?? ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
assert.ok(executablePath, 'Defina ROLL_TIMER_CHROME para o navegador Chromium instalado.');
const browser = await chromium.launch({ executablePath, headless: true });
const errors = []; let checks = 0;
const screenshots = path.resolve('docs/redesign'); mkdirSync(screenshots, { recursive: true });
try {
  const page = await browser.newPage(); page.on('pageerror', e => errors.push(e.message));
  async function open(screen, width, height, params = '') {
    await page.setViewportSize({ width, height }); await page.goto(`http://127.0.0.1:${port}/?screen=${screen}${params}`);
    await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(250);
    assert.deepEqual(errors, [], 'Erros de execução nos componentes');
  }
  async function checkTimer() {
    const issues = await page.evaluate(() => {
      const problems = [];
      for (const id of ['timer-header', 'timer-display', 'timer-digits', 'timer-progress', 'next-phase', 'timer-controls']) {
        const el = document.querySelector(`[data-testid="${id}"]`); if (!el) continue;
        const r = el.getBoundingClientRect();
        if (r.left < -1 || r.top < -1 || r.right > innerWidth + 1 || r.bottom > innerHeight + 1) problems.push(`${id}: fora da janela ${JSON.stringify(r.toJSON())}`);
        if (el.scrollWidth > el.clientWidth + 2 || (id !== 'timer-digits' && el.scrollHeight > el.clientHeight + 2)) problems.push(`${id}: overflow (${el.scrollWidth}×${el.scrollHeight} em ${el.clientWidth}×${el.clientHeight}; fonte ${getComputedStyle(el).fontSize})`);
      }
      const digits = document.querySelector('[data-testid="timer-digits"]');
      const parent = document.querySelector('[data-testid="timer-display"]');
      if (digits) {
        // Tight leading intentionally omits unused font ascender/descender space.
        // Check real glyph ink rather than that invisible font scroll box.
        const s = getComputedStyle(digits), f = parseFloat(s.fontSize), line = parseFloat(s.lineHeight);
        if (s.transform !== 'none') problems.push('O relógio não pode usar transformações');
        const canvas = document.createElement('canvas').getContext('2d'); canvas.font = `700 ${f}px RollTimerClock`;
        const m = canvas.measureText(digits.textContent), baseline = (line - m.fontBoundingBoxAscent - m.fontBoundingBoxDescent) / 2 + m.fontBoundingBoxAscent;
        if (baseline - m.actualBoundingBoxAscent < -1 || baseline + m.actualBoundingBoxDescent > line + 1) problems.push('A linha corta a tinta dos números');
      }
      if (digits && parent) { const a = digits.getBoundingClientRect(), b = parent.getBoundingClientRect(); if (a.width > b.width + 2 || a.height > b.height + 2) problems.push('Relógio maior que a área medida'); if (parseFloat(getComputedStyle(digits).fontSize) < 45) problems.push('Relógio pequeno demais'); }
      const blocks = ['timer-header', 'timer-display', 'timer-progress', 'timer-controls'].map(id => document.querySelector(`[data-testid="${id}"]`)?.getBoundingClientRect()).filter(Boolean);
      for (let i = 1; i < blocks.length; i++) if (blocks[i].top < blocks[i-1].bottom - 1) problems.push('Sobreposição entre áreas do timer');
      for (const el of document.querySelectorAll('[role="button"]')) { const r = el.getBoundingClientRect(); if (r.width < 47 || r.height < 47) problems.push('Área de toque menor que 48'); }
      return problems;
    });
    if (issues.length) { await page.screenshot({ path: path.join(out, 'failure.png') }); console.error(page.url(), await page.viewportSize()); }
    assert.deepEqual(issues, []); checks++;
  }
  async function enlargeText() {
    await page.evaluate(() => { for (const el of document.querySelectorAll('[dir="auto"]')) { if (el.getAttribute('data-testid') === 'timer-digits') continue; const s = getComputedStyle(el); el.style.fontSize = `${parseFloat(s.fontSize) * 2}px`; if (s.lineHeight !== 'normal') el.style.lineHeight = `${parseFloat(s.lineHeight) * 2}px`; } });
    await page.waitForTimeout(150);
  }
  async function checkText() {
    const issues = await page.evaluate(() => {
      const problems = [];
      for (const el of document.querySelectorAll('[dir="auto"], input')) {
        const r = el.getBoundingClientRect(); if (!r.width) continue;
        if (r.left < -1 || r.right > innerWidth + 1) problems.push(`Texto fora da largura: ${el.textContent}`);
        if (el.scrollWidth > el.clientWidth + 2) problems.push(`Texto com overflow: ${el.textContent}`);
      }
      for (const button of document.querySelectorAll('[role="button"]')) {
        if (!button.getBoundingClientRect().width) continue;
        const nodes = document.createTreeWalker(button, NodeFilter.SHOW_TEXT);
        while (nodes.nextNode()) { const node = nodes.currentNode; for (const match of node.textContent.matchAll(/\p{L}{5,}/gu)) { const range = document.createRange(); range.setStart(node, match.index); range.setEnd(node, match.index + match[0].length); if (range.getClientRects().length > 1) problems.push(`Palavra quebrada no botão: ${match[0]}`); } }
      }
      return problems;
    });
    if (issues.length) { await page.screenshot({ path: path.join(out, 'failure.png'), fullPage: true }); console.error(page.url()); }
    assert.deepEqual(issues, []); checks++;
  }
  for (const [width, height] of [[320,568],[360,640],[393,852],[430,932],[568,320],[640,360],[844,390]]) {
    for (const extra of ['', '&hours=1', '&paused=1']) { await open('timer', width, height, extra); await checkTimer(); }
  }
  await open('timer', 844, 390, '&notch=1&phase=rest'); await checkTimer();
  await page.screenshot({ path: path.join(screenshots, 'timer-horizontal.png') });
  await open('timer', 393, 852); await page.screenshot({ path: path.join(screenshots, 'timer-vertical.png') });
  await open('timer', 393, 852, '&paused=1'); await page.screenshot({ path: path.join(screenshots, 'timer-pausado.png') });
  for (const [phase, background, color] of [['prepare','rgb(250, 204, 21)','rgb(0, 0, 0)'],['fight','rgb(154, 255, 61)','rgb(0, 0, 0)'],['rest','rgb(239, 49, 40)','rgb(255, 255, 255)']]) {
    for (const paused of ['', '&paused=1']) {
      await open('timer', 393, 852, `&phase=${phase}${paused}`);
      assert.equal(await page.locator('[data-testid="timer-portrait"]').evaluate(el => getComputedStyle(el).backgroundColor), background);
      assert.equal(await page.locator('[data-testid="timer-digits"]').evaluate(el => getComputedStyle(el).color), color);
      assert.equal(await page.getByRole('button', { name: /Avançar|Próxima|Controles/ }).count(), 0);
      assert.deepEqual(await page.getByRole('button').allTextContents(), ['', '', '', '']);
      if (paused) await page.getByRole('heading', { name: /PAUSADO/ }).waitFor();
      await checkTimer(); checks++;
    }
  }
  // Feed different native snapshots to the real UI: equal-width figures must
  // keep identical type size, transforms and bounds throughout a phase.
  for (const [width,height,orientation] of [[393,852,'vertical'],[844,390,'horizontal']]) {
  await open('timer', width, height, '&seconds=3599');
  const measurements = [];
  for (const [seconds, label] of [[3599,'59:59'],[600,'10:00'],[300,'05:00'],[60,'01:00'],[30,'00:30'],[5,'00:05']]) {
    await page.evaluate(s => window.__rollPreview.tick(10000 + (3599 - s) * 1000), seconds);
    await page.waitForTimeout(80);
    assert.equal(await page.locator('[data-testid="timer-digits"]').textContent(), label);
    measurements.push(await page.locator('[data-testid="timer-digits"]').evaluate(el => { const r = el.getBoundingClientRect(), s = getComputedStyle(el); return [r.x,r.y,r.width,r.height,s.fontSize,s.transform]; }));
    await checkTimer();
    await page.screenshot({ path: path.join(screenshots, `timer-${label.replace(':','-')}-${orientation}.png`) });
  }
  for (const m of measurements) assert.deepEqual(m, measurements[0]); checks++;
  const occupation = await page.locator('[data-testid="timer-digits"]').evaluate(el => el.getBoundingClientRect().width / el.parentElement.getBoundingClientRect().width);
  const heightOccupation = await page.locator('[data-testid="timer-digits"]').evaluate(el => el.getBoundingClientRect().height / el.parentElement.getBoundingClientRect().height);
  assert.ok(occupation <= .96 && (occupation >= .90 || heightOccupation >= .85)); checks++;
  }
  await open('timer', 844, 390, '&hours=1'); await checkTimer();
  await page.screenshot({ path: path.join(screenshots, 'timer-horas.png') });
  const hoursMeasurements = [];
  for (const remaining of [5999,3600,3599,30,5]) {
    await page.evaluate(s => window.__rollPreview.tick(10000 + (5999 - s) * 1000), remaining); await page.waitForTimeout(80);
    const text = await page.locator('[data-testid="timer-digits"]').textContent(); assert.equal(text.length,8);
    hoursMeasurements.push(await page.locator('[data-testid="timer-digits"]').evaluate(el => { const r=el.getBoundingClientRect(); return [r.x,r.y,r.width,r.height,getComputedStyle(el).fontSize]; }));
    await checkTimer();
  }
  for (const m of hoursMeasurements) assert.deepEqual(m,hoursMeasurements[0]); checks++;
  await open('timer', 393, 852, '&phase=prepare');
  await page.screenshot({ path: path.join(screenshots, 'timer-preparar.png') });
  await open('timer', 393, 852);
  await page.getByRole('button', { name: 'Pausar treino', exact: true }).click();
  await page.getByRole('heading', { name: /PAUSADO/ }).waitFor();
  await page.getByRole('button', { name: 'Retomar treino', exact: true }).click();
  await page.getByRole('button', { name: 'Pausar treino', exact: true }).waitFor();
  assert.deepEqual(await page.evaluate(() => window.__rollPreview.commands), ['pause','resume']); checks++;
  await page.evaluate(() => { window.__rollPreview.confirm = false; });
  await page.getByRole('button', { name: 'Reiniciar treino', exact: true }).click();
  assert.deepEqual(await page.evaluate(() => window.__rollPreview.commands), ['pause','resume']); checks++;
  await page.getByRole('button', { name: 'Encerrar treino e voltar' }).click();
  await page.evaluate(() => window.__rollPreview.hardwareBack());
  assert.deepEqual(await page.evaluate(() => window.__rollPreview.commands), ['pause','resume']);
  assert.equal(await page.locator('[data-testid="timer-digits"]').textContent(), '05:00'); checks++;
  await page.evaluate(() => { window.__rollPreview.confirm = true; });
  await page.getByRole('button', { name: 'Reiniciar treino', exact: true }).click();
  await page.getByRole('heading', { name: 'PREPARAR', exact: true }).waitFor();
  assert.deepEqual(await page.evaluate(() => window.__rollPreview.commands), ['pause','resume','restart']); checks++;
  await page.evaluate(() => window.__rollPreview.hardwareBack());
  await page.waitForTimeout(80);
  assert.deepEqual(await page.evaluate(() => window.__rollPreview.commands), ['pause','resume','restart','stop']); checks++;
  // Increase actual DOM text metrics, except digits (the clock fits its measured area).
  for (const [width, height] of [[320,568],[640,360]]) {
    await open('timer', width, height, '&scale=2&hours=1');
    await enlargeText(); await checkTimer(); await checkText();
  }
  for (const params of ['', '&paused=1', '&urgent=1', '&phase=rest']) {
    await open('timer', 393, 852, params);
    assert.equal(await page.evaluate(() => window.__rollPreview.locks[0]), 2);
    await page.setViewportSize({ width: 852, height: 393 }); await page.waitForTimeout(100);
    const before = await page.evaluate(() => JSON.stringify(window.__rollPreview.session));
    for (let i = 0; i < 6; i++) {
      await page.getByRole('button', { name: /Girar para/ }).click();
      const target = await page.evaluate(() => window.__rollPreview.selectedLock);
      assert.equal(target, i % 2 === 0 ? 1 : 2);
      await page.setViewportSize(i % 2 === 0 ? { width: 393, height: 852 } : { width: 852, height: 393 });
      await page.waitForTimeout(180);
      await checkTimer();
    }
    assert.equal(await page.evaluate(() => JSON.stringify(window.__rollPreview.session)), before);
    assert.deepEqual(await page.evaluate(() => window.__rollPreview.commands), []);
    await page.getByRole('button', { name: 'Encerrar treino e voltar' }).click();
    await page.waitForTimeout(60);
    assert.equal(await page.evaluate(() => window.__rollPreview.locks.at(-1)), 1);
    checks++;
  }
  await open('timer', 393, 852, '&running=1');
  const originalPlan = await page.evaluate(() => JSON.stringify(window.__rollPreview.session.plan));
  for (let i = 0; i < 6; i++) {
    await page.getByRole('button', { name: /Girar para/ }).click();
    await page.setViewportSize(i % 2 === 0 ? { width: 852, height: 393 } : { width: 393, height: 852 });
    await page.waitForTimeout(180);
  }
  await page.getByRole('heading', { name: 'DESCANSO', exact: true }).waitFor();
  assert.equal(await page.evaluate(() => JSON.stringify(window.__rollPreview.session.plan)), originalPlan);
  assert.deepEqual(await page.evaluate(() => window.__rollPreview.commands), []);
  await checkTimer(); checks++;
  await open('index', 393, 852); await page.screenshot({ path: path.join(screenshots, 'inicio.png'), fullPage: true });
  await page.getByRole('radio', { name: /^Rola rápido/ }).click();
  assert.equal(await page.evaluate(() => window.__rollPreview.prefs.workout.fight), 180);
  await page.getByRole('button', { name: 'Opções de Rola rápido' }).click(); await page.getByRole('button', { name: 'Duplicar favorito' }).click();
  assert.equal(await page.evaluate(() => window.__rollPreview.prefs.presets.length), 4);
  await page.getByRole('button', { name: 'Opções de Rola rápido (cópia)' }).click(); await page.getByRole('button', { name: 'Editar favorito' }).click();
  await page.getByRole('textbox', { name: 'Nome do favorito', exact: true }).fill('Teste de UI');
  await page.getByRole('button', { name: 'Salvar favorito e usar', exact: true }).click();
  assert.equal(await page.evaluate(() => window.__rollPreview.prefs.presets.at(-1).name), 'Teste de UI'); checks++;
  await page.getByRole('button', { name: 'Opções de Teste de UI' }).click(); await page.getByRole('button', { name: 'Excluir favorito' }).click();
  assert.equal(await page.evaluate(() => window.__rollPreview.prefs.presets.length), 3); checks++;
  await open('workout', 393, 852); await page.screenshot({ path: path.join(screenshots, 'configurar-treino.png'), fullPage: true });
  await page.getByRole('textbox', { name: 'Luta · seg', exact: true }).fill('60'); await page.getByRole('button', { name: 'Aplicar ao temporizador', exact: true }).click();
  assert.ok((await page.evaluate(() => window.__rollPreview.alerts)).some(s => s.includes('Duração inválida'))); checks++;
  await open('settings', 393, 852); await page.screenshot({ path: path.join(screenshots, 'preferencias.png'), fullPage: true });
  await page.getByRole('radio', { name: 'Intensidade: Máximo', exact: true }).click();
  assert.equal(await page.evaluate(() => window.__rollPreview.prefs.settings.intensity), 'maximum'); checks++;
  await page.getByRole('button', { name: /^Início da luta ·/ }).click();
  await page.getByRole('button', { name: 'Ouvir Gongo tradicional', exact: true }).waitFor();
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(screenshots, 'seletor-sons.png') });
  for (const label of ['Bip eletrônico forte','Bip de competição','Gongo tradicional','Sino de boxe','Buzina esportiva','Apito de árbitro','Alarme eletrônico']) {
    await page.getByRole('button', { name: `Ouvir ${label}`, exact: true }).click();
  }
  assert.deepEqual(await page.evaluate(() => window.__rollPreview.commands), ['preview:beep','preview:competition','preview:gong','preview:bell','preview:horn','preview:whistle','preview:alarm']); checks++;
  await page.getByRole('radio', { name: 'Selecionar Buzina esportiva', exact: true }).click();
  assert.equal(await page.evaluate(() => window.__rollPreview.prefs.settings.eventSounds.fightStart), 'horn'); checks++;
  await page.getByRole('button', { name: 'Testar 5 bips e gongo', exact: true }).click();
  assert.equal(await page.evaluate(() => window.__rollPreview.commands.at(-1)), 'preview:sequence'); checks++;
  const stopsBeforeBackground = await page.evaluate(() => window.__rollPreview.previewStops);
  await page.evaluate(() => { Object.defineProperty(document,'visibilityState',{ configurable:true, value:'hidden' }); document.dispatchEvent(new Event('visibilitychange')); });
  assert.ok(await page.evaluate(n => window.__rollPreview.previewStops > n, stopsBeforeBackground)); checks++;
  await page.evaluate(() => { Object.defineProperty(document,'visibilityState',{ configurable:true, value:'visible' }); document.dispatchEvent(new Event('visibilitychange')); });
  await open('settings', 393, 852);
  assert.equal(await page.evaluate(() => window.__rollPreview.prefs.settings.eventSounds.fightStart), 'horn');
  assert.equal(await page.evaluate(() => window.__rollPreview.prefs.settings.intensity), 'maximum'); checks++;
  await page.getByRole('button', { name: 'Restaurar áudio padrão', exact: true }).click();
  assert.equal(await page.evaluate(() => window.__rollPreview.prefs.settings.eventSounds.fightStart), 'gong');
  assert.equal(await page.evaluate(() => window.__rollPreview.prefs.settings.intensity), 'strong'); checks++;
  for (const screen of ['index', 'settings', 'workout']) for (const [width, height] of [[320,568],[393,852],[640,360]]) {
    await open(screen, width, height); await checkText();
    await open(screen, width, height, '&scale=2'); await enlargeText(); await checkText();
  }
  await open('timer', 568, 320, '&phase=finished'); await checkTimer();
  await open('timer', 320, 568, '&phase=prepare'); await checkTimer();
  await page.route('**/*', route => route.abort());
  await page.getByRole('button', { name: /Girar para/ }).click(); await page.setViewportSize({ width: 568, height: 320 }); await page.waitForTimeout(180);
  await checkTimer(); checks++;
  assert.deepEqual(errors, []);
  const result = { checks, screenshots: 21, note: 'Componentes React Native renderizados no Chromium via React Native Web. APIs Android substituídas apenas no harness; não valida rotação física, áudio ou segundo plano reais.' };
  writeFileSync(path.join(screenshots, 'checks.json'), JSON.stringify(result, null, 2)); console.log(JSON.stringify(result, null, 2));
} finally { await browser.close(); server.close(); }
