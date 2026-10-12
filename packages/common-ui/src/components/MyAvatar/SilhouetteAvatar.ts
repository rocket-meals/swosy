/**
 * SilhouetteAvatar.ts – the default avatar for someone without an avatar of their own.
 *
 * Drawn like every other avatar (`createAvatarSvg`, DiceBear avataaars), only skin, hair and clothes
 * share one color, so it reads as a silhouette. Only type imports here: the config stays testable
 * without loading DiceBear, which is ESM only.
 */
import type { AvatarConfig, AvatarSize, AvatarStyle } from './AvatarSvg';

/** Color of the silhouette when none (or an invalid one) is given: plain black. */
export const SILHOUETTE_AVATAR_DEFAULT_COLOR = '000000';

const HEX_COLOR = /^([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** A hex color with or without `#` (3 or 6 digits), lower case and without `#`. Anything else gives the default black. */
export function getSilhouetteAvatarColor(color?: string | null): string {
  const trimmed = (color ?? '').trim();
  const hex = trimmed.startsWith('#') ? trimmed.slice(1) : trimmed;
  return HEX_COLOR.test(hex) ? hex.toLowerCase() : SILHOUETTE_AVATAR_DEFAULT_COLOR;
}

export function getSilhouetteAvatarConfig(color?: string | null): AvatarConfig {
  const fill = getSilhouetteAvatarColor(color);
  return {
    style: 'avataaars' as AvatarStyle,
    size: 128 as AvatarSize,
    options: {
      top: ['shortFlat'],
      eyes: ['closed'],
      mouth: ['serious'],
      eyebrows: ['defaultNatural'],
      nose: ['default'],
      clothing: ['shirtCrewNeck'],
      skinColor: [fill],
      hairColor: [fill],
      clothesColor: [fill],
    },
  };
}
