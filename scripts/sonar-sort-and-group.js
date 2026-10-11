#!/usr/bin/env node
/**
 * Sorts and groups SonarCloud issues from the CSV exports in reports/sonarCloud
 * so that issues of the same kind are matched together.
 *
 * Grouping key = the issue message, normalized:
 * - numbers are replaced with "N" ("from 21 to 15" vs. "from 18 to 15" -> one type)
 * - quoted identifiers are replaced with "X" (`variable "setNickname"` -> `variable "X"`)
 *   except keyword-like tokens (`Set`, `.some(…)`, `readonly`, …) that define the rule
 *   itself, see KEYWORD_QUOTES.
 *
 * Groups are sorted by number of occurrences (descending), ties by message.
 *
 * Usage:
 *   node scripts/sonar-sort-and-group.js [category|path/to/report.csv] [options]
 *
 *   category: reliability (= bugs, default) | maintainability | security | all
 *
 * Options:
 *   --top N       number of groups to print (default 10, "all" for every group)
 *   --details     list every location (file:line) per group
 *   --json        print the groups as JSON instead of text
 */
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = fs.realpathSync(path.resolve(__dirname, '..'));
const reportDir = path.join(repoRoot, 'reports', 'sonarCloud');
const COMPONENT_PREFIX = 'rocket-meals_rocket-meals:';

const CATEGORY_FILES = {
    reliability: 'report_reliability.csv',
    maintainability: 'report_maintainability.csv',
    security: 'report_security.csv',
};
const CATEGORY_ALIASES = {
    bug: 'reliability',
    bugs: 'reliability',
    'code-smell': 'maintainability',
    smells: 'maintainability',
    vulnerability: 'security',
};

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
    'onKeyDown|onKeyUp',
    'onKeyPress|onKeyDown|onKeyUp',
    'onFocus',
    'onBlur',
]);

function parseArgs(argv) {
    const options = { target: 'reliability', top: 10, details: false, json: false };
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === '--details') {
            options.details = true;
        } else if (arg === '--json') {
            options.json = true;
        } else if (arg === '--top') {
            const value = argv[++i];
            options.top = value === 'all' ? Infinity : Number.parseInt(value, 10);
        } else {
            options.target = arg;
        }
    }
    if (!(options.top > 0)) {
        console.error('--top expects a positive number or "all"');
        process.exit(1);
    }
    return options;
}

function resolveCsvPaths(target) {
    const category = CATEGORY_ALIASES[target] ?? target;
    if (category === 'all') {
        return Object.values(CATEGORY_FILES).map((file) => path.join(reportDir, file));
    }
    if (CATEGORY_FILES[category]) {
        return [path.join(reportDir, CATEGORY_FILES[category])];
    }
    return [path.resolve(target)];
}

// Canonicalize (resolve symlinks) before validating, so a symlink inside the
// repo that points outside it can't be used to bypass the containment check,
// then reject anything that resolves outside the repository.
function assertInsideRepo(requestedPath) {
    const csvPath = fs.realpathSync(requestedPath);
    if (csvPath !== repoRoot && !csvPath.startsWith(repoRoot + path.sep)) {
        console.error(`Refusing to read a path outside the repository: ${csvPath}`);
        process.exit(1);
    }
    return csvPath;
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

// Messages whose quoted tokens name the rule itself ("Prefer `Number.NaN` over
// `NaN`", "Use `Math.trunc` instead of `| 0`"). Placeholdering them would merge
// unrelated rules, so their quotes are kept verbatim.
const RULE_DEFINING_MESSAGE = /^(Prefer `[^`]+` over `[^`]+`|Use `[^`]+` instead of `[^`]+`)\.?$/;

function normalizeMessage(message) {
    if (RULE_DEFINING_MESSAGE.test(message)) {
        return message;
    }
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

function readIssues(csvPath) {
    // Sink reviewed as safe: csvPath was canonicalized via realpathSync and
    // confirmed to be inside the repository in assertInsideRepo().
    const content = fs.readFileSync(csvPath, 'utf8'); // NOSONAR
    const lines = content.split('\n').filter((line) => line.trim().length > 0);
    const category = path.basename(csvPath, '.csv').replace(/^report_/, '');
    return lines.slice(1).flatMap((line) => {
        const [key, message, component = '', lineNumber = ''] = parseCsvLine(line);
        if (message === undefined) return [];
        const file = component.startsWith(COMPONENT_PREFIX) ? component.slice(COMPONENT_PREFIX.length) : component;
        return [{ key, message, file, line: lineNumber, category }];
    });
}

function groupIssues(issues) {
    const groups = new Map();
    for (const issue of issues) {
        const type = normalizeMessage(issue.message);
        // The same message can be reported in different categories, keep them apart.
        const groupKey = `${issue.category}\u0000${type}`;
        if (!groups.has(groupKey)) {
            groups.set(groupKey, { type, category: issue.category, count: 0, issues: [] });
        }
        const group = groups.get(groupKey);
        group.count++;
        group.issues.push(issue);
    }
    const byLocation = (a, b) => a.file.localeCompare(b.file) || Number(a.line) - Number(b.line);
    return [...groups.values()]
        .map((group) => ({
            ...group,
            files: new Set(group.issues.map((issue) => issue.file)).size,
            issues: group.issues.sort(byLocation),
        }))
        .sort((a, b) => b.count - a.count || a.type.localeCompare(b.type));
}

function printText(groups, totalIssues, options) {
    console.log(`Total issues: ${totalIssues}`);
    console.log(`Distinct issue types: ${groups.length}`);
    console.log('');
    const shown = groups.slice(0, options.top);
    console.log(`Top ${shown.length} issue types by frequency:`);
    shown.forEach((group, index) => {
        const prefix = options.target === 'all' ? `[${group.category}] ` : '';
        const files = `${group.files} file${group.files === 1 ? '' : 's'}`;
        console.log(`${String(index + 1).padStart(2)}. ${String(group.count).padStart(4)}x  (${files.padStart(9)})  ${prefix}${group.type}`);
        if (options.details) {
            for (const issue of group.issues) {
                console.log(`          ${issue.file}:${issue.line}`);
            }
        }
    });
}

function main() {
    const options = parseArgs(process.argv.slice(2));
    const issues = resolveCsvPaths(options.target).map(assertInsideRepo).flatMap(readIssues);
    const groups = groupIssues(issues);
    if (options.json) {
        const shown = groups.slice(0, options.top).map(({ issues: groupIssuesList, ...group }) =>
            options.details ? { ...group, issues: groupIssuesList } : group,
        );
        console.log(JSON.stringify({ totalIssues: issues.length, distinctTypes: groups.length, groups: shown }, null, 2));
    } else {
        printText(groups, issues.length, options);
    }
}

module.exports = { normalizeMessage, parseCsvLine, groupIssues };

if (require.main === module) {
    main();
}
