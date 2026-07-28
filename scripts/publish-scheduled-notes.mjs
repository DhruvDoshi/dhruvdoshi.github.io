import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const notesDir = path.join(root, 'src/content/notes');
const argumentsList = process.argv.slice(2);
const dryRun = argumentsList.includes('--dry-run');
const dateIndex = argumentsList.indexOf('--date');
const publicationDate = dateIndex === -1
  ? new Date().toISOString().slice(0, 10)
  : argumentsList[dateIndex + 1];

if (!/^\d{4}-\d{2}-\d{2}$/.test(publicationDate || '')) {
  throw new Error('Publication date must use YYYY-MM-DD.');
}

const files = (await readdir(notesDir)).filter((file) => file.endsWith('.md')).sort();
const published = [];

for (const file of files) {
  const filePath = path.join(notesDir, file);
  const source = await readFile(filePath, 'utf8');
  const date = source.match(/^date:\s*(\d{4}-\d{2}-\d{2})/m)?.[1];
  const isScheduled = /^status:\s*scheduled\s*$/m.test(source);

  if (!isScheduled || !date || date > publicationDate) continue;

  published.push(file);
  if (!dryRun) {
    await writeFile(filePath, source.replace(/^status:\s*scheduled\s*$/m, 'status: published'));
  }
}

console.log(`${dryRun ? 'Due' : 'Published'} ${published.length} note${published.length === 1 ? '' : 's'} on ${publicationDate}.`);
for (const file of published) console.log(`- ${file}`);
