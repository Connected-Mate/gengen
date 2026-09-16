import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';

const output = new URL('../dist/', import.meta.url);
await mkdir(output, { recursive: true });
await cp(new URL('../public/', import.meta.url), output, { recursive: true });
await cp(new URL('../LICENSE', import.meta.url), new URL('LICENSE', output));
for (const file of ['index.html', 'styles.css']) {
  await writeFile(new URL(file, output), await readFile(new URL(`../src/${file}`, import.meta.url)));
}
await writeFile(new URL('.nojekyll', output), '');
console.log('Built static GenGen site in dist/ (GitHub Pages base: /gengen/).');
