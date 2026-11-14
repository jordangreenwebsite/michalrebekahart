// Copy only assets actually referenced by the preserved WordPress-export pages.
// The original export remains untouched for pixel-faithful comparison.
// No WordPress PHP/backend is used at runtime.
import { readFile, copyFile, mkdir, stat } from 'node:fs/promises';
import { dirname, extname, join, resolve, relative, sep } from 'node:path';

const root = process.cwd();
const dist = join(root, 'dist');
const legacy = ['index.html', 'our-story/index.html', 'journal/index.html',
  'commissions/index.html', 'contact/index.html', 'privacy-policy/index.html'];
const queue = [];
const seen = new Set();
const allowed = /^\/(wp-content|wp-includes)\/[A-Za-z0-9_./%@+-]+/g;

function add(input) {
  if (!input) return;
  let path = input.split(/[?#]/)[0].replaceAll('&amp;', '&');
  if (!path.startsWith('/wp-content/') && !path.startsWith('/wp-includes/')) return;
  const source = resolve(root, '.' + path);
  if (!source.startsWith(root + sep) || seen.has(source)) return;
  seen.add(source);
  queue.push({ source, path });
}
function scan(text, sourcePath = '') {
  for (const found of text.matchAll(new RegExp(allowed.source, 'g'))) add(found[0]);
  if (sourcePath.endsWith('.css')) {
    for (const found of text.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)) {
      const u = found[1].trim();
      if (!u || /^(data:|https?:|\/\/|#)/.test(u)) continue;
      if (u.startsWith('/')) add(u);
      else {
        const resolved = resolve(dirname(sourcePath), u.split(/[?#]/)[0]);
        if (resolved.startsWith(root + sep)) add('/' + relative(root, resolved).split(sep).join('/'));
      }
    }
  }
}
for (const path of legacy) scan(await readFile(join(root, path), 'utf8'));
let copied = 0, missing = [];
for (let cursor = 0; cursor < queue.length; cursor++) {
  const { source, path } = queue[cursor];
  try {
    const s = await stat(source);
    if (!s.isFile()) continue;
    const output = join(dist, path.substring(1));
    await mkdir(dirname(output), { recursive: true });
    await copyFile(source, output);
    copied++;
    if (['.css', '.js'].includes(extname(source))) scan(await readFile(source, 'utf8'), source);
  } catch (e) {
    if (e.code === 'ENOENT') missing.push(path);
    else throw e;
  }
}
if (missing.length) {
  console.warn('Missing referenced assets in original export:', missing.slice(0, 35));
  // Do not knowingly deploy a visually incomplete site.
  process.exitCode = 1;
}
console.log('Copied ' + copied + ' legacy CSS/JS/image assets for faithful rendering.');
