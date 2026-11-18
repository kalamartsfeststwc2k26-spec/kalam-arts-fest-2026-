import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
test('intro retains accessibility fallbacks and reveals the public page without a skip button', async () => {
 const s=await readFile(new URL('../src/components/FirstVisitSplash.jsx',import.meta.url),'utf8');
 const effect=await readFile(new URL('../src/components/IntroLogo3D.jsx',import.meta.url),'utf8');
 const css=await readFile(new URL('../src/components/intro-visuals.css',import.meta.url),'utf8');
 assert.match(s,/src=\{LOGO_URL\}/); assert.match(css,/background: #fff/); assert.doesNotMatch(s,/<h1|Skip intro/);
 assert.match(s,/prefers-reduced-motion/); assert.match(css,/prefers-reduced-motion/);
 assert.match(s,/!reducedMotion && !webglFailed/); assert.match(effect,/import\('three'\)/);
 assert.match(effect,/cancelAnimationFrame/); assert.match(effect,/webglcontextlost/);
 assert.match(effect,/textMaterial\.opacity = fade/); assert.match(s,/pageRef.current.inert = show/);
 assert.match(s,/kalam-intro--exit/); assert.match(s,/3500/); assert.match(s,/5000/);
});
