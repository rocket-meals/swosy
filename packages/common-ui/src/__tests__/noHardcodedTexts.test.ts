/**
 * Guards the "no hardcoded user-facing strings" rule from AGENTS.md for `repo-depkit-common-ui`.
 *
 * Components in this package are shared by apps in different languages, so they must never
 * ship a text of their own. User-facing wording arrives through a `texts` prop (see
 * `WeatherPreviewTexts`, `AppDownloadBannerTexts`, ...); the app resolves its translation
 * keys and passes the finished strings down.
 *
 * The scan is deliberately simple – it looks at the source text, not at a parsed AST – but it
 * catches the two ways a literal actually reaches a user: as JSX text between tags, and as a
 * literal on a prop that renders as a label. Anything it cannot decide belongs in
 * {@link ALLOWED_LITERALS} with a reason.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const COMPONENTS_DIRECTORY = join(__dirname, '..', 'components');

/** Props whose value is rendered to the user more or less verbatim. */
const USER_FACING_PROPS = [
	'label',
	'title',
	'placeholder',
	'message',
	'accessibilityLabel',
	'accessibilityHint',
];

/**
 * Literals that are allowed to stay in the source, with the reason why.
 *
 * Add an entry only for text that is *not* user-facing prose: brand names, technical format
 * hints, or developer-only debug tooling. Everything else gets a `texts` prop instead.
 */
const ALLOWED_LITERALS: Readonly<Record<string, string>> = {
	// Technical format hint / example value – identical in every language.
	'DD.MM.YYYY': 'date input format hint, not prose',
	'#2596be': 'example hex color in the color picker placeholder',
	// Proper noun of the map data source, never translated.
	'OSM Vector Map': 'iframe title naming the OpenStreetMap vector tile source',
	// The avatar editor is a developer-only tool reachable from the experimental screen;
	// its labels are dicebear prop names and debug captions, not product copy.
	'Paste JSON config here...': 'developer-only avatar editor (debug tooling)',
	'Hidden Props': 'developer-only avatar editor (debug tooling)',
	translateX: 'dicebear prop name shown verbatim in the developer-only avatar editor',
	translateY: 'dicebear prop name shown verbatim in the developer-only avatar editor',
	rotate: 'dicebear prop name shown verbatim in the developer-only avatar editor',
	flip: 'dicebear prop name shown verbatim in the developer-only avatar editor',
	clip: 'dicebear prop name shown verbatim in the developer-only avatar editor',
	'Debug: QuickStart Touch-Tests': 'developer-only avatar editor (debug tooling)',
};

interface HardcodedText {
	readonly file: string;
	readonly line: number;
	readonly text: string;
	readonly kind: 'jsx-text' | 'prop';
}

function listSourceFiles(directory: string): string[] {
	const files: string[] = [];
	for (const entry of readdirSync(directory)) {
		const fullPath = join(directory, entry);
		if (statSync(fullPath).isDirectory()) {
			files.push(...listSourceFiles(fullPath));
		} else if (entry.endsWith('.tsx') || entry.endsWith('.ts')) {
			files.push(fullPath);
		}
	}
	return files;
}

/** Text between JSX tags, e.g. `<Text>Save</Text>` – at least three letters, no interpolation. */
const JSX_TEXT_PATTERN = />([A-Za-z][A-Za-z ]{2,})</g;

/** A user-facing prop with a literal value, e.g. `label="Save"`. */
const PROP_LITERAL_PATTERN = new RegExp(
	`\\b(?:${USER_FACING_PROPS.join('|')})=(?:"([^"]{3,})"|'([^']{3,})')`,
	'g',
);

function findHardcodedTexts(source: string, file: string): HardcodedText[] {
	const findings: HardcodedText[] = [];
	const lines = source.split('\n');

	lines.forEach((line, index) => {
		for (const match of line.matchAll(JSX_TEXT_PATTERN)) {
			const text = match[1]?.trim();
			if (text !== undefined && text.length > 0) {
				findings.push({ file, line: index + 1, text, kind: 'jsx-text' });
			}
		}
		for (const match of line.matchAll(PROP_LITERAL_PATTERN)) {
			const text = (match[1] ?? match[2])?.trim();
			if (text !== undefined && text.length > 0) {
				findings.push({ file, line: index + 1, text, kind: 'prop' });
			}
		}
	});

	return findings;
}

describe('findHardcodedTexts (the scanner itself)', () => {
	it('finds JSX text between tags', () => {
		expect(findHardcodedTexts('<Text>Save changes</Text>', 'x.tsx')).toEqual([
			{ file: 'x.tsx', line: 1, text: 'Save changes', kind: 'jsx-text' },
		]);
	});

	it('finds a literal on a user-facing prop', () => {
		expect(findHardcodedTexts('<Input placeholder="Type here" />', 'x.tsx')).toEqual([
			{ file: 'x.tsx', line: 1, text: 'Type here', kind: 'prop' },
		]);
	});

	it('accepts an interpolated JSX child', () => {
		expect(findHardcodedTexts('<Text>{texts.save}</Text>', 'x.tsx')).toEqual([]);
	});

	it('accepts an interpolated prop', () => {
		expect(findHardcodedTexts('<Input placeholder={texts.typeHere} />', 'x.tsx')).toEqual([]);
	});

	it('ignores props that are not user facing', () => {
		expect(findHardcodedTexts('<Icon name="chevron-left" testID="back-button" />', 'x.tsx')).toEqual([]);
	});

	it('ignores very short fragments such as JSX operators', () => {
		expect(findHardcodedTexts('<Text>ok</Text>', 'x.tsx')).toEqual([]);
	});

	it('reports the line number of a finding', () => {
		expect(findHardcodedTexts('const a = 1;\n<Text>Hello there</Text>', 'x.tsx')[0]?.line).toBe(2);
	});
});

describe('repo-depkit-common-ui components', () => {
	const findings = listSourceFiles(COMPONENTS_DIRECTORY).flatMap((file) =>
		findHardcodedTexts(readFileSync(file, 'utf8'), file),
	);

	it('scans a plausible number of files – a broken scanner must not pass silently', () => {
		expect(listSourceFiles(COMPONENTS_DIRECTORY).length).toBeGreaterThan(30);
	});

	it('contains no hardcoded user-facing text outside the documented allowlist', () => {
		const unexpected = findings.filter((finding) => ALLOWED_LITERALS[finding.text] === undefined);
		const report = unexpected.map(
			(finding) => `${finding.file.slice(COMPONENTS_DIRECTORY.length + 1)}:${finding.line} [${finding.kind}] "${finding.text}"`,
		);
		expect(report).toEqual([]);
	});

	it('keeps the allowlist free of stale entries', () => {
		const foundTexts = new Set(findings.map((finding) => finding.text));
		const stale = Object.keys(ALLOWED_LITERALS).filter((text) => !foundTexts.has(text));
		expect(stale).toEqual([]);
	});
});
