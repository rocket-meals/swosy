import { CONTENT_PATTERNS } from './CustomMarkdown';

describe('CustomMarkdown CONTENT_PATTERNS correctness', () => {
	it('matches mailto links', () => {
		const match = CONTENT_PATTERNS.email.exec('[Contact us](mailto:test@example.com)');
		expect(match?.[1]).toBe('Contact us');
		expect(match?.[2]).toBe('mailto:test@example.com');
	});

	it('matches geo/maps links', () => {
		const match = CONTENT_PATTERNS.location.exec('[Meeting point](geo:52.5,13.4)');
		expect(match?.[1]).toBe('Meeting point');
		expect(match?.[2]).toBe('geo:52.5,13.4');
	});

	it('matches http(s) links', () => {
		const match = CONTENT_PATTERNS.link.exec('[Website](https://example.com/path)');
		expect(match?.[1]).toBe('Website');
		expect(match?.[2]).toBe('https://example.com/path');
	});

	it('matches images', () => {
		const match = CONTENT_PATTERNS.image.exec('![alt text](https://example.com/img.png)');
		expect(match?.[1]).toBe('alt text');
		expect(match?.[2]).toBe('https://example.com/img.png');
	});

	it('matches headings and trims leading whitespace', () => {
		const match = CONTENT_PATTERNS.heading.exec('###   Some heading');
		expect(match?.[1]).toBe('Some heading');
	});
});

describe('CustomMarkdown CONTENT_PATTERNS reliability (SonarCloud: super-linear regex backtracking)', () => {
	// SonarCloud flagged these patterns for unbounded quantifiers. The fix bounds every
	// quantifier ({1,500} / {1,2000} / {0,5000}) so a pathological, non-matching input
	// cannot force runtime proportional to an attacker-controlled input length.
	it('fails fast on a long unterminated bracket for email/location/link', () => {
		const pathological = `[${'a'.repeat(1_000_000)}`;
		for (const key of ['email', 'location', 'link'] as const) {
			const start = Date.now();
			const match = CONTENT_PATTERNS[key].exec(pathological);
			const durationMs = Date.now() - start;
			expect(match).toBeNull();
			expect(durationMs).toBeLessThan(500);
		}
	});

	it('fails fast on a long heading line', () => {
		const pathological = `### ${' '.repeat(200_000)}text`;
		const start = Date.now();
		CONTENT_PATTERNS.heading.exec(pathological);
		const durationMs = Date.now() - start;
		expect(durationMs).toBeLessThan(500);
	});
});
