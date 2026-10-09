import fs from 'fs';
import path from 'path';
import cp from 'child_process';

console.log('[bundle-api] Bundling TypeScript serverless functions from server/api/ into standalone ESM in api/...');

function getFiles(dir) {
  let res = [];
  if (!fs.existsSync(dir)) return res;
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    if (fs.statSync(full).isDirectory()) {
      if (!item.startsWith('_')) res = res.concat(getFiles(full));
    } else if (item.endsWith('.ts') && !item.endsWith('.d.ts')) {
      res.push(full);
    }
  }
  return res;
}

const sourceFiles = getFiles('server/api');
if (sourceFiles.length === 0) {
  console.error('[bundle-api] Error: No source .ts files found in server/api/');
  process.exit(1);
}

// Clean old api directory completely to eliminate any .ts or conflicting files
if (fs.existsSync('api')) {
  fs.rmSync('api', { recursive: true, force: true });
}

let successCount = 0;

for (const file of sourceFiles) {
  const rel = path.relative('server/api', file);
  const outfile = path.join('api', rel.replace(/\.ts$/, '.js'));
  const outdir = path.dirname(outfile);
  if (!fs.existsSync(outdir)) {
    fs.mkdirSync(outdir, { recursive: true });
  }

  const esbuildBin = fs.existsSync('./node_modules/.bin/esbuild') ? './node_modules/.bin/esbuild' : 'npx esbuild';
  try {
    cp.execSync(
      `${esbuildBin} ${file} --bundle --platform=node --format=esm --target=node20 --outfile=${outfile}`,
      { stdio: 'inherit' }
    );
    console.log(`[bundle-api] ✓ Bundled ${file} -> ${outfile}`);
    successCount++;
  } catch (err) {
    console.error(`[bundle-api] ✗ Failed to bundle ${file}:`, err);
    process.exit(1);
  }
}

console.log(`[bundle-api] Successfully bundled ${successCount} serverless API endpoints into self-contained ESM JavaScript.`);
