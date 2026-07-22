#!/usr/bin/env node
/**
 * Counts SonarCloud maintainability issues grouped by message type.
 * Numbers in messages are stripped so that issues of the same kind
 * (e.g. "Reduce ... from 21 to 15" vs "... from 18 to 15") are grouped together.
 * Quoted identifiers (e.g. `Remove this useless assignment to variable "setNickname"`)
 * are replaced with a placeholder so all occurrences count as one type — except
 * keyword-like tokens (e.g. `Set`, `.some(…)`, `readonly`) that define the rule itself.
 *
 * Usage: node scripts/count-sonar-maintainability-issues.js [path/to/report.csv] [topN]
 */
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const csvPath = path.resolve(process.argv[2] || path.join(repoRoot, 'reports', 'sonarCloud', 'report_maintainability.csv'));
const topN = Number.parseInt(process.argv[3] || '10', 10);

// Reject any path (e.g. from a mistaken or malicious CLI argument) that resolves
// outside the repository, before touching the file system.
if (csvPath !== repoRoot && !csvPath.startsWith(repoRoot + path.sep)) {
    console.error(`Refusing to read a path outside the repository: ${csvPath}`);
    process.exit(1);
}

function parseCsvLine(line) {
    const fields = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (inQuotes) {
            if (char === '"') {
                if (line[i + 1] === '"') {
                    current += '"';
                    i++;
                } else {
                    inQuotes = false;
                }
            } else {
                current += char;
            }
        } else if (char === '"') {
            inQuotes = true;
        } else if (char === ',') {
            fields.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    fields.push(current);
    return fields;
}

// Quoted tokens that are part of the rule itself (keywords/APIs), not
// occurrence-specific identifiers. These are kept verbatim so that different
// rules are not merged into one type.
const KEYWORD_QUOTES = new Set([
    'Set',
    '.some(…)',
    '.find(…)',
    '.filter(…)',
    'readonly',
    'TODO',
    'await',
    'Thenable',
    'sort',
    'toSorted',
    'switch',
    'if',
    'void',
    'default',
    'boolean',
    'Boolean',
    'string',
    'export…from',
    'String#codePointAt()',
    'String#charCodeAt()',
    'Object.hasOwn()',
    'Object.prototype.hasOwnProperty.call()',
    'Math.max()',
    '[object Object]',
    'node:buffer',
    'buffer',
]);

function normalizeMessage(message) {
    return message
        // Single quotes only count as quoting when not preceded by a word
        // character, so apostrophes ("Object's", "don't") are left alone.
        .replace(/"([^"]*)"|`([^`]*)`|(?<![\w'])'([^']*)'/g, (match, dq, bq, sq) => {
            const inner = dq ?? bq ?? sq;
            if (KEYWORD_QUOTES.has(inner)) return match;
            const quote = match[0];
            return `${quote}X${quote}`;
        })
        .replace(/\d+/g, 'N');
}

const content = fs.readFileSync(csvPath, 'utf8');
const lines = content.split('\n').filter((line) => line.trim().length > 0);
const dataLines = lines.slice(1); // skip header

const counts = new Map();
for (const line of dataLines) {
    const [, message] = parseCsvLine(line);
    if (message === undefined) continue;
    const normalized = normalizeMessage(message);
    counts.set(normalized, (counts.get(normalized) || 0) + 1);
}

const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);

console.log(`Total issues: ${dataLines.length}`);
console.log(`Distinct issue types (numbers stripped): ${sorted.length}`);
console.log('');
console.log(`Top ${topN} issue types by frequency:`);
sorted.slice(0, topN).forEach(([message, count], index) => {
    console.log(`${String(index + 1).padStart(2)}. ${String(count).padStart(4)}x  ${message}`);
});
