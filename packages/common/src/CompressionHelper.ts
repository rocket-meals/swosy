// Self-contained string compression (no dependencies, works in React Native,
// web and Node alike): UTF-8 → LZW with variable-width codes → Base64. Meant
// for compacting JSON payloads that travel through the clipboard or a QR code,
// e.g. the score tracker's share/export strings - JSON is highly repetitive,
// so LZW typically shrinks it to a fraction of its size.
//
// The stream format is fixed and symmetric: codes 0-255 are literal bytes,
// new dictionary entries start at 256, the code width starts at 9 bits and
// grows as the dictionary grows (up to 16 bits / 65536 entries, after which
// the dictionary is frozen). The width of the i-th emitted/read code depends
// only on i, so encoder and decoder can never drift apart.

const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

const INITIAL_DICT_SIZE = 256;
const MIN_CODE_WIDTH = 9;
const MAX_DICT_SIZE = 1 << 16;

/** Bits needed to represent every code of a dictionary with `size` entries (codes 0..size-1). */
function codeWidthFor(size: number): number {
  let width = MIN_CODE_WIDTH;
  while (1 << width < size) width++;
  return width;
}

/** Dictionary size the i-th code (0-based) was emitted with - shared between encode and decode. */
function dictSizeAtCode(index: number): number {
  return Math.min(INITIAL_DICT_SIZE + index, MAX_DICT_SIZE);
}

// ─── UTF-8 ────────────────────────────────────────────────────────────────────

function toUtf8Bytes(input: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < input.length; i++) {
    const code = input.codePointAt(i) as number;
    if (code > 0xffff) i++; // surrogate pair consumed two UTF-16 units
    if (code < 0x80) {
      bytes.push(code);
    } else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    } else if (code < 0x10000) {
      bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    } else {
      bytes.push(0xf0 | (code >> 18), 0x80 | ((code >> 12) & 0x3f), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    }
  }
  return bytes;
}

function fromUtf8Bytes(bytes: string): string | null {
  const parts: string[] = [];
  for (let i = 0; i < bytes.length; ) {
    const byte = bytes.charCodeAt(i);
    let codePoint: number;
    let extra: number;
    if (byte < 0x80) {
      codePoint = byte;
      extra = 0;
    } else if ((byte & 0xe0) === 0xc0) {
      codePoint = byte & 0x1f;
      extra = 1;
    } else if ((byte & 0xf0) === 0xe0) {
      codePoint = byte & 0x0f;
      extra = 2;
    } else if ((byte & 0xf8) === 0xf0) {
      codePoint = byte & 0x07;
      extra = 3;
    } else {
      return null;
    }
    if (i + extra >= bytes.length) return null;
    for (let j = 1; j <= extra; j++) {
      const continuation = bytes.charCodeAt(i + j);
      if ((continuation & 0xc0) !== 0x80) return null;
      codePoint = (codePoint << 6) | (continuation & 0x3f);
    }
    if (codePoint > 0x10ffff) return null;
    parts.push(String.fromCodePoint(codePoint));
    i += extra + 1;
  }
  return parts.join('');
}

// ─── Bit stream ───────────────────────────────────────────────────────────────

class BitWriter {
  private readonly bytes: number[] = [];
  private current = 0;
  private bitCount = 0;

  write(value: number, width: number): void {
    for (let bit = width - 1; bit >= 0; bit--) {
      this.current = (this.current << 1) | ((value >> bit) & 1);
      this.bitCount++;
      if (this.bitCount === 8) {
        this.bytes.push(this.current);
        this.current = 0;
        this.bitCount = 0;
      }
    }
  }

  /** Pad the last partial byte with zero bits and return all bytes. */
  finish(): number[] {
    if (this.bitCount > 0) {
      this.bytes.push(this.current << (8 - this.bitCount));
      this.current = 0;
      this.bitCount = 0;
    }
    return this.bytes;
  }
}

class BitReader {
  private position = 0;

  constructor(private readonly bytes: number[]) {}

  remainingBits(): number {
    return this.bytes.length * 8 - this.position;
  }

  read(width: number): number {
    let value = 0;
    for (let i = 0; i < width; i++) {
      const byte = this.bytes[this.position >> 3];
      const bit = (byte >> (7 - (this.position & 7))) & 1;
      value = (value << 1) | bit;
      this.position++;
    }
    return value;
  }
}

// ─── Base64 ───────────────────────────────────────────────────────────────────

function bytesToBase64(bytes: number[]): string {
  let result = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = bytes[i + 1];
    const b2 = bytes[i + 2];
    result += BASE64_ALPHABET[b0 >> 2];
    result += BASE64_ALPHABET[((b0 & 3) << 4) | ((b1 ?? 0) >> 4)];
    result += b1 === undefined ? '=' : BASE64_ALPHABET[((b1 & 15) << 2) | ((b2 ?? 0) >> 6)];
    result += b2 === undefined ? '=' : BASE64_ALPHABET[b2 & 63];
  }
  return result;
}

function base64ToBytes(text: string): number[] | null {
  const stripped = text.replace(/=+$/, '');
  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (const char of stripped) {
    const value = BASE64_ALPHABET.indexOf(char);
    if (value === -1) return null;
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }
  return bytes;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export class CompressionHelper {
  /**
   * Compress an arbitrary string (any unicode content) into a compact
   * Base64-encoded LZW stream. The empty string compresses to ''.
   */
  static compressToBase64(input: string): string {
    if (input === '') return '';
    const bytes = toUtf8Bytes(input);

    // Dictionary keys are byte sequences encoded as strings (each char one
    // byte, always < 256). Codes 0-255 are implicit literals.
    const dict = new Map<string, number>();
    let dictSize = INITIAL_DICT_SIZE;
    const writer = new BitWriter();
    let emitted = 0;

    const emit = (sequence: string) => {
      const code = sequence.length === 1 ? sequence.charCodeAt(0) : (dict.get(sequence) as number);
      writer.write(code, codeWidthFor(dictSizeAtCode(emitted)));
      emitted++;
    };

    let current = '';
    for (const byte of bytes) {
      const char = String.fromCharCode(byte);
      const extended = current + char;
      if (extended.length === 1 || dict.has(extended)) {
        current = extended;
        continue;
      }
      emit(current);
      if (dictSize < MAX_DICT_SIZE) {
        dict.set(extended, dictSize);
        dictSize++;
      }
      current = char;
    }
    emit(current);

    return bytesToBase64(writer.finish());
  }

  /**
   * Reverse of `compressToBase64`. Returns `null` for anything that is not a
   * valid stream produced by it (bad Base64, invalid codes, malformed UTF-8).
   */
  static decompressFromBase64(input: string): string | null {
    if (input === '') return '';
    const bytes = base64ToBytes(input);
    if (bytes === null || bytes.length === 0) return null;

    const dict: string[] = [];
    let dictSize = INITIAL_DICT_SIZE;
    const reader = new BitReader(bytes);
    const output: string[] = [];
    let previous: string | null = null;

    // Trailing padding is always shorter than one byte, and every code is at
    // least 9 bits wide - so "not enough bits for another code" is the clean
    // end of the stream.
    for (let index = 0; reader.remainingBits() >= codeWidthFor(dictSizeAtCode(index)); index++) {
      const code = reader.read(codeWidthFor(dictSizeAtCode(index)));
      let entry: string;
      if (code < INITIAL_DICT_SIZE) {
        entry = String.fromCharCode(code);
      } else if (code < dictSize) {
        entry = dict[code - INITIAL_DICT_SIZE];
      } else if (code === dictSize && previous !== null) {
        // The classic LZW corner case: the encoder used the entry it was just
        // about to add - it must start with the previous sequence.
        entry = previous + previous[0];
      } else {
        return null;
      }
      output.push(entry);
      if (previous !== null && dictSize < MAX_DICT_SIZE) {
        dict.push(previous + entry[0]);
        dictSize++;
      }
      previous = entry;
    }

    return fromUtf8Bytes(output.join(''));
  }
}
