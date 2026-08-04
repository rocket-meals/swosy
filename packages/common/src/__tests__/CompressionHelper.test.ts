import { CompressionHelper } from '../CompressionHelper';

function roundTrip(input: string): string | null {
  return CompressionHelper.decompressFromBase64(CompressionHelper.compressToBase64(input));
}

describe('CompressionHelper', () => {
  it('round-trips the empty string', () => {
    expect(CompressionHelper.compressToBase64('')).toBe('');
    expect(CompressionHelper.decompressFromBase64('')).toBe('');
  });

  it('round-trips short ASCII strings', () => {
    expect(roundTrip('a')).toBe('a');
    expect(roundTrip('ab')).toBe('ab');
    expect(roundTrip('hello world')).toBe('hello world');
  });

  it('round-trips unicode content (umlauts, emoji, surrogate pairs)', () => {
    const input = 'Grüße 🎲🃏 – „Spieleabend“ mit Ä/Ö/Ü/ß und 中文';
    expect(roundTrip(input)).toBe(input);
  });

  it('round-trips the LZW KwKwK corner case', () => {
    // Repeated pattern that forces the decoder to resolve a code that is not
    // in its dictionary yet.
    expect(roundTrip('aaaaaaaaaa')).toBe('aaaaaaaaaa');
    expect(roundTrip('ababababababab')).toBe('ababababababab');
  });

  it('round-trips and shrinks large repetitive JSON', () => {
    const entries = Array.from({ length: 200 }, (_, i) => ({
      id: `entry-${i}`,
      name: `Spieler ${i}`,
      color: '#2563eb',
      scores: { round1: i, round2: i * 2, round3: null },
    }));
    const json = JSON.stringify({ type: 'score-tracker-export', version: 1, entries });
    const compressed = CompressionHelper.compressToBase64(json);
    expect(CompressionHelper.decompressFromBase64(compressed)).toBe(json);
    expect(compressed.length).toBeLessThan(json.length / 2);
  });

  it('round-trips content long enough to grow the code width past 9 bits', () => {
    let input = '';
    for (let i = 0; i < 5000; i++) {
      input += String.fromCharCode(32 + ((i * 37) % 90)) + String.fromCharCode(32 + ((i * 13) % 90));
    }
    expect(roundTrip(input)).toBe(input);
  });

  it('produces Base64-only output', () => {
    const compressed = CompressionHelper.compressToBase64('{"a": 1, "b": [1, 2, 3]}');
    expect(compressed).toMatch(/^[A-Za-z0-9+/]+=*$/);
  });

  it('returns null for invalid input', () => {
    expect(CompressionHelper.decompressFromBase64('not base64 !!!')).toBeNull();
    expect(CompressionHelper.decompressFromBase64('{"json": true}')).toBeNull();
    // Valid Base64 but not a valid LZW stream (an out-of-range first code).
    expect(CompressionHelper.decompressFromBase64('//8=')).toBeNull();
  });
});
