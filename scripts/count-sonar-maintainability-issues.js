#!/usr/bin/env node
/**
 * Counts SonarCloud maintainability issues grouped by message type.
 * Numbers in messages are stripped so that issues of the same kind
 * (e.g. "Reduce ... from 21 to 15" vs "... from 18 to 15") are grouped together.
 *
 * Usage: node scripts/count-sonar-maintainability-issues.js [path/to/report.csv] [topN]
 */
const fs = require('fs');
const path = require('path');

const csvPath = process.argv[2] || path.join(__dirname, '..', 'reports', 'sonarCloud', 'report_maintainability.csv');
const topN = parseInt(process.argv[3] || '10', 10);

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

function normalizeMessage(message) {
    return message.replace(/\d+/g, 'N');
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
