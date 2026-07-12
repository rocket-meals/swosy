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

const rootDir = fs.realpathSync(path.normalize(path.resolve(argv.root)));
const rootDirWithSep = rootDir.endsWith(path.sep) ? rootDir : rootDir + path.sep;

const resolvedCsvPath = path.normalize(path.resolve(argv.csv));
if (!fs.existsSync(resolvedCsvPath)) {
  console.error(`CSV file not found: ${resolvedCsvPath}`);
  process.exit(1);
}
// The CSV path is CLI-controlled; canonicalize it (resolving symlinks, "..", etc.)
// and require the canonical path to be rootDir itself or live under it before
// reading it, so a faulty argument can't point the script at arbitrary files.
// Checked immediately before the read, right at the sink.
const csvPath = fs.realpathSync(resolvedCsvPath);
if (csvPath !== rootDir && !csvPath.startsWith(rootDirWithSep)) {
  console.error(`Refusing to read CSV outside the project root: ${csvPath}`);
  process.exit(1);
}

// Sink reviewed as safe: csvPath was just canonicalized and confirmed to be rootDir
// itself or a descendant of it, immediately above. Suppressed after 3 rounds of
// sanitizer hardening (see PR #3764, #3766, #3768) didn't clear this SonarCloud
// finding.
const csvContent = fs.readFileSync(csvPath, 'utf-8'); // NOSONAR
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
  const resolvedFilePath = path.normalize(path.resolve(rootDir, fileRelPath));

  if (!fs.existsSync(resolvedFilePath)) {
    console.warn(`File not found: ${resolvedFilePath}`);
    continue;
  }

  // The CSV report is external, downloaded input; canonicalize the path it points
  // at and require the canonical path to be rootDir itself or live under it,
  // before this script reads/overwrites it. Checked immediately before the read,
  // right at the sink.
  const filePath = fs.realpathSync(resolvedFilePath);
  if (filePath !== rootDir && !filePath.startsWith(rootDirWithSep)) {
    console.warn(`Skipping path outside root directory: ${filePath}`);
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
