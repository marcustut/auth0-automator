import fs from 'node:fs';
import console from 'node:console';
import process from 'node:process';
import esbuild from 'esbuild';

// remove build folder
fs.rmSync('build', { recursive: true, force: true });

// build main server
await esbuild
  .build({
    entryPoints: ['src/index.ts'],
    platform: 'node',
    outdir: 'build',
    bundle: true,
    format: 'cjs',
    sourcemap: 'external',
    external: ['superagent-proxy'],
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
