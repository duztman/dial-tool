// Dial Packer: joins the page and its four scripts into one file,
// dial-packer.html, with nothing fetched at run time but the Inter web font.
// Run: node packer/build.mjs   (from the repo root, or from packer/)
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const read = f => readFileSync(join(here, 'src', f), 'utf8');
let page = read('page.html');
for (const [mark, file] of [['PACK', 'pack.js'], ['EVEN', 'even.js'], ['VORONOI', 'voronoi.js'], ['COLOUR', 'colour.js']]) {
  if (!page.includes(`/*${mark}*/`)) throw new Error(`page.html has no /*${mark}*/ mark`);
  page = page.replace(`/*${mark}*/`, () => read(file));
}
// The page is written without <html>/<head>/<body> (it was first an artifact);
// the standalone file gets a full document around it.
const cut = page.indexOf('</style>') + '</style>'.length;
const doc = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
${page.slice(0, cut)}
</head>
<body>
${page.slice(cut)}
</body>
</html>
`;
writeFileSync(join(here, 'dial-packer.html'), doc);
console.log('wrote packer/dial-packer.html', (doc.length / 1024).toFixed(0), 'kB');
