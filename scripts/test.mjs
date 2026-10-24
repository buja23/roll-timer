import { spawnSync } from 'node:child_process';
const compile = spawnSync(process.execPath, ['node_modules/typescript/bin/tsc', '-p', 'tsconfig.core.json'], { stdio: 'inherit' });
if (compile.status !== 0) process.exit(compile.status ?? 1);
const tests = spawnSync(process.execPath, ['--test', 'tests/core.test.cjs', 'tests/display.test.cjs', 'tests/audio.test.cjs'], { stdio: 'inherit' });
process.exit(tests.status ?? 1);
