import { DefaultProfileHelper, FAMOUS_SCIENTISTS } from '../DefaultProfileHelper';

/** Liefert nacheinander die übergebenen Werte – macht die Zufallsauswahl vorhersagbar. */
function sequence(...values: number[]): () => number {
  let index = 0;
  return () => values[index++ % values.length]!;
}

describe('FAMOUS_SCIENTISTS', () => {
  it('has unique nicknames made of letters only', () => {
    const nicknames = FAMOUS_SCIENTISTS.map(entry => entry.nickname);
    expect(new Set(nicknames).size).toBe(nicknames.length);
    for (const nickname of nicknames) {
      expect(nickname).toMatch(/^[A-Za-z]+$/);
    }
  });

  it('gives every scientist a complete avatar with hair or headwear, clothes and skin', () => {
    for (const entry of FAMOUS_SCIENTISTS) {
      expect(entry.avatar.top?.length).toBe(1);
      expect(entry.avatar.clothing?.length).toBe(1);
      expect(entry.avatar.clothesColor?.length).toBe(1);
      expect(entry.avatar.skinColor?.length).toBe(1);
      expect(entry.avatar.eyes?.length).toBe(1);
      expect(entry.avatar.mouth?.length).toBe(1);
    }
  });

  it('stores colors as six-digit hex without #', () => {
    for (const entry of FAMOUS_SCIENTISTS) {
      for (const [key, values] of Object.entries(entry.avatar)) {
        if (key.endsWith('Color')) {
          for (const value of values) {
            expect(value).toMatch(/^[0-9a-f]{6}$/);
          }
        }
      }
    }
  });

  it('gives every scientist a distinct avatar', () => {
    const keys = FAMOUS_SCIENTISTS.map(entry => JSON.stringify(entry.avatar));
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe('DefaultProfileHelper', () => {
  it('builds nickname and avatar from the same scientist', () => {
    const profile = DefaultProfileHelper.buildDefaultProfile(sequence(0));
    expect(profile.nickname).toBe('Einstein');
    expect(profile.avatar).toEqual({ style: 'avataaars', size: 128, options: FAMOUS_SCIENTISTS[0]!.avatar });
  });

  it('stays in range for random values close to 1', () => {
    const profile = DefaultProfileHelper.buildDefaultProfile(() => 0.99999999);
    expect(profile.nickname).toBe(FAMOUS_SCIENTISTS[FAMOUS_SCIENTISTS.length - 1]!.nickname);
  });

  it('returns a copy of the avatar options, so editing a profile never changes the list', () => {
    const avatar = DefaultProfileHelper.buildAvatar(FAMOUS_SCIENTISTS[0]!);
    avatar.options['top'] = ['bob'];
    expect(FAMOUS_SCIENTISTS[0]!.avatar['top']).toEqual(['frizzle']);
  });

  it('recognizes generated and legacy guest nicknames as default', () => {
    expect(DefaultProfileHelper.isDefaultNickname(DefaultProfileHelper.buildDefaultProfile().nickname)).toBe(true);
    expect(DefaultProfileHelper.isDefaultNickname(' Curie ')).toBe(true);
    expect(DefaultProfileHelper.isDefaultNickname('Guest_2609232151')).toBe(true);
  });

  it('treats own nicknames as not default', () => {
    expect(DefaultProfileHelper.isDefaultNickname('Marie')).toBe(false);
    expect(DefaultProfileHelper.isDefaultNickname('Curie_12')).toBe(false);
    expect(DefaultProfileHelper.isDefaultNickname('Mensafan_1234')).toBe(false);
    expect(DefaultProfileHelper.isDefaultNickname('')).toBe(false);
    expect(DefaultProfileHelper.isDefaultNickname(null)).toBe(false);
  });

  it('recognizes default avatars as object or JSON string, independent of key order', () => {
    const avatar = DefaultProfileHelper.buildAvatar(FAMOUS_SCIENTISTS[1]!);
    expect(DefaultProfileHelper.isDefaultAvatar(avatar)).toBe(true);
    expect(DefaultProfileHelper.isDefaultAvatar(JSON.stringify(avatar))).toBe(true);
    const reversedOptions = Object.fromEntries(Object.entries(avatar.options).reverse());
    expect(DefaultProfileHelper.isDefaultAvatar({ ...avatar, options: reversedOptions })).toBe(true);
  });

  it('treats edited or missing avatars as not default', () => {
    const avatar = DefaultProfileHelper.buildAvatar(FAMOUS_SCIENTISTS[1]!);
    expect(DefaultProfileHelper.isDefaultAvatar({ ...avatar, options: { ...avatar.options, mouth: ['tongue'] } })).toBe(false);
    expect(DefaultProfileHelper.isDefaultAvatar({ ...avatar, style: 'micah' })).toBe(false);
    expect(DefaultProfileHelper.isDefaultAvatar(null)).toBe(false);
    expect(DefaultProfileHelper.isDefaultAvatar('{broken')).toBe(false);
  });

  it('finds the scientist behind a default nickname, even when the avatar was customized', () => {
    expect(DefaultProfileHelper.findScientist('Curie', { style: 'micah' })?.name).toBe('Marie Curie');
  });

  it('finds the scientist behind a default avatar, even when the nickname was changed', () => {
    const avatar = DefaultProfileHelper.buildAvatar(FAMOUS_SCIENTISTS[2]!);
    expect(DefaultProfileHelper.findScientist('Mensafan', JSON.stringify(avatar))?.name).toBe(FAMOUS_SCIENTISTS[2]!.name);
  });

  it('finds nobody once nickname and avatar are customized, or for legacy guest profiles', () => {
    expect(DefaultProfileHelper.findScientist('Mensafan', { style: 'avataaars', options: { top: ['bob'] } })).toBeNull();
    expect(DefaultProfileHelper.findScientist('Guest_2609232151', null)).toBeNull();
    expect(DefaultProfileHelper.findScientist('Curie_12', null)).toBeNull();
    expect(DefaultProfileHelper.findScientist(null, undefined)).toBeNull();
  });
});
