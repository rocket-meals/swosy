import fs from 'fs';
import path from 'path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const argv = yargs(hideBin(process.argv))
  .option('csv', {
    alias: 'c',
    type: 'string',
    demandOption: true,
    describe: 'Path to maintainability CSV report',
  })
  .option('root', {
    alias: 'r',
    type: 'string',
    default: process.cwd(),
    describe: 'Root directory of the project',
  })
  .help()
  .alias('h', 'help').argv as any;

const csvPath = path.resolve(argv.csv);
const rootDir = path.resolve(argv.root);

const csvContent = fs.readFileSync(csvPath, 'utf-8');
const lines = csvContent.split(/\r?\n/).slice(1); // skip header

for (const line of lines) {
  if (!line.includes('Make this public static property readonly.')) {
    continue;
  }
  const match = line.match(/^"[^\"]+","[^\"]+","([^\"]+)",(\d+)/);
  if (!match) {
    continue;
  }
  const componentPath = match[1];
  const lineNumber = Number.parseInt(match[2], 10);
  const fileRelPath = componentPath.split(':')[1];
  const filePath = path.join(rootDir, fileRelPath);

  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filePath}`);
    continue;
  }

  const fileLines = fs.readFileSync(filePath, 'utf-8').split(/\r?\n/);
  const index = lineNumber - 1;
  if (index < 0 || index >= fileLines.length) {
    console.warn(`Line ${lineNumber} out of range in ${filePath}`);
    continue;
  }

  const targetLine = fileLines[index];
  if (/static\s+readonly/.test(targetLine)) {
    continue; // already readonly
  }
  if (!/\bstatic\b/.test(targetLine)) {
    continue; // no static keyword
  }

  fileLines[index] = targetLine.replace(/\bstatic\b/, 'static readonly');
  fs.writeFileSync(filePath, fileLines.join('\n'), 'utf-8');
  console.log(`Updated ${filePath}:${lineNumber}`);
}
