# Giro card IBAN fixtures

Test material for reading an IBAN off a photographed giro card
(`IbanRecognitionHelper`, `packages/common/src/form/IbanRecognitionHelper.ts`).

| File | What it is |
| --- | --- |
| `girocard-sample.jpg` | Photo of a public Volksbank specimen card. Cardholder, IBAN and expiry date printed on it are dummies. |
| `girocard-sample.ocr.json` | What Tesseract returns for that photo, recorded from two real runs — once against the image file, once through the app's scanner on a camera frame — plus the IBAN that has to be read out of both. |

The unit test runs against `girocard-sample.ocr.json`, not against the image:
`packages/common` is tested with `ts-jest` in Node, while the OCR engine runs in
a browser or a WebView. The image stays next to it so the recorded lines can be
checked against the card by eye, and so a device test has something to point the
camera at — the app screen under
`apps/frontend/app/app/(app)/experimentell/giro-card-iban` scans exactly this card.

Two things about this sample are deliberate:

- **The IBAN has dummy check digits (`DE00 …`).** It is structurally a German
  IBAN but fails the mod-97 checksum, so the scanner only accepts it with
  `allowInvalidChecksum: true` — the toggle the experimental screen exposes for
  exactly this reason.
- **Tesseract does not read those two zeros as zeros.** One run came back with
  `DEDD 0123 …`, the other with `DEOD 0123 …`. The recorded lines keep the
  misreadings rather than tidying them up: they are the very confusions
  `repairOcrConfusions` exists to undo, and a fixture that hides them would
  test nothing.

## Re-recording the lines

Open the experimental screen, scan the card, and copy the lines the screen
prints under the preview into `recognizedLines`. A different engine version,
a different camera or a different angle splits the card differently; that is
the point of keeping a recorded sample.
