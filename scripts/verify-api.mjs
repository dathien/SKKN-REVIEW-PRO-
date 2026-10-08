import fs from 'fs';
import path from 'path';

console.log('[verify-api] Verifying all compiled API endpoints in Node ESM runtime...');

function getJsFiles(dir) {
  let res = [];
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    if (fs.statSync(full).isDirectory()) {
      if (!item.startsWith('_')) res = res.concat(getJsFiles(full));
    } else if (item.endsWith('.js')) {
      res.push(full);
    }
  }
  return res;
}

const jsFiles = getJsFiles('api');
if (jsFiles.length === 0) {
  console.error('[verify-api] Error: No compiled .js files found in api/');
  process.exit(1);
}

for (const file of jsFiles) {
  const fileUrl = new URL(path.resolve(file), 'file://').href;
  try {
    const mod = await import(fileUrl);
    if (typeof mod.default !== 'function') {
      throw new Error(`Default export is not a function (got ${typeof mod.default})`);
    }
    console.log(`[verify-api] ✓ Validated ${file}: Default handler function verified.`);
  } catch (err) {
    console.error(`[verify-api] ✗ Validation failed for ${file}:`, err);
    process.exit(1);
  }
}

console.log(`[verify-api] All ${jsFiles.length} serverless functions successfully verified in Node.js ESM runtime!`);
