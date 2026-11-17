import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const LAB_ASSETS = ['style.css', 'data.js', 'engine.js', 'assessment.js', 'app.js', 'update-check.js'];
const hash = (content) => createHash('sha256').update(content).digest('hex').slice(0, 16);
const releaseMeta = /(<meta name="statsense-release" content=")[^"]*(">)/;
const assetReference = /((?:href|src)=")((?:style\.css|data\.js|engine\.js|assessment\.js|app\.js|update-check\.js))(?:\?[^"]*)?(")/g;

export async function finalizeLabRelease(directory = 'dist/teaching/pheb-602/statsense-lab') {
  const entry = resolve(directory, 'index.html');
  const source = await readFile(entry, 'utf8');
  if (!releaseMeta.test(source)) throw new Error('StatSense release metadata is missing.');
  const html = source.replace(releaseMeta, '$1development$2').replace(assetReference, '$1$2$3');
  const assets = await Promise.all(LAB_ASSETS.map(async (name) => [name, await readFile(resolve(directory, name), 'utf8')]));
  const version = hash(JSON.stringify([html, assets]));
  const fingerprints = new Map(assets.map(([name, content]) => [name, hash(content)]));
  const output = html.replace(releaseMeta, `$1${version}$2`).replace(
    assetReference,
    (_, start, name, end) => `${start}${name}?v=${fingerprints.get(name)}${end}`,
  );
  await writeFile(entry, output);
  await writeFile(resolve(directory, 'release.json'), JSON.stringify({ version }) + '\n');
  return version;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  console.log(`StatSense release: ${await finalizeLabRelease(process.argv[2])}`);
}
