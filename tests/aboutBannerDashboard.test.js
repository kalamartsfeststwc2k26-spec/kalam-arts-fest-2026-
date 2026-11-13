import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('About banner tab is connected to its manager in the Super Admin dashboard', async () => {
  const source = await readFile(new URL('../src/pages/AdminPages.jsx', import.meta.url), 'utf8');
  const dashboard = source.split('function SuperDashboard')[1]?.split('function GroupDashboard')[0];
  assert.ok(dashboard, 'SuperDashboard exists');
  assert.match(source, /import AboutBannerManager from ['"]\.\.\/components\/admin\/AboutBannerManager['"]/);
  assert.match(dashboard, /tab\s*===\s*['"]about_banners['"]\s*\?\s*<AboutBannerManager\s*\/>/);
});
