# Giro card IBAN fixtures

Test material for reading an IBAN off a photographed giro card
(`IbanRecognitionHelper`, `packages/common/src/form/IbanRecognitionHelper.ts`).

| File | What it is |
| --- | --- |
| `girocard-sample.jpg` | Photo of a public Volksbank specimen card. Cardholder, IBAN and expiry date printed on it are dummies. |
| `girocard-sample.ocr.json` | The text lines an on-device OCR engine returns for that photo, plus the IBAN that has to be read out of them. |

The unit test runs against `girocard-sample.ocr.json`, not against the image:
`packages/common` is tested with `ts-jest` in Node, which has neither ML Kit nor
Apple Vision. The image stays next to it so the recognized lines can be checked
against the card by eye, and so a device test has something to point the camera
at — the app screen under
`apps/frontend/app/app/(app)/experimentell/giro-card-iban` scans exactly this card.

**The IBAN on this card has dummy check digits (`DE00 …`).** It is structurally a
German IBAN but fails the mod-97 checksum, so the scanner only accepts it with
`allowInvalidChecksum: true` — the toggle the experimental screen exposes for
exactly this reason.

## Re-recording the OCR lines

Open the experimental screen, scan the card, and copy the lines the screen
prints under the preview into `recognizedLines`. Different engines split the
card differently; that is the point of keeping a recorded sample.
