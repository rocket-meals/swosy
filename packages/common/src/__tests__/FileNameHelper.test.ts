import { FileNameHelper } from '../FileNameHelper';

describe('FileNameHelper.buildSafeFileName', () => {
  it('keeps letters and digits and joins everything else with a single underscore', () => {
    expect(FileNameHelper.buildSafeFileName({ name: 'A-2023/000188', extension: 'pdf' })).toBe('A_2023_000188.pdf');
    expect(FileNameHelper.buildSafeFileName({ name: 'Protokoll   Haus 4', extension: 'pdf' })).toBe('Protokoll_Haus_4.pdf');
  });

  it('leaves no underscore at either end', () => {
    expect(FileNameHelper.buildSafeFileName({ name: ' (Übergabe) ', extension: 'pdf' })).toBe('bergabe.pdf');
  });

  it('cannot become a path', () => {
    expect(FileNameHelper.buildSafeFileName({ name: '../../etc/passwd', extension: 'pdf' })).toBe('etc_passwd.pdf');
  });

  it('uses the fallback name when nothing usable is left', () => {
    expect(FileNameHelper.buildSafeFileName({ name: '???', extension: 'pdf', fallbackName: 'form' })).toBe('form.pdf');
    expect(FileNameHelper.buildSafeFileName({ name: null, extension: 'pdf', fallbackName: 'form' })).toBe('form.pdf');
    expect(FileNameHelper.buildSafeFileName({ name: undefined, extension: 'pdf' })).toBe('file.pdf');
  });
});
