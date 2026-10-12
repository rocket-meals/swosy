import { getSilhouetteAvatarColor, getSilhouetteAvatarConfig, SILHOUETTE_AVATAR_DEFAULT_COLOR } from '../components/MyAvatar/SilhouetteAvatar';

describe('SilhouetteAvatar', () => {
  it('paints skin, hair and clothes of an avataaars figure in one color', () => {
    const config = getSilhouetteAvatarConfig('#6644FF');
    expect(config.style).toBe('avataaars');
    expect(config.options?.skinColor).toEqual(['6644ff']);
    expect(config.options?.hairColor).toEqual(['6644ff']);
    expect(config.options?.clothesColor).toEqual(['6644ff']);
  });

  it('accepts short hex colors and falls back to black for anything else', () => {
    expect(getSilhouetteAvatarColor('abc')).toBe('abc');
    for (const color of [undefined, null, '', 'red', '#12345', '"><script>', '1234567']) {
      expect(getSilhouetteAvatarColor(color)).toBe(SILHOUETTE_AVATAR_DEFAULT_COLOR);
    }
  });
});
