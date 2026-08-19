import { formatBytes, getUtf8ByteLength } from '../helpers/ByteSizeHelper';

describe('getUtf8ByteLength', () => {
	it('counts ASCII as one byte per character', () => {
		expect(getUtf8ByteLength('abc')).toBe(3);
	});

	it('returns 0 for an empty string', () => {
		expect(getUtf8ByteLength('')).toBe(0);
	});

	it('counts two-byte characters (Latin-1 supplement, Cyrillic)', () => {
		expect(getUtf8ByteLength('ä')).toBe(2);
		expect(getUtf8ByteLength('привет')).toBe(12);
	});

	it('counts three-byte characters (CJK)', () => {
		expect(getUtf8ByteLength('保存')).toBe(6);
	});

	it('counts four-byte characters (emoji outside the BMP) once, not per surrogate', () => {
		expect(getUtf8ByteLength('😀')).toBe(4);
		expect(getUtf8ByteLength('😀😀')).toBe(8);
	});

	it('matches Buffer.byteLength for mixed content', () => {
		const value = 'a ä 保 😀 end';
		expect(getUtf8ByteLength(value)).toBe(Buffer.byteLength(value, 'utf8'));
	});
});

describe('formatBytes', () => {
	it('uses bytes below 1 KiB', () => {
		expect(formatBytes(0)).toBe('0 B');
		expect(formatBytes(1023)).toBe('1023 B');
	});

	it('switches to KB at 1 KiB', () => {
		expect(formatBytes(1024)).toBe('1.0 KB');
		expect(formatBytes(1536)).toBe('1.5 KB');
	});

	it('switches to MB at 1 MiB', () => {
		expect(formatBytes(1024 * 1024)).toBe('1.00 MB');
		expect(formatBytes(5 * 1024 * 1024 + 512 * 1024)).toBe('5.50 MB');
	});

	it('keeps the unit boundaries exclusive', () => {
		expect(formatBytes(1024 * 1024 - 1)).toContain('KB');
		expect(formatBytes(1024 * 1024)).toContain('MB');
	});
});
