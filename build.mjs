// Inlines house.json into index.html between the SPEC-START / SPEC-END markers,
// then writes docs/index.html: the same page wrapped as a complete standalone HTML document for hosting
// (GitHub Pages can serve the docs folder directly).
// Usage: node build.mjs
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';

const specPath = new URL('./house.json', import.meta.url);
const htmlPath = new URL('./index.html', import.meta.url);
const outDir = new URL('./docs/', import.meta.url);

const spec = JSON.parse(readFileSync(specPath, 'utf8'));
const html = readFileSync(htmlPath, 'utf8');
const marker = /\/\*SPEC-START\*\/[\s\S]*?\/\*SPEC-END\*\//;
if (!marker.test(html)) throw new Error('SPEC-START / SPEC-END markers not found in index.html');

const json = JSON.stringify(spec, null, 2).replace(/<\//g, '<\\/');
const page = html.replace(marker, () => `/*SPEC-START*/${json}/*SPEC-END*/`);
writeFileSync(htmlPath, page);

const standalone = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<style>[hidden]{display:none!important}</style>
</head>
<body>
${page}
</body>
</html>
`;
mkdirSync(outDir, { recursive: true });
writeFileSync(new URL('./index.html', outDir), standalone);
// Images the page loads from beside itself: the sky and the start-screen photo.
for (const name of ['sky.jpg', 'Start_image.jpg']) {
  const src = new URL(`./assets/${name}`, import.meta.url);
  if (existsSync(src)) copyFileSync(src, new URL(`./${name}`, outDir));
}
const floors = Array.isArray(spec.floors) && spec.floors.length ? spec.floors : [spec];
const nRooms = floors.reduce((s, f) => s + (f.rooms ?? []).length, 0), nOpen = floors.reduce((s, f) => s + (f.openings ?? []).length, 0);
const lake = spec.site && spec.site.lake ? ', lake' : '';
console.log(`Inlined "${spec.name ?? 'untitled'}" (${floors.length} floor${floors.length === 1 ? '' : 's'}, ${nRooms} rooms, ${nOpen} openings${lake}) into index.html and docs/index.html`);
