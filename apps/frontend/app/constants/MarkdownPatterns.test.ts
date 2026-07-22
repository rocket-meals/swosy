import { markdownContentPatterns } from './MarkdownPatterns';

describe('markdownContentPatterns.link correctness', () => {
	it('matches http(s) links', () => {
		const match = markdownContentPatterns.link.exec('[Website](https://example.com/path)');
		expect(match?.[1]).toBe('Website');
		expect(match?.[2]).toBe('https://example.com/path');
	});

	it('matches geo/maps/tel links', () => {
		expect(markdownContentPatterns.link.exec('[Call](tel:+123456789)')?.[2]).toBe('tel:+123456789');
		expect(markdownContentPatterns.link.exec('[Map](geo:1,2)')?.[2]).toBe('geo:1,2');
	});

	it('matches mailto and image links (unchanged, non-flagged patterns)', () => {
		expect(markdownContentPatterns.email.exec('[Contact](mailto:test@example.com)')?.[2]).toBe('mailto:test@example.com');
		expect(markdownContentPatterns.image.exec('![alt](https://example.com/img.png)')?.[2]).toBe('https://example.com/img.png');
	});

	it('matches headings and trims leading whitespace', () => {
		expect(markdownContentPatterns.heading.exec('###   Some heading')?.[1]).toBe('Some heading');
		expect(markdownContentPatterns.heading.exec('# H1')?.[1]).toBe('H1');
		expect(markdownContentPatterns.heading.exec('###### H6')?.[1]).toBe('H6');
	});
});

describe('markdownContentPatterns reliability (SonarCloud: super-linear regex backtracking)', () => {
	// `link` and `heading` were flagged by SonarCloud in this file. The fix bounds every
	// quantifier ([^\]]{1,500} / [^\)]{1,2000} / \s{0,20} / .{0,5000}) so a pathological
	// non-matching input can't force runtime proportional to an attacker-controlled input length.
	it('fails fast on a long unterminated bracket for link', () => {
		const pathological = `[${'a'.repeat(1_000_000)}`;
		const start = Date.now();
		const match = markdownContentPatterns.link.exec(pathological);
		const durationMs = Date.now() - start;

		expect(match).toBeNull();
		expect(durationMs).toBeLessThan(500);
	});

	it('fails fast on a long heading line', () => {
		const pathological = `### ${' '.repeat(200_000)}text`;
		const start = Date.now();
		markdownContentPatterns.heading.exec(pathological);
		const durationMs = Date.now() - start;

		expect(durationMs).toBeLessThan(500);
	});
});
