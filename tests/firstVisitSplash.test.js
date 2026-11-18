import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
test('minimal intro animates the whole logo and provides accessible automatic fallbacks', async () => {
 const s=await readFile(new URL('../src/components/FirstVisitSplash.jsx',import.meta.url),'utf8');
 const css=await readFile(new URL('../src/components/intro-visuals.css',import.meta.url),'utf8');
 assert.match(s,/src=\{LOGO_URL\}/); assert.match(css,/background: #fff/);
 assert.doesNotMatch(s,/<h1|Skip intro|IntroLogo3D|canvas/);
 assert.match(s,/prefers-reduced-motion/); assert.match(css,/prefers-reduced-motion/);
 assert.match(s,/pageRef.current.inert = show/); assert.match(s,/kalam-intro--exit/);
 assert.match(s,/5000/); assert.match(s,/3600/); assert.match(s,/window.location.pathname === '\/'/);
 assert.match(css,/@keyframes kalam-logo-enter/); assert.match(css,/animation: none/);
});
