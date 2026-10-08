import fs from 'fs';
import path from 'path';
import cp from 'child_process';

console.log('[bundle-api] Bundling TypeScript serverless functions in api/ into standalone ESM JavaScript...');

function getFiles(dir) {
  let res = [];
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

const apiFiles = getFiles('api');
let successCount = 0;

for (const file of apiFiles) {
  const outfile = file.replace(/\.ts$/, '.js');
  try {
    cp.execSync(
      `npx esbuild ${file} --bundle --platform=node --format=esm --target=node20 --outfile=${outfile}`,
      { stdio: 'inherit' }
    );
    console.log(`[bundle-api] ✓ Bundled ${file} -> ${outfile}`);
    successCount++;
  } catch (err) {
    console.error(`[bundle-api] ✗ Failed to bundle ${file}:`, err);
    process.exit(1);
  }
}

console.log(`[bundle-api] Successfully bundled ${successCount} serverless API endpoints into self-contained ESM.`);
