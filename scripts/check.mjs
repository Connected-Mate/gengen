import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

const site = new URL('../dist/', import.meta.url);
const html = await readFile(new URL('index.html', site), 'utf8');
const css = await readFile(new URL('styles.css', site), 'utf8');
assert.match(html, /^<!doctype html>/i, 'HTML must be served pre-rendered.');
assert.match(html, /<html lang="en">/, 'Document language missing.');
assert.match(html, /<title>[^<]+<\/title>/, 'Page title missing.');
assert.match(html, /<meta name="description" content="[^"]+">/, 'Search description missing.');
assert.match(html, /<link rel="canonical" href="https:\/\/connected-mate\.github\.io\/gengen\/">/, 'Canonical project URL missing.');
assert.equal((html.match(/<h1\b/g) ?? []).length, 1, 'Expected one primary heading.');
assert.doesNotMatch(html, /<script\b/i, 'This static page must not require client JavaScript.');
assert.doesNotMatch(html, /className=|\{asset\(|<GenGenSeal|<Arrow|size=\{/, 'Unrendered source detected.');
assert.match(css, /transform: rotate\(-8deg\)/, 'Preserve the original seal angle.');

const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
assert.equal(new Set(ids).size, ids.length, 'Duplicate anchor IDs.');
for (const match of html.matchAll(/\bhref="#([^"]+)"/g)) {
  assert(ids.includes(match[1]), `Broken section link: #${match[1]}`);
}
const paths = [...html.matchAll(/(?:href|src)="(\/[^"#]+)"/g), ...css.matchAll(/url\(['"]?(\/[^)'" ]+)/g)].map(match => match[1]);
for (const path of new Set(paths)) {
  assert(path.startsWith('/gengen/'), `Asset escaped GitHub project base: ${path}`);
  if (path !== '/gengen/') await access(new URL(path.slice('/gengen/'.length), site));
}
for (const file of ['robots.txt', 'sitemap.xml', 'favicon.svg', '.nojekyll', 'LICENSE', 'fonts/OFL.txt', 'licenses/lucide.txt']) {
  await access(new URL(file, site));
}
assert.match(html, /100 billion lifetime tokens/);
assert.match(html, /10 billion lifetime tokens/);
assert.match(html, /two calendar months/);
assert.match(html, /Elapsed time does not imply daily or ongoing activity/);
assert.match(html, /not a personalised issued credential/);
console.log('Passed: pre-rendering, metadata structure, section anchors, project-base assets, original seal, eligibility and label transparency.');
