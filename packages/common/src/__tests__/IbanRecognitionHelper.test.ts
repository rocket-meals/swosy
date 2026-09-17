import * as fs from 'fs';
import * as path from 'path';
import { IbanRecognitionHelper } from '../form/IbanRecognitionHelper';

/**
 * The recorded OCR output for `fixtures/girocard/girocard-sample.jpg` — see the
 * README next to it. The image itself is not run through an OCR engine here:
 * this suite is ts-jest in Node, where neither ML Kit nor Apple Vision exists.
 */
const FIXTURE_DIRECTORY = path.join(__dirname, 'fixtures', 'girocard');

interface GiroCardFixture {
	image: string;
	recognizedLines: string[];
	expected: {
		iban: string;
		formatted: string;
		countryCode: string;
		lengthValid: boolean;
		checksumValid: boolean;
	};
}

const giroCardFixture: GiroCardFixture = JSON.parse(fs.readFileSync(path.join(FIXTURE_DIRECTORY, 'girocard-sample.ocr.json'), 'utf-8'));

/** A real, checksum-valid German IBAN used across the SEPA documentation. */
const VALID_DE_IBAN = 'DE89370400440532013000';
const VALID_AT_IBAN = 'AT611904300234573201';
const VALID_GB_IBAN = 'GB29NWBK60161331926819';

describe('IbanRecognitionHelper', () => {
	describe('normalizeIban', () => {
		it('drops separators and uppercases', () => {
			expect(IbanRecognitionHelper.normalizeIban('de89 3704 0044 0532 0130 00')).toBe(VALID_DE_IBAN);
			expect(IbanRecognitionHelper.normalizeIban('DE89-3704.0044/0532 0130 00')).toBe(VALID_DE_IBAN);
		});
	});

	describe('isValidIbanChecksum', () => {
		it('accepts real IBANs', () => {
			expect(IbanRecognitionHelper.isValidIbanChecksum(VALID_DE_IBAN)).toBe(true);
			expect(IbanRecognitionHelper.isValidIbanChecksum(VALID_AT_IBAN)).toBe(true);
			expect(IbanRecognitionHelper.isValidIbanChecksum(VALID_GB_IBAN)).toBe(true);
		});

		it('rejects a single wrong digit', () => {
			expect(IbanRecognitionHelper.isValidIbanChecksum('DE89370400440532013001')).toBe(false);
		});

		it('rejects the dummy check digits printed on specimen cards', () => {
			expect(IbanRecognitionHelper.isValidIbanChecksum('DE00012345678901234567')).toBe(false);
		});

		it('rejects anything shorter than the shortest IBAN', () => {
			expect(IbanRecognitionHelper.isValidIbanChecksum('DE89')).toBe(false);
		});
	});

	describe('hasValidIbanLength', () => {
		it('measures against the registry entry of the country', () => {
			expect(IbanRecognitionHelper.hasValidIbanLength(VALID_DE_IBAN)).toBe(true);
			expect(IbanRecognitionHelper.hasValidIbanLength('DE8937040044053201300')).toBe(false);
			expect(IbanRecognitionHelper.hasValidIbanLength(VALID_AT_IBAN)).toBe(true);
		});

		it('rejects an unknown country code', () => {
			expect(IbanRecognitionHelper.hasValidIbanLength('ZZ89370400440532013000')).toBe(false);
		});
	});

	describe('repairOcrConfusions', () => {
		it('turns letters read for the check digits back into digits', () => {
			expect(IbanRecognitionHelper.repairOcrConfusions('DEB9370400440532013000')).toBe(VALID_DE_IBAN);
			expect(IbanRecognitionHelper.repairOcrConfusions('DES9370400440532013000')).toBe('DE59370400440532013000');
		});

		it('turns digits read for the country code back into letters', () => {
			expect(IbanRecognitionHelper.repairOcrConfusions('0E89370400440532013000')).toBe('OE89370400440532013000');
		});

		it('leaves the account part untouched', () => {
			expect(IbanRecognitionHelper.repairOcrConfusions(VALID_GB_IBAN)).toBe(VALID_GB_IBAN);
		});
	});

	describe('findIban', () => {
		it('reads an IBAN printed as one line', () => {
			const found = IbanRecognitionHelper.findIban(['DE89 3704 0044 0532 0130 00']);
			expect(found?.iban).toBe(VALID_DE_IBAN);
			expect(found?.formatted).toBe('DE89 3704 0044 0532 0130 00');
			expect(found?.countryCode).toBe('DE');
			expect(found?.checksumValid).toBe(true);
			expect(found?.lengthValid).toBe(true);
		});

		it('ignores the label the card prints in front of the number', () => {
			expect(IbanRecognitionHelper.findIban(['IBAN: DE89 3704 0044 0532 0130 00'])?.iban).toBe(VALID_DE_IBAN);
			expect(IbanRecognitionHelper.findIban(['IBAN', 'DE89 3704 0044 0532 0130 00'])?.iban).toBe(VALID_DE_IBAN);
		});

		it('joins a number the engine tore into two lines', () => {
			expect(IbanRecognitionHelper.findIban(['DE89 3704 0044', '0532 0130 00'])?.iban).toBe(VALID_DE_IBAN);
		});

		it('repairs the zeros an engine read as the letter O', () => {
			expect(IbanRecognitionHelper.findIban(['DE89 37O4 OO44 O532 O13O OO'])?.iban).toBe(VALID_DE_IBAN);
		});

		it('picks the IBAN out of the other text on the card', () => {
			const lines = ['Volksbanken Oberberg eG', 'Toni Raiffeisen', 'girocard', 'IBAN: DE89 3704 0044 0532 0130 00', 'Gültig bis 12/29'];
			expect(IbanRecognitionHelper.findIban(lines)?.iban).toBe(VALID_DE_IBAN);
		});

		it('returns null while nothing IBAN-shaped was recognized', () => {
			expect(IbanRecognitionHelper.findIban([])).toBeNull();
			expect(IbanRecognitionHelper.findIban(['Volksbanken Oberberg eG', 'Toni Raiffeisen'])).toBeNull();
			expect(IbanRecognitionHelper.findIban(['0000 0000 0000 0000 0000 00'])).toBeNull();
		});

		it('rejects a number whose checksum does not add up', () => {
			expect(IbanRecognitionHelper.findIban(['DE89 3704 0044 0532 0130 01'])).toBeNull();
		});

		it('accepts such a number only when the caller opts in', () => {
			const found = IbanRecognitionHelper.findIban(['DE89 3704 0044 0532 0130 01'], { allowInvalidChecksum: true });
			expect(found?.iban).toBe('DE89370400440532013001');
			expect(found?.checksumValid).toBe(false);
			expect(found?.lengthValid).toBe(true);
		});

		it('prefers the checksum-valid candidate when the card shows several numbers', () => {
			const lines = ['Kartennummer 6789 0123 4567 8901 2345 67', 'DE89 3704 0044 0532 0130 00'];
			expect(IbanRecognitionHelper.findIban(lines, { allowInvalidChecksum: true })?.iban).toBe(VALID_DE_IBAN);
		});
	});

	describe('the recorded giro card photo', () => {
		it('keeps the image the recognized lines belong to', () => {
			expect(fs.existsSync(path.join(FIXTURE_DIRECTORY, giroCardFixture.image))).toBe(true);
		});

		it('reads the printed IBAN out of the recognized lines', () => {
			const candidates = IbanRecognitionHelper.findIbanCandidates(giroCardFixture.recognizedLines);
			const printed = candidates.find((candidate) => candidate.iban === giroCardFixture.expected.iban);
			expect(printed).toBeDefined();
			expect(printed?.formatted).toBe(giroCardFixture.expected.formatted);
			expect(printed?.countryCode).toBe(giroCardFixture.expected.countryCode);
			expect(printed?.lengthValid).toBe(giroCardFixture.expected.lengthValid);
			expect(printed?.checksumValid).toBe(giroCardFixture.expected.checksumValid);
		});

		it('withholds the specimen IBAN from a scanner that demands a valid checksum', () => {
			expect(IbanRecognitionHelper.findIban(giroCardFixture.recognizedLines)).toBeNull();
		});

		it('hands it over once the caller allows a dummy checksum', () => {
			const found = IbanRecognitionHelper.findIban(giroCardFixture.recognizedLines, { allowInvalidChecksum: true });
			expect(found?.iban).toBe(giroCardFixture.expected.iban);
			expect(found?.formatted).toBe(giroCardFixture.expected.formatted);
		});
	});
});
