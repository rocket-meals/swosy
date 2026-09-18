import * as fs from 'fs';
import * as path from 'path';
import { IbanRecognitionHelper } from '../form/IbanRecognitionHelper';

/**
 * The same fourteen cards, read by two engines.
 *
 * `bank-cards.ocr.json` holds what Tesseract made of them, `bank-cards.paddleocr.json`
 * what PaddleOCR did. Identical images, identical helper — only the engine
 * differs, which is the only way to tell an engine problem from a reading
 * problem. Every number printed on these cards is a dummy, so all of this is
 * the reading with `allowInvalidChecksum: true`; the scanner as it ships
 * accepts none of them.
 */
const FIXTURE_DIRECTORY = path.join(__dirname, 'fixtures', 'bankcards');

interface Card {
	file: string;
	printedIban: string | null;
	recognizedLines: string[];
}

const read = (fileName: string): Card[] => (JSON.parse(fs.readFileSync(path.join(FIXTURE_DIRECTORY, fileName), 'utf-8')) as { cards: Card[] }).cards;

const tesseract = read('bank-cards.ocr.json');
const paddle = read('bank-cards.paddleocr.json');

/** How a reading turned out: the printed number, nothing, or something else. */
type Outcome = 'read' | 'nothing' | 'wrong';

const outcomeOf = (card: Card): Outcome => {
	const found = IbanRecognitionHelper.findIban(card.recognizedLines, { allowInvalidChecksum: true })?.iban ?? null;
	if (found === card.printedIban) {
		return card.printedIban === null ? 'nothing' : 'read';
	}
	return found === null ? 'nothing' : 'wrong';
};

const countOutcomes = (cards: Card[]): Record<Outcome, number> => {
	const counted: Record<Outcome, number> = { read: 0, nothing: 0, wrong: 0 };
	for (const card of cards) {
		counted[outcomeOf(card)]++;
	}
	return counted;
};

describe('the two engines on the same fourteen cards', () => {
	it('reads the same cards with both, so the comparison means something', () => {
		expect(paddle.map((card) => card.file)).toEqual(tesseract.map((card) => card.file));
		for (const [index, card] of paddle.entries()) {
			expect(card.printedIban).toBe(tesseract[index]?.printedIban);
		}
	});

	it('never hands over a number that is not on the card', () => {
		// The one thing neither engine may do. A wrong IBAN in a payment form is
		// worse than an empty one, and it is the user who would have to notice.
		expect(countOutcomes(paddle).wrong).toBe(0);
	});

	it('gets more cards out of PaddleOCR than out of Tesseract', () => {
		// Tesseract: 5 of the 11 cards that print an IBAN, 2 of them misread.
		// PaddleOCR: 9 of 11, none misread. Three cards print no IBAN and neither
		// engine invents one, which counts as `nothing` for both.
		expect(countOutcomes(tesseract)).toEqual({ read: 5, nothing: 7, wrong: 2 });
		expect(countOutcomes(paddle)).toEqual({ read: 9, nothing: 5, wrong: 0 });
	});

	it('leaves only the cards no engine could resolve', () => {
		// Test_1: PaddleOCR did not find the line with the number at all.
		// Test_4: it found it and the engine had dropped digits out of the middle
		// (`DE99 1235 467 8`), so there is nothing left to read.
		const unread = paddle.filter((card) => card.printedIban !== null && outcomeOf(card) !== 'read');
		expect(unread.map((card) => card.file)).toEqual(['Test_1_DE00012345678901234567.png', 'Test_4_DE9912354678123456780.png']);
	});

	it('withholds every one of them from a scanner that demands a valid checksum', () => {
		for (const card of paddle) {
			expect(IbanRecognitionHelper.findIban(card.recognizedLines)).toBeNull();
		}
	});
});
