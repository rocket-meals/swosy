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
});

describe('markdownContentPatterns.link reliability (SonarCloud: super-linear regex backtracking)', () => {
	// Only `link` was flagged by SonarCloud in this file. The fix bounds both quantifiers
	// ([^\]]{1,500} / [^\)]{1,2000}) so a pathological non-matching input can't force
	// runtime proportional to an attacker-controlled input length.
	it('fails fast on a long unterminated bracket', () => {
		const pathological = `[${'a'.repeat(1_000_000)}`;
		const start = Date.now();
		const match = markdownContentPatterns.link.exec(pathological);
		const durationMs = Date.now() - start;

		expect(match).toBeNull();
		expect(durationMs).toBeLessThan(500);
	});
});
