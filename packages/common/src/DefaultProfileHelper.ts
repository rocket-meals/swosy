/**
 * Startprofil für neue Nutzer: Jedes neue Profil (Gast, Apple, Google, …) bekommt eine bekannte
 * Wissenschaftlerin / einen bekannten Wissenschaftler als Vorlage – einen Spitznamen wie
 * `Curie_4821` und den passenden Avatar. Beides kann der Nutzer im Onboarding und in den
 * Einstellungen sofort ändern; der Default soll nur Lust aufs Personalisieren machen.
 *
 * Die Avatare sind im Stil `avataaars` angelegt, dem Standard-Stil der App (siehe
 * `useAvatarProfileEditor` → `allowedStyles`). Das Format ist dasselbe wie `AvatarConfig` aus
 * `repo-depkit-common-ui`; die Daten liegen trotzdem hier, weil auch das Backend sie beim
 * Anlegen eines Profils braucht und `repo-depkit-common-ui` nicht importieren kann.
 */

/** Optionen eines `avataaars`-Avatars. Ein fehlender Key heißt: Bestandteil ausgeblendet (z. B. kein Bart). */
export type DefaultAvatarOptions = Record<string, string[]>;

/** Gespeichertes Format von `profiles.avatar` – entspricht `AvatarConfig` aus `repo-depkit-common-ui`. */
export type DefaultAvatarConfig = {
  style: 'avataaars';
  size: number;
  options: DefaultAvatarOptions;
};

export type FamousScientist = {
  /** Voller Name, nur zur Dokumentation – wird nie im UI angezeigt. */
  name: string;
  /** Teil des Spitznamens: nur Buchstaben, eindeutig in der Liste. */
  nickname: string;
  avatar: DefaultAvatarOptions;
};

// Farben (ohne '#'), überwiegend aus der Palette von `MyColorPicker` in `repo-depkit-common-ui`.
const HAIR_BLACK = '000000';
const HAIR_DARK_BROWN = '2c1b18';
const HAIR_BROWN = '4a312c';
const HAIR_LIGHT_BROWN = '724133';
const HAIR_AUBURN = 'a55728';
const HAIR_BLONDE = 'd6b370';
const HAIR_LIGHT_BLONDE = 'e8d9b4';
const HAIR_GRAY = 'b7a69e';
const HAIR_LIGHT_GRAY = 'e8e1e1';

const SKIN_PORCELAIN = 'ffe0bd';
const SKIN_VERY_LIGHT = 'fddbb4';
const SKIN_LIGHT = 'edb98a';
const SKIN_MEDIUM_LIGHT = 'd08b5b';
const SKIN_MEDIUM = 'ae5d29';
const SKIN_MEDIUM_DARK = '694d3d';
const SKIN_DARK = '4a312c';

const CLOTHES_LIGHT_GRAY = 'e6e6e6';
const CLOTHES_SAND = 'ffdeb5';
const CLOTHES_GRAY = '929598';
const CLOTHES_DARK_GRAY = '3c4f5c';
const CLOTHES_CHARCOAL = '262e33';
const CLOTHES_NAVY = '25557c';
const CLOTHES_BLUE = '5199e4';
const CLOTHES_LIGHT_BLUE = '65c9ff';
const CLOTHES_MINT = 'a7ffc4';
const CLOTHES_RED = 'ff5c5c';
const CLOTHES_PINK = 'ff488e';
const CLOTHES_ORANGE = 'f97316';
const CLOTHES_AMBER = 'f59e0b';
const CLOTHES_EMERALD = '047857';
const CLOTHES_KHAKI = 'c2b280';
const CLOTHES_PURPLE = 'a855f7';

const ACCESSORY_CHARCOAL = '262e33';

/**
 * Gemeinsame Gesichtszüge: freundlich lächelnd. Jede Person überschreibt nur, was sie ausmacht.
 * `facialHair` und `accessories` fehlen hier absichtlich – ohne Key werden sie nicht gezeichnet.
 */
const BASE_FACE: DefaultAvatarOptions = {
  eyebrows: ['defaultNatural'],
  eyes: ['default'],
  mouth: ['smile'],
};

function scientist(name: string, nickname: string, avatar: DefaultAvatarOptions): FamousScientist {
  return { name, nickname, avatar: { ...BASE_FACE, ...avatar } };
}

/**
 * Bekannte Wissenschaftlerinnen und Wissenschaftler aus verschiedenen Epochen, Ländern und
 * Fächern. Die Avatare sind keine Porträts, sondern greifen ein, zwei typische Merkmale auf
 * (Einsteins wilde graue Haare, Darwins Bart, Hoppers Brille, …).
 *
 * Neue Einträge: `nickname` nur aus Buchstaben und nicht doppelt – der Test prüft das.
 * Bestehende Einträge nicht umbenennen: `isDefaultNickname` / `isDefaultAvatar` erkennen
 * gespeicherte Profile genau an diesen Werten.
 */
export const FAMOUS_SCIENTISTS: readonly FamousScientist[] = [
  scientist('Albert Einstein', 'Einstein', {
    top: ['frizzle'],
    hairColor: [HAIR_LIGHT_GRAY],
    eyebrows: ['raisedExcitedNatural'],
    facialHair: ['moustacheMagnum'],
    facialHairColor: [HAIR_LIGHT_GRAY],
    clothing: ['collarAndSweater'],
    clothesColor: [CLOTHES_GRAY],
    skinColor: [SKIN_VERY_LIGHT],
  }),
  scientist('Marie Curie', 'Curie', {
    top: ['bun'],
    hairColor: [HAIR_BROWN],
    clothing: ['blazerAndShirt'],
    clothesColor: [CLOTHES_CHARCOAL],
    skinColor: [SKIN_PORCELAIN],
  }),
  scientist('Ada Lovelace', 'Lovelace', {
    top: ['curvy'],
    hairColor: [HAIR_DARK_BROWN],
    clothing: ['blazerAndSweater'],
    clothesColor: [CLOTHES_PURPLE],
    skinColor: [SKIN_PORCELAIN],
  }),
  scientist('Isaac Newton', 'Newton', {
    top: ['bigHair'],
    hairColor: [HAIR_GRAY],
    clothing: ['blazerAndShirt'],
    clothesColor: [CLOTHES_DARK_GRAY],
    skinColor: [SKIN_VERY_LIGHT],
  }),
  scientist('Charles Darwin', 'Darwin', {
    top: ['sides'],
    hairColor: [HAIR_LIGHT_GRAY],
    eyebrows: ['flatNatural'],
    facialHair: ['beardMajestic'],
    facialHairColor: [HAIR_LIGHT_GRAY],
    clothing: ['blazerAndShirt'],
    clothesColor: [CLOTHES_CHARCOAL],
    skinColor: [SKIN_VERY_LIGHT],
  }),
  scientist('Rosalind Franklin', 'Franklin', {
    top: ['shortCurly'],
    hairColor: [HAIR_DARK_BROWN],
    clothing: ['collarAndSweater'],
    clothesColor: [CLOTHES_BLUE],
    skinColor: [SKIN_PORCELAIN],
  }),
  scientist('Alan Turing', 'Turing', {
    top: ['shortFlat'],
    hairColor: [HAIR_DARK_BROWN],
    clothing: ['blazerAndSweater'],
    clothesColor: [CLOTHES_DARK_GRAY],
    skinColor: [SKIN_VERY_LIGHT],
  }),
  scientist('Katherine Johnson', 'Johnson', {
    top: ['shortCurly'],
    hairColor: [HAIR_DARK_BROWN],
    accessories: ['prescription02'],
    accessoriesColor: [ACCESSORY_CHARCOAL],
    clothing: ['blazerAndShirt'],
    clothesColor: [CLOTHES_RED],
    skinColor: [SKIN_MEDIUM_DARK],
  }),
  scientist('Nikola Tesla', 'Tesla', {
    top: ['theCaesarAndSidePart'],
    hairColor: [HAIR_DARK_BROWN],
    facialHair: ['moustacheFancy'],
    facialHairColor: [HAIR_DARK_BROWN],
    clothing: ['blazerAndShirt'],
    clothesColor: [CLOTHES_CHARCOAL],
    skinColor: [SKIN_VERY_LIGHT],
  }),
  scientist('Galileo Galilei', 'Galilei', {
    top: ['sides'],
    hairColor: [HAIR_AUBURN],
    facialHair: ['beardMajestic'],
    facialHairColor: [HAIR_AUBURN],
    clothing: ['blazerAndSweater'],
    clothesColor: [CLOTHES_CHARCOAL],
    skinColor: [SKIN_LIGHT],
  }),
  scientist('Lise Meitner', 'Meitner', {
    top: ['bun'],
    hairColor: [HAIR_LIGHT_BROWN],
    clothing: ['collarAndSweater'],
    clothesColor: [CLOTHES_GRAY],
    skinColor: [SKIN_PORCELAIN],
  }),
  scientist('Emmy Noether', 'Noether', {
    top: ['bun'],
    hairColor: [HAIR_BROWN],
    accessories: ['round'],
    accessoriesColor: [ACCESSORY_CHARCOAL],
    clothing: ['blazerAndShirt'],
    clothesColor: [CLOTHES_DARK_GRAY],
    skinColor: [SKIN_VERY_LIGHT],
  }),
  scientist('Grace Hopper', 'Hopper', {
    top: ['shortWaved'],
    hairColor: [HAIR_LIGHT_GRAY],
    accessories: ['prescription01'],
    accessoriesColor: [ACCESSORY_CHARCOAL],
    clothing: ['blazerAndShirt'],
    clothesColor: [CLOTHES_NAVY],
    skinColor: [SKIN_PORCELAIN],
  }),
  scientist('Stephen Hawking', 'Hawking', {
    top: ['shortFlat'],
    hairColor: [HAIR_LIGHT_BROWN],
    accessories: ['prescription02'],
    accessoriesColor: [ACCESSORY_CHARCOAL],
    clothing: ['collarAndSweater'],
    clothesColor: [CLOTHES_BLUE],
    skinColor: [SKIN_VERY_LIGHT],
  }),
  scientist('Richard Feynman', 'Feynman', {
    top: ['shortWaved'],
    hairColor: [HAIR_BROWN],
    mouth: ['twinkle'],
    clothing: ['shirtCrewNeck'],
    clothesColor: [CLOTHES_LIGHT_GRAY],
    skinColor: [SKIN_LIGHT],
  }),
  scientist('Max Planck', 'Planck', {
    top: ['sides'],
    hairColor: [HAIR_DARK_BROWN],
    facialHair: ['moustacheFancy'],
    facialHairColor: [HAIR_DARK_BROWN],
    accessories: ['round'],
    accessoriesColor: [ACCESSORY_CHARCOAL],
    clothing: ['blazerAndShirt'],
    clothesColor: [CLOTHES_CHARCOAL],
    skinColor: [SKIN_VERY_LIGHT],
  }),
  scientist('Alexander von Humboldt', 'Humboldt', {
    top: ['shortCurly'],
    hairColor: [HAIR_LIGHT_BROWN],
    eyes: ['happy'],
    clothing: ['blazerAndShirt'],
    clothesColor: [CLOTHES_EMERALD],
    skinColor: [SKIN_VERY_LIGHT],
  }),
  scientist('Carl Friedrich Gauss', 'Gauss', {
    top: ['hat'],
    hatColor: [CLOTHES_CHARCOAL],
    eyebrows: ['flatNatural'],
    clothing: ['blazerAndShirt'],
    clothesColor: [CLOTHES_CHARCOAL],
    skinColor: [SKIN_VERY_LIGHT],
  }),
  scientist('Gregor Mendel', 'Mendel', {
    top: ['shortRound'],
    hairColor: [HAIR_GRAY],
    accessories: ['round'],
    accessoriesColor: [ACCESSORY_CHARCOAL],
    clothing: ['collarAndSweater'],
    clothesColor: [CLOTHES_CHARCOAL],
    skinColor: [SKIN_VERY_LIGHT],
  }),
  scientist('Jane Goodall', 'Goodall', {
    top: ['straightAndStrand'],
    hairColor: [HAIR_LIGHT_BLONDE],
    clothing: ['shirtCrewNeck'],
    clothesColor: [CLOTHES_KHAKI],
    skinColor: [SKIN_PORCELAIN],
  }),
  scientist('Mae Jemison', 'Jemison', {
    top: ['shortCurly'],
    hairColor: [HAIR_BLACK],
    eyes: ['happy'],
    clothing: ['overall'],
    clothesColor: [CLOTHES_ORANGE],
    skinColor: [SKIN_MEDIUM_DARK],
  }),
  scientist('Chien-Shiung Wu', 'Wu', {
    top: ['bob'],
    hairColor: [HAIR_BLACK],
    clothing: ['blazerAndShirt'],
    clothesColor: [CLOTHES_NAVY],
    skinColor: [SKIN_VERY_LIGHT],
  }),
  scientist('Srinivasa Ramanujan', 'Ramanujan', {
    top: ['shortFlat'],
    hairColor: [HAIR_BLACK],
    clothing: ['collarAndSweater'],
    clothesColor: [CLOTHES_LIGHT_GRAY],
    skinColor: [SKIN_MEDIUM],
  }),
  scientist('Tu Youyou', 'Youyou', {
    top: ['bob'],
    hairColor: [HAIR_DARK_BROWN],
    accessories: ['prescription02'],
    accessoriesColor: [ACCESSORY_CHARCOAL],
    clothing: ['blazerAndSweater'],
    clothesColor: [CLOTHES_GRAY],
    skinColor: [SKIN_LIGHT],
  }),
  scientist('Ibn al-Haytham', 'Haytham', {
    top: ['turban'],
    hatColor: [CLOTHES_SAND],
    facialHair: ['beardMajestic'],
    facialHairColor: [HAIR_DARK_BROWN],
    clothing: ['shirtVNeck'],
    clothesColor: [CLOTHES_EMERALD],
    skinColor: [SKIN_MEDIUM_LIGHT],
  }),
  scientist('Hypatia', 'Hypatia', {
    top: ['longButNotTooLong'],
    hairColor: [HAIR_BROWN],
    clothing: ['shirtScoopNeck'],
    clothesColor: [CLOTHES_AMBER],
    skinColor: [SKIN_LIGHT],
  }),
  scientist('Rachel Carson', 'Carson', {
    top: ['shortWaved'],
    hairColor: [HAIR_LIGHT_BROWN],
    clothing: ['collarAndSweater'],
    clothesColor: [CLOTHES_MINT],
    skinColor: [SKIN_PORCELAIN],
  }),
  scientist('Dorothy Hodgkin', 'Hodgkin', {
    top: ['shortWaved'],
    hairColor: [HAIR_GRAY],
    clothing: ['blazerAndSweater'],
    clothesColor: [CLOTHES_BLUE],
    skinColor: [SKIN_PORCELAIN],
  }),
  scientist('Barbara McClintock', 'McClintock', {
    top: ['shortFlat'],
    hairColor: [HAIR_LIGHT_BROWN],
    clothing: ['shirtCrewNeck'],
    clothesColor: [CLOTHES_DARK_GRAY],
    skinColor: [SKIN_VERY_LIGHT],
  }),
  scientist('George Washington Carver', 'Carver', {
    top: ['shortFlat'],
    hairColor: [HAIR_BLACK],
    facialHair: ['moustacheFancy'],
    facialHairColor: [HAIR_BLACK],
    clothing: ['blazerAndShirt'],
    clothesColor: [CLOTHES_DARK_GRAY],
    skinColor: [SKIN_DARK],
  }),
  scientist('Niels Bohr', 'Bohr', {
    top: ['theCaesarAndSidePart'],
    hairColor: [HAIR_LIGHT_BROWN],
    clothing: ['blazerAndShirt'],
    clothesColor: [CLOTHES_CHARCOAL],
    skinColor: [SKIN_VERY_LIGHT],
  }),
  scientist('Hedy Lamarr', 'Lamarr', {
    top: ['miaWallace'],
    hairColor: [HAIR_DARK_BROWN],
    clothing: ['shirtScoopNeck'],
    clothesColor: [CLOTHES_PINK],
    skinColor: [SKIN_PORCELAIN],
  }),
  scientist('Johannes Kepler', 'Kepler', {
    top: ['shortWaved'],
    hairColor: [HAIR_DARK_BROWN],
    facialHair: ['beardMedium'],
    facialHairColor: [HAIR_DARK_BROWN],
    clothing: ['blazerAndShirt'],
    clothesColor: [CLOTHES_CHARCOAL],
    skinColor: [SKIN_VERY_LIGHT],
  }),
  scientist('Wangari Maathai', 'Maathai', {
    top: ['froBand'],
    hairColor: [HAIR_BLACK],
    hatColor: [CLOTHES_AMBER],
    eyes: ['happy'],
    clothing: ['shirtScoopNeck'],
    clothesColor: [CLOTHES_AMBER],
    skinColor: [SKIN_DARK],
  }),
  scientist('Katalin Kariko', 'Kariko', {
    top: ['shortWaved'],
    hairColor: [HAIR_BLONDE],
    accessories: ['prescription01'],
    accessoriesColor: [ACCESSORY_CHARCOAL],
    clothing: ['blazerAndShirt'],
    clothesColor: [CLOTHES_BLUE],
    skinColor: [SKIN_PORCELAIN],
  }),
  scientist('Dmitri Mendeleev', 'Mendeleev', {
    top: ['shaggy'],
    hairColor: [HAIR_LIGHT_GRAY],
    facialHair: ['beardMajestic'],
    facialHairColor: [HAIR_LIGHT_GRAY],
    clothing: ['blazerAndShirt'],
    clothesColor: [CLOTHES_CHARCOAL],
    skinColor: [SKIN_VERY_LIGHT],
  }),
  scientist('Maryam Mirzakhani', 'Mirzakhani', {
    top: ['shortRound'],
    hairColor: [HAIR_LIGHT_BROWN],
    clothing: ['shirtCrewNeck'],
    clothesColor: [CLOTHES_LIGHT_BLUE],
    skinColor: [SKIN_LIGHT],
  }),
];

export type DefaultProfile = {
  nickname: string;
  avatar: DefaultAvatarConfig;
};

/** Zufallszahl in [0, 1) – austauschbar für Tests. Kein Sicherheitsbezug, daher reicht `Math.random`. */
export type RandomSource = () => number;

export class DefaultProfileHelper {
  /** Größe, in der `MyAvatarEditor` neue Avatare anlegt (`AvatarSize.LARGE`). */
  static readonly AVATAR_SIZE = 128;

  static readonly AVATAR_STYLE = 'avataaars' as const;

  /** Ziffern hinter dem Namen, damit nicht alle „Curie" gleich heißen: `Curie_4821`. */
  private static readonly NICKNAME_SUFFIX_DIGITS = 4;

  /** Präfix der früheren Gast-Spitznamen (`GuestAccountHelper.buildDefaultNickname`). */
  private static readonly LEGACY_GUEST_NICKNAME_PREFIX = 'Guest_';

  private static readonly NICKNAME_PATTERN = /^([A-Za-z]+)_(\d+)$/;

  static pickScientist(random: RandomSource = Math.random): FamousScientist {
    const index = Math.min(FAMOUS_SCIENTISTS.length - 1, Math.floor(random() * FAMOUS_SCIENTISTS.length));
    return FAMOUS_SCIENTISTS[index]!;
  }

  static buildNickname(scientist: FamousScientist, random: RandomSource = Math.random): string {
    const max = 10 ** DefaultProfileHelper.NICKNAME_SUFFIX_DIGITS;
    const number = Math.min(max - 1, Math.floor(random() * max));
    return scientist.nickname + '_' + String(number).padStart(DefaultProfileHelper.NICKNAME_SUFFIX_DIGITS, '0');
  }

  static buildAvatar(scientist: FamousScientist): DefaultAvatarConfig {
    return {
      style: DefaultProfileHelper.AVATAR_STYLE,
      size: DefaultProfileHelper.AVATAR_SIZE,
      options: { ...scientist.avatar },
    };
  }

  /** Spitzname und Avatar derselben Person, z. B. `Einstein_0815` mit Einsteins Avatar. */
  static buildDefaultProfile(random: RandomSource = Math.random): DefaultProfile {
    const scientist = DefaultProfileHelper.pickScientist(random);
    return {
      nickname: DefaultProfileHelper.buildNickname(scientist, random),
      avatar: DefaultProfileHelper.buildAvatar(scientist),
    };
  }

  /**
   * Ob der Spitzname noch der automatisch vergebene ist – `Curie_4821` oder das frühere `Guest_…`.
   * Leere Spitznamen zählen nicht als Default, sondern als „kein Spitzname".
   */
  static isDefaultNickname(nickname: string | null | undefined): boolean {
    const trimmed = nickname?.trim();
    if (!trimmed) {
      return false;
    }
    if (trimmed.toLowerCase().startsWith(DefaultProfileHelper.LEGACY_GUEST_NICKNAME_PREFIX.toLowerCase())) {
      return true;
    }
    const match = DefaultProfileHelper.NICKNAME_PATTERN.exec(trimmed);
    const name = match?.[1];
    const digits = match?.[2];
    if (!name || digits?.length !== DefaultProfileHelper.NICKNAME_SUFFIX_DIGITS) {
      return false;
    }
    return FAMOUS_SCIENTISTS.some(entry => entry.nickname === name);
  }

  /**
   * Ob der Avatar noch einer der vergebenen Startavatare ist. `profiles.avatar` kommt je nach
   * Client als Objekt oder als JSON-String an; beides wird akzeptiert.
   */
  static isDefaultAvatar(avatar: unknown): boolean {
    let parsed: unknown = avatar;
    if (typeof avatar === 'string') {
      try {
        parsed = JSON.parse(avatar);
      } catch {
        return false;
      }
    }
    if (!parsed || typeof parsed !== 'object') {
      return false;
    }
    const config = parsed as Partial<DefaultAvatarConfig>;
    if (config.style !== DefaultProfileHelper.AVATAR_STYLE || !config.options || typeof config.options !== 'object') {
      return false;
    }
    const key = DefaultProfileHelper.optionsKey(config.options);
    return FAMOUS_SCIENTISTS.some(entry => DefaultProfileHelper.optionsKey(entry.avatar) === key);
  }

  /** Reihenfolge-unabhängiger Vergleichsschlüssel für Avatar-Optionen. */
  private static optionsKey(options: Record<string, unknown>): string {
    const sortedKeys = Object.keys(options).sort((a, b) => a.localeCompare(b));
    return JSON.stringify(sortedKeys.map(key => [key, options[key]]));
  }
}
