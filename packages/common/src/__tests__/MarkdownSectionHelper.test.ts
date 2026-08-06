import { normalizeLinebreaks, parseMarkdownToBlocks, sanitizeLocationLinkWhitespace } from 'repo-depkit-common';

describe('sanitizeLocationLinkWhitespace', () => {
	it('strips whitespace from geo/maps/latlon link destinations', () => {
		expect(sanitizeLocationLinkWhitespace('[Meeting point](geo:52.5, 13.4)')).toBe('[Meeting point](geo:52.5,13.4)');
		expect(sanitizeLocationLinkWhitespace('[Spot](maps:52.5,  13.4)')).toBe('[Spot](maps:52.5,13.4)');
		expect(sanitizeLocationLinkWhitespace('[Spot](latlon:52.5, 13.4)')).toBe('[Spot](latlon:52.5,13.4)');
	});

	it('leaves unrelated links untouched', () => {
		expect(sanitizeLocationLinkWhitespace('[Website](https://example.com/a b)')).toBe('[Website](https://example.com/a b)');
	});
});

describe('normalizeLinebreaks', () => {
	it('turns literal backslash-n into a real newline', () => {
		expect(normalizeLinebreaks('line one\\nline two')).toBe('line one\nline two');
	});

	it('turns <br> variants into real newlines', () => {
		expect(normalizeLinebreaks('a<br>b<br/>c</br>d')).toBe('a\nb\nc\nd');
	});

	it('turns <p> tags into real newlines', () => {
		expect(normalizeLinebreaks('<p>a</p><p>b</p>')).toBe('\na\n\nb\n');
	});
});

describe('parseMarkdownToBlocks - flat mode (collapsibleSections: false)', () => {
	it('renders a heading as a plain heading block, not a section', () => {
		const blocks = parseMarkdownToBlocks('## Kurz gesagt\n\nSome text.');
		expect(blocks).toEqual([
			{ type: 'heading', text: 'Kurz gesagt', level: 2 },
			{ type: 'html', html: expect.stringContaining('Some text.') },
		]);
	});

	it('renders a table as html', () => {
		const blocks = parseMarkdownToBlocks('| a | b |\n| - | - |\n| 1 | 2 |');
		expect(blocks).toHaveLength(1);
		expect(blocks[0]).toMatchObject({ type: 'html' });
		expect((blocks[0] as { html: string }).html).toContain('<table>');
	});

	it('renders an image as html', () => {
		const blocks = parseMarkdownToBlocks('![alt text](https://example.com/img.png)');
		const html = (blocks[0] as { html: string }).html;
		expect(html).toContain('<img');
		expect(html).toContain('src="https://example.com/img.png"');
		expect(html).toContain('alt="alt text"');
	});

	it('renders a mailto link as html', () => {
		const blocks = parseMarkdownToBlocks('[Contact us](mailto:test@example.com)');
		const html = (blocks[0] as { html: string }).html;
		expect(html).toContain('href="mailto:test@example.com"');
	});
});

describe('parseMarkdownToBlocks - collapsible sections', () => {
	it('nests a lower heading level under its parent section', () => {
		const blocks = parseMarkdownToBlocks('## A\n\nA text.\n\n### A.1\n\nNested text.\n\n## B\n\nB text.', { collapsibleSections: true });

		expect(blocks).toHaveLength(2);
		const sectionA = blocks[0] as { type: 'section'; header: string; level: number; children: unknown[] };
		expect(sectionA.type).toBe('section');
		expect(sectionA.header).toBe('A');
		expect(sectionA.level).toBe(2);
		// A's own "A text." html block, plus the nested A.1 section.
		expect(sectionA.children).toHaveLength(2);
		expect(sectionA.children[1]).toMatchObject({ type: 'section', header: 'A.1', level: 3 });

		const sectionB = blocks[1] as { type: 'section'; header: string };
		expect(sectionB.type).toBe('section');
		expect(sectionB.header).toBe('B');
	});

	it('keeps a level-1 heading as a plain heading even with collapsibleSections enabled', () => {
		const blocks = parseMarkdownToBlocks('# Title\n\n## Section', { collapsibleSections: true });
		expect(blocks[0]).toEqual({ type: 'heading', text: 'Title', level: 1 });
		expect(blocks[1]).toMatchObject({ type: 'section', header: 'Section', level: 2 });
	});

	it('a level-1 heading closes any open sections', () => {
		const blocks = parseMarkdownToBlocks('## A\n\ntext\n\n# Title\n\n## B\n\ntext', { collapsibleSections: true });
		expect(blocks.map((b) => b.type)).toEqual(['section', 'heading', 'section']);
	});
});

describe('parseMarkdownToBlocks - reference-style links resolve across chunks', () => {
	it('resolves a reference link even when split across separate rendered html chunks by a heading', () => {
		const blocks = parseMarkdownToBlocks('[link][ref]\n\n## Heading\n\ntext\n\n[ref]: https://example.com', { collapsibleSections: true });
		const firstHtml = (blocks[0] as { html: string }).html;
		expect(firstHtml).toContain('href="https://example.com"');
	});
});
