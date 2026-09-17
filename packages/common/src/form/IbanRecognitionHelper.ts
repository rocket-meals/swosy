import { StringHelper } from '../StringHelper';
import { FormHelperCommon } from './FormHelperCommon';

/**
 * A single IBAN found in recognized text.
 *
 * `checksumValid` and `lengthValid` are reported separately on purpose: a
 * printed sample card (e.g. the `DE00 0123 4567 8901 2345 67` on the giro card
 * fixture in `__tests__/fixtures/girocard`) has the right shape but a dummy
 * check digit, and a caller that only wants to *demo* the scanner still needs
 * to see that candidate.
 */
export interface IbanCandidate {
  /** Uppercase, without separators, e.g. `DE89370400440532013000`. */
  iban: string;
  /** Grouped in blocks of four, e.g. `DE89 3704 0044 0532 0130 00`. */
  formatted: string;
  countryCode: string;
  /** The ISO 13616 mod-97 check digits match. */
  checksumValid: boolean;
  /** The length matches the IBAN registry entry for `countryCode`. */
  lengthValid: boolean;
}

export interface FindIbanOptions {
  /**
   * Accept a candidate whose mod-97 check digits do not match. Off by default —
   * a failing checksum is the cheapest signal that OCR misread a character.
   */
  allowInvalidChecksum?: boolean;
}

/**
 * Finds an IBAN in the text lines an OCR engine returns for a photo of a bank
 * card (giro card, debit card, EC card).
 *
 * The helper is deliberately free of any camera or OCR dependency: it takes the
 * recognized lines and hands back the best IBAN in them, so that the same logic
 * can be unit tested against stored OCR output and reused by any app.
 */
export class IbanRecognitionHelper {
  /** Shortest and longest IBAN in the registry — used to bound the scan regex. */
  static readonly MIN_IBAN_LENGTH = 15;
  static readonly MAX_IBAN_LENGTH = 34;

  /** IBAN length per country, from the SWIFT IBAN registry. */
  static readonly IBAN_LENGTH_BY_COUNTRY: Readonly<Record<string, number>> = {
    AD: 24, AE: 23, AL: 28, AT: 20, AZ: 28, BA: 20, BE: 16, BG: 22, BH: 22,
    BI: 27, BR: 29, BY: 28, CH: 21, CR: 22, CY: 28, CZ: 24, DE: 22, DJ: 27,
    DK: 18, DO: 28, EE: 20, EG: 29, ES: 24, FI: 18, FO: 18, FR: 27, GB: 22,
    GE: 22, GI: 23, GL: 18, GR: 27, GT: 28, HR: 21, HU: 28, IE: 22, IL: 23,
    IQ: 23, IS: 26, IT: 27, JO: 30, KW: 30, KZ: 20, LB: 28, LC: 32, LI: 21,
    LT: 20, LU: 20, LV: 21, LY: 25, MC: 27, MD: 24, ME: 22, MK: 19, MN: 20,
    MR: 27, MT: 31, MU: 30, NI: 28, NL: 18, NO: 15, PK: 24, PL: 28, PS: 29,
    PT: 25, QA: 29, RO: 24, RS: 22, RU: 33, SA: 24, SC: 31, SD: 18, SE: 24,
    SI: 19, SK: 24, SM: 27, SO: 23, ST: 25, SV: 28, TL: 23, TN: 24, TR: 26,
    UA: 29, VA: 22, VG: 24, XK: 20,
  };

  /**
   * Glyphs an OCR engine confuses with a digit. Applied only where the IBAN
   * grammar demands a digit (the two check digits), never to the whole string —
   * the account part of many IBANs legitimately contains letters.
   */
  private static readonly LETTER_TO_DIGIT: Readonly<Record<string, string>> = {
    O: '0', Q: '0', D: '0', I: '1', L: '1', T: '1', Z: '2', E: '3', A: '4',
    S: '5', G: '6', B: '8',
  };

  /** The reverse direction, for the two leading country letters. */
  private static readonly DIGIT_TO_LETTER: Readonly<Record<string, string>> = {
    '0': 'O', '1': 'I', '2': 'Z', '4': 'A', '5': 'S', '6': 'G', '8': 'B',
  };

  /**
   * Countries whose BBAN (everything after the check digits) is purely numeric.
   * For those, a letter anywhere in the number is certainly an OCR slip and can
   * be mapped back to its digit — which is what rescues a German giro card shot
   * at an angle, where `0` regularly comes back as `O`.
   */
  private static readonly NUMERIC_BBAN_COUNTRIES: ReadonlySet<string> = new Set([
    'AT', 'BE', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI', 'FO', 'GL', 'GR', 'HR',
    'HU', 'IS', 'LT', 'LU', 'LV', 'NL', 'NO', 'PL', 'PT', 'RO', 'SE', 'SI',
    'SK', 'TN',
  ]);

  /** Uppercases and drops everything that cannot be part of an IBAN. */
  static normalizeIban(text: string): string {
    const withoutSeparators = StringHelper.replaceAllWithOptions({
      str: text,
      find: '[^A-Za-z0-9]',
      replace: '',
    });
    return withoutSeparators.toUpperCase();
  }

  /** Groups an IBAN in blocks of four, the way it is printed on a card. */
  static formatIban(iban: string): string {
    return FormHelperCommon.formatIban(iban);
  }

  /** Verifies the ISO 13616 / ISO 7064 mod-97-10 check digits. */
  static isValidIbanChecksum(iban: string): boolean {
    const normalized = IbanRecognitionHelper.normalizeIban(iban);
    if (normalized.length < IbanRecognitionHelper.MIN_IBAN_LENGTH) {
      return false;
    }
    const rearranged = normalized.slice(4) + normalized.slice(0, 4);
    let remainder = 0;
    for (const character of rearranged) {
      const codePoint = character.charCodeAt(0);
      // 'A'..'Z' expand to 10..35, digits stay as they are.
      const isLetter = codePoint >= 65 && codePoint <= 90;
      const isDigit = codePoint >= 48 && codePoint <= 57;
      if (!isLetter && !isDigit) {
        return false;
      }
      const value = isLetter ? codePoint - 55 : codePoint - 48;
      remainder = (remainder * (value > 9 ? 100 : 10) + value) % 97;
    }
    return remainder === 1;
  }

  /** True when the length matches the registry entry for the country. */
  static hasValidIbanLength(iban: string): boolean {
    const normalized = IbanRecognitionHelper.normalizeIban(iban);
    const expectedLength = IbanRecognitionHelper.IBAN_LENGTH_BY_COUNTRY[normalized.slice(0, 2)];
    if (expectedLength === undefined) {
      return false;
    }
    return normalized.length === expectedLength;
  }

  /**
   * Repairs the characters an OCR engine typically gets wrong, position by
   * position: the first two characters must be letters, the next two digits.
   */
  static repairOcrConfusions(candidate: string): string {
    const normalized = IbanRecognitionHelper.normalizeIban(candidate);
    const characters = normalized.split('');
    for (let index = 0; index < characters.length && index < 4; index++) {
      const character = characters[index];
      if (character === undefined) {
        continue;
      }
      if (index < 2) {
        characters[index] = IbanRecognitionHelper.DIGIT_TO_LETTER[character] ?? character;
      } else {
        characters[index] = IbanRecognitionHelper.LETTER_TO_DIGIT[character] ?? character;
      }
    }
    return characters.join('');
  }

  /**
   * The readings of one recognized run that are worth checking, best guess
   * first: head repaired, head repaired plus a numeric body where the country
   * allows only digits there, and the untouched reading.
   */
  static buildReadings(rawCandidate: string): string[] {
    const normalized = IbanRecognitionHelper.normalizeIban(rawCandidate);
    const headRepaired = IbanRecognitionHelper.repairOcrConfusions(normalized);
    const readings = [headRepaired, normalized];

    if (IbanRecognitionHelper.NUMERIC_BBAN_COUNTRIES.has(headRepaired.slice(0, 2))) {
      const body = headRepaired.slice(4).split('');
      for (let index = 0; index < body.length; index++) {
        const character = body[index];
        if (character === undefined) {
          continue;
        }
        body[index] = IbanRecognitionHelper.LETTER_TO_DIGIT[character] ?? character;
      }
      readings.splice(1, 0, headRepaired.slice(0, 4) + body.join(''));
    }

    return readings;
  }

  /** Describes a normalized string as an {@link IbanCandidate}. */
  static describeCandidate(candidate: string): IbanCandidate {
    const iban = IbanRecognitionHelper.normalizeIban(candidate);
    return {
      iban,
      formatted: IbanRecognitionHelper.formatIban(iban),
      countryCode: iban.slice(0, 2),
      checksumValid: IbanRecognitionHelper.isValidIbanChecksum(iban),
      lengthValid: IbanRecognitionHelper.hasValidIbanLength(iban),
    };
  }

  /**
   * Collects every IBAN-shaped run of characters in the recognized lines.
   *
   * OCR engines split a card differently on every frame — sometimes the IBAN is
   * one line, sometimes the label `IBAN:` sits in front of it, sometimes the
   * number is torn into two lines. Lines are therefore scanned individually,
   * then glued to their neighbour, so a torn number is still found.
   *
   * Only readings whose length matches their country are returned, best-first:
   * the ones whose checksum adds up come before the ones that merely have the
   * right shape.
   */
  static findIbanCandidates(lines: string[]): IbanCandidate[] {
    const searchSpaces: string[] = [];
    for (let index = 0; index < lines.length; index++) {
      const line = lines[index] ?? '';
      searchSpaces.push(line);
      const nextLine = lines[index + 1];
      if (nextLine !== undefined) {
        searchSpaces.push(line + ' ' + nextLine);
      }
    }

    const seen = new Set<string>();
    const candidates: IbanCandidate[] = [];
    for (const searchSpace of searchSpaces) {
      for (const rawCandidate of IbanRecognitionHelper.extractIbanShapedRuns(searchSpace)) {
        for (const reading of IbanRecognitionHelper.buildReadings(rawCandidate)) {
          if (seen.has(reading)) {
            continue;
          }
          seen.add(reading);
          const described = IbanRecognitionHelper.describeCandidate(reading);
          // Only a reading whose length matches its country is a candidate. A
          // reading that is one character too long can still pass mod-97 by
          // chance - the fixture card does, when the `G` of the `Gültig bis`
          // below the number is read into it.
          if (described.lengthValid) {
            candidates.push(described);
          }
        }
      }
    }

    return candidates.sort((a, b) => Number(b.checksumValid) - Number(a.checksumValid));
  }

  /**
   * Returns the IBAN to hand back to the user, or `null` while nothing was
   * recognized well enough yet. Called once per camera frame, so a `null` here
   * simply means "keep scanning".
   */
  static findIban(lines: string[], options?: FindIbanOptions): IbanCandidate | null {
    const candidates = IbanRecognitionHelper.findIbanCandidates(lines);
    const accepted = candidates.find((candidate) => candidate.checksumValid || Boolean(options?.allowInvalidChecksum));
    return accepted ?? null;
  }

  /**
   * Finds the runs of letters and digits that could be an IBAN. Separators
   * inside the number are dropped first, so `DE00 0123 4567` is one run, while
   * the cardholder name on the line before stays a separate one.
   */
  private static extractIbanShapedRuns(text: string): string[] {
    const upperCased = text.toUpperCase();
    // Keep alphanumerics, turn every separator that a card prints between the
    // blocks (space, dot, dash, thin space) into nothing, everything else into
    // a boundary.
    const glued = StringHelper.replaceAllWithOptions({
      str: upperCased,
      find: '[ .\\-   ]',
      replace: '',
    });
    const boundaryCleaned = StringHelper.replaceAllWithOptions({
      str: glued,
      find: '[^A-Z0-9]',
      replace: ' ',
    });

    const runs: string[] = [];
    for (const run of boundaryCleaned.split(' ')) {
      if (run.length < IbanRecognitionHelper.MIN_IBAN_LENGTH) {
        continue;
      }
      // The run may carry a prefix such as `IBAN` or a trailing validity date.
      // Slide a window over it and keep every window that starts like an IBAN.
      for (let start = 0; start + IbanRecognitionHelper.MIN_IBAN_LENGTH <= run.length; start++) {
        const head = run.slice(start, start + 4);
        const repairedHead = IbanRecognitionHelper.repairOcrConfusions(head);
        if (!/^[A-Z]{2}\d{2}$/.test(repairedHead)) {
          continue;
        }
        const expectedLength = IbanRecognitionHelper.IBAN_LENGTH_BY_COUNTRY[repairedHead.slice(0, 2)];
        const lengths = expectedLength === undefined ? [] : [expectedLength];
        for (const length of lengths) {
          if (start + length <= run.length) {
            runs.push(run.slice(start, start + length));
          }
        }
        // Also offer the rest of the run, for a country we do not know the
        // length of, or a number that OCR cut short.
        const rest = run.slice(start);
        if (rest.length <= IbanRecognitionHelper.MAX_IBAN_LENGTH) {
          runs.push(rest);
        }
      }
    }
    return runs;
  }
}
