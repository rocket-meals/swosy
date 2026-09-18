import * as fs from 'fs';
import { IbanRecognitionHelper } from '../form/IbanRecognitionHelper';
const base = '/tmp/claude-0/-home-user-rocket-meals/607b2fa0-ffe1-5429-be20-55ed774adf44/scratchpad/paddle/';
const printed: Record<number, string | null> = { 1: 'DE00012345678901234567', 2: 'DE09123456780000000000', 3: 'DE12345678901234567890', 4: 'DE99123546781234567890', 5: 'DE99123546781234567890', 6: 'DE00012345678901234567', 7: 'DE00012345678901234567', 8: 'DE00012345678901234567', 9: 'DE99123546781234567890', 10: null, 11: null, 12: null, 13: 'DE00012345678901234567', 14: 'DE12345678901234567890' };
it('cmp', () => {
  for (const name of ['paddle-readings.json', 'paddle-readings-canvas.json']) {
    const data = JSON.parse(fs.readFileSync(base + name, 'utf-8'));
    let hit = 0, none = 0, wrong = 0;
    const misses: string[] = [];
    for (const e of data) {
      const want = printed[Number(e.file.split('_')[1])];
      const got = IbanRecognitionHelper.findIban(e.lines, { allowInvalidChecksum: true })?.iban ?? null;
      if (got === want) hit++; else if (got === null) { none++; misses.push(e.file.split('_')[1] + ':-'); } else { wrong++; misses.push(e.file.split('_')[1] + ':' + got); }
    }
    // eslint-disable-next-line no-console
    console.log(`CMP ${name.padEnd(30)} richtig ${hit} nichts ${none} falsch ${wrong}  ${misses.join(' ')}`);
  }
});
