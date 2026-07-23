import { PARSE_MARKDOWN_REGEX, extractTextAndLink } from './markdownHelpers';

describe('extractTextAndLink correctness', () => {
	it('extracts the label, link and remaining text', () => {
		const result = extractTextAndLink('Course description [Link Text](https://example.com/path)');
		expect(result).toEqual({
			text: 'Course description',
			label: 'Link Text',
			link: 'https://example.com/path',
		});
	});

	it('returns the original description with an empty label/null link when there is no markdown link', () => {
		expect(extractTextAndLink('plain description')).toEqual({
			text: 'plain description',
			label: '',
			link: null,
		});
	});
});

describe('extractTextAndLink reliability (SonarCloud: super-linear regex backtracking)', () => {
	// The rule flagged the previous /\[(.*?)\]\((.*?)\)/g pattern. The fix bounds both
	// quantifiers ([^\]]{0,500} / [^)]{0,2000}) so a pathological input can't force
	// runtime proportional to an attacker-controlled input length.
	it('stays fast for a long, unterminated bracket', () => {
		const pathological = `[${'a'.repeat(1_000_000)}`;
		const start = Date.now();
		const result = extractTextAndLink(pathological);
		const durationMs = Date.now() - start;

		expect(result.link).toBeNull();
		expect(durationMs).toBeLessThan(500);
	});
});

describe('PARSE_MARKDOWN_REGEX correctness', () => {
	it('splits bold, italic and link segments out of plain text', () => {
		const parts = 'Hello **bold** and *italic* and [link](http://x.com) end'.split(PARSE_MARKDOWN_REGEX);
		expect(parts).toEqual(['Hello ', '**bold**', ' and ', '*italic*', ' and ', '[link](http://x.com)', ' end']);
	});

	it('keeps a single asterisk inside bold content intact', () => {
		const parts = '**a*b** rest'.split(PARSE_MARKDOWN_REGEX);
		expect(parts).toEqual(['', '**a*b**', ' rest']);
	});
});

describe('PARSE_MARKDOWN_REGEX reliability (SonarCloud: super-linear regex backtracking)', () => {
	// The rule flagged the previous /(\*\*.*?\*\*|\*.*?\*|\[.*?\]\(.*?\))/g pattern:
	// overlapping alternatives (`**` vs `*`) combined with unbounded `.*?` are a classic
	// catastrophic-backtracking shape. The fix bounds every quantifier to a fixed maximum.
	it('stays fast for a long run of unmatched asterisks', () => {
		const pathological = '*'.repeat(200_000);
		const start = Date.now();
		pathological.split(PARSE_MARKDOWN_REGEX);
		const durationMs = Date.now() - start;

		expect(durationMs).toBeLessThan(1000);
	});

	it('stays fast for a long run of unmatched opening brackets', () => {
		const pathological = '['.repeat(200_000);
		const start = Date.now();
		pathological.split(PARSE_MARKDOWN_REGEX);
		const durationMs = Date.now() - start;

		expect(durationMs).toBeLessThan(1000);
	});
});
