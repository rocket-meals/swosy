// small jest test
import {describe, expect, it} from '@jest/globals';
import {TranslationHelper, TranslationsFromParsingType} from '../TranslationHelper';
import {LanguageCodes, LanguageCodesType} from 'repo-depkit-common';
import {PrimaryKey} from '@directus/types';

// Mock Data for Testing
// Define a type for the main item
type TestType = {
  id: PrimaryKey;
  name: string;
  description?: string;
  translations: TestTranslationType[];
};

const relationField = 'test_id';

// Define a type for the translations
type TestTranslationType = {
  id: PrimaryKey;
  [relationField]: PrimaryKey;
  languages_code: LanguageCodesType;
  be_source_for_translations?: boolean | null;
  let_be_translated?: boolean | null;
  name: string;
  description?: string;
};

const mockItemWithTranslations: TestType = {
  id: 1 as PrimaryKey,
  name: 'Test Item',
  translations: [
    {
      id: 1 as PrimaryKey,
      [relationField]: 1 as PrimaryKey,
      languages_code: LanguageCodes.EN,
      be_source_for_translations: true,
      let_be_translated: true,
      name: 'Hello',
      description: 'A simple greeting',
    },
    {
      id: 2 as PrimaryKey,
      [relationField]: 1 as PrimaryKey,
      languages_code: LanguageCodes.DE,
      be_source_for_translations: false,
      let_be_translated: false,
      name: 'Hallo',
      description: 'Eine einfache Begrüßung',
    },
  ],
};

const mockTranslationsFromParsing: TranslationsFromParsingType = {
  [LanguageCodes.EN]: {
    be_source_for_translations: true,
    let_be_translated: false,
    name: 'Hello there',
    description: 'A more detailed greeting',
  },
  [LanguageCodes.DE]: {
    be_source_for_translations: false,
    let_be_translated: false,
    name: 'Hallo',
    description: 'Eine einfache Begrüßung',
  },
};

describe('TranslationHelper Test', () => {
  // should find atleast one meal offer
  it('Objects have significant change for translation', async () => {
    const objectA = {
      name: 'Pizza',
    };
    const objectB = {
      name: 'Pasta',
    };
    expect(TranslationHelper.hasSignificantTranslationChange(objectA, objectB)).toBe(true);
  });

  // should not find any significant change
  it('Objects have no significant change for translation', async () => {
    const objectA = {
      name: 'Pizza',
    };
    const objectB = {
      name: 'Pizza',
    };
    expect(TranslationHelper.hasSignificantTranslationChange(objectA, objectB)).toBe(false);
  });

  // should not find any significant change but with change at NonSignificantField
  it('Objects have no significant change for translation but with change at NonSignificantField', async () => {
    const objectSameValue = {
      name: 'Pizza',
    };
    const objectA = {
      ...objectSameValue,
      id: 'abc123',
    };
    const objectB = {
      ...objectSameValue,
      id: 'def456',
    };
    expect(TranslationHelper.hasSignificantTranslationChange(objectA, objectB)).toBe(false);
  });

  // Test case that should pass
  it('should detect updates needed when there is a significant change in translations', async () => {
    const result = await TranslationHelper._getUpdateInformationForTranslations({
      itemWithTranslations: mockItemWithTranslations,
      item: mockItemWithTranslations,
      translationsFromParsing: mockTranslationsFromParsing,
      items_primary_field_in_translation_table: relationField, // Use TestTranslationType for the relation field
    });

    expect(result.updateNeeded).toBe(true);
    expect(result.updateObject.translations.update).toHaveLength(1);
    expect(result.updateObject.translations.create).toHaveLength(0);
    expect(result.updateObject.translations.update?.[0]?.name).toBe('Hello there');
  });

  // Test case that should fail (when no changes are detected)
  it('should not detect updates when translations have not changed', async () => {
    const mockTranslationsWithoutChange: TranslationsFromParsingType = {
      [LanguageCodes.EN]: {
        be_source_for_translations: true,
        let_be_translated: true,
        name: 'Hello',
        description: 'A simple greeting',
      },
      [LanguageCodes.DE]: {
        be_source_for_translations: false,
        let_be_translated: false,
        name: 'Hallo',
        description: 'Eine einfache Begrüßung',
      },
    };

    const result = await TranslationHelper._getUpdateInformationForTranslations({
      itemWithTranslations: mockItemWithTranslations,
      item: mockItemWithTranslations,
      translationsFromParsing: mockTranslationsWithoutChange,
      items_primary_field_in_translation_table: relationField, // Use TestTranslationType for the relation field
    });

    expect(result.updateNeeded).toBe(false);
    expect(result.updateObject.translations.update).toHaveLength(0);
    expect(result.updateObject.translations.create).toHaveLength(0);
  });

  describe('getTranslationsCreateListForNewItemReusingExistingTranslations', () => {
    const parsedTranslationsGermanOnly: TranslationsFromParsingType = {
      [LanguageCodes.DE]: {
        name: 'Spaghetti Bolognese',
      },
    };

    const existingFoodTranslations = [
      {
        id: 1 as PrimaryKey,
        languages_code: LanguageCodes.DE,
        be_source_for_translations: true,
        let_be_translated: false,
        name: 'Spaghetti Bolognese',
        description: 'Mit Rinderhack',
      },
      {
        id: 2 as PrimaryKey,
        languages_code: LanguageCodes.EN,
        be_source_for_translations: false,
        let_be_translated: false,
        name: 'Spaghetti bolognese',
        description: 'With minced beef',
      },
      {
        id: 3 as PrimaryKey,
        languages_code: 'ar-SA',
        be_source_for_translations: false,
        let_be_translated: false,
        name: 'سباغيتي بولونيز',
      },
    ];

    it('reuses existing translations when the source name matches', () => {
      const createList = TranslationHelper.getTranslationsCreateListForNewItemReusingExistingTranslations(parsedTranslationsGermanOnly, [existingFoodTranslations], ['name']);

      expect(createList).toHaveLength(3);

      const englishEntry = createList.find(entry => (entry.languages_code as any)?.code === LanguageCodes.EN);
      expect(englishEntry?.name).toBe('Spaghetti bolognese');
      expect(englishEntry?.let_be_translated).toBe(false); // reused, must not be machine-translated again
      expect(englishEntry?.be_source_for_translations).toBe(false);
      // only the requested fields are copied, the target collection has no description
      expect(englishEntry).not.toHaveProperty('description');
      // no database record fields leak into the create payload
      expect(englishEntry).not.toHaveProperty('id');

      const arabicEntry = createList.find(entry => (entry.languages_code as any)?.code === 'ar-SA');
      expect(arabicEntry?.name).toBe('سباغيتي بولونيز');
      expect(arabicEntry?.let_be_translated).toBe(false);
    });

    it('does not reuse existing translations when the source name differs', () => {
      const parsedTranslationsDifferentName: TranslationsFromParsingType = {
        [LanguageCodes.DE]: {
          name: 'Currywurst',
        },
      };

      const createList = TranslationHelper.getTranslationsCreateListForNewItemReusingExistingTranslations(parsedTranslationsDifferentName, [existingFoodTranslations], ['name']);

      // only the parsed translation, remaining languages are left to the auto-translation hook
      expect(createList).toHaveLength(1);
      expect(createList[0]?.name).toBe('Currywurst');
      expect((createList[0]?.languages_code as any)?.code).toBe(LanguageCodes.DE);
    });

    it('parser translations win over existing translations for the same language', () => {
      const parsedTranslationsGermanAndEnglish: TranslationsFromParsingType = {
        [LanguageCodes.DE]: {
          name: 'Spaghetti Bolognese',
        },
        [LanguageCodes.EN]: {
          name: 'Spaghetti bolognese (fresh from report)',
        },
      };

      const createList = TranslationHelper.getTranslationsCreateListForNewItemReusingExistingTranslations(parsedTranslationsGermanAndEnglish, [existingFoodTranslations], ['name']);

      expect(createList).toHaveLength(3);
      const englishEntry = createList.find(entry => (entry.languages_code as any)?.code === LanguageCodes.EN);
      expect(englishEntry?.name).toBe('Spaghetti bolognese (fresh from report)');
    });

    it('falls back to the next candidate when the first one does not match', () => {
      // e.g. the food has a different name, but another foodoffer with the same name exists
      const existingOtherFoodofferTranslations = [
        {
          id: 10 as PrimaryKey,
          languages_code: LanguageCodes.DE,
          be_source_for_translations: true,
          let_be_translated: false,
          name: 'Spaghetti Bolognese',
        },
        {
          id: 11 as PrimaryKey,
          languages_code: LanguageCodes.EN,
          be_source_for_translations: false,
          let_be_translated: false,
          name: 'Spaghetti bolognese (from other foodoffer)',
        },
      ];
      const nonMatchingFoodTranslations = [
        {
          id: 20 as PrimaryKey,
          languages_code: LanguageCodes.DE,
          be_source_for_translations: true,
          let_be_translated: false,
          name: 'Ganz anderer Name',
        },
      ];

      const createList = TranslationHelper.getTranslationsCreateListForNewItemReusingExistingTranslations(
        parsedTranslationsGermanOnly,
        [nonMatchingFoodTranslations, existingOtherFoodofferTranslations],
        ['name']
      );

      expect(createList).toHaveLength(2);
      const englishEntry = createList.find(entry => (entry.languages_code as any)?.code === LanguageCodes.EN);
      expect(englishEntry?.name).toBe('Spaghetti bolognese (from other foodoffer)');
      expect(englishEntry?.let_be_translated).toBe(false);
    });

    it('returns only parsed translations when the related item has no translations', () => {
      const createList = TranslationHelper.getTranslationsCreateListForNewItemReusingExistingTranslations(parsedTranslationsGermanOnly, [[]], ['name']);
      expect(createList).toHaveLength(1);
      expect(createList[0]?.name).toBe('Spaghetti Bolognese');
    });
  });
});

describe('TranslationHelper.getTranslation', () => {
  const translations = [
    { id: 1, languages_code: 'DE-de', name: 'Lasagne' },
    { id: 2, languages_code: 'en-US', name: 'Lasagna' },
  ];

  it('finds the translation regardless of the casing of the stored code', () => {
    // `languages.code` is maintained by hand per customer, nothing enforces the casing.
    expect(TranslationHelper.getTranslation(translations, 'de-DE', 'name')).toBe('Lasagne');
  });

  it('finds the translation when the profile only holds the short code', () => {
    // The app works with "en"; the translation rows use the table's "en-US".
    expect(TranslationHelper.getTranslation(translations, 'en', 'name')).toBe('Lasagna');
  });

  it('prefers the exact code over another region of the same language', () => {
    const withRegions = [
      { id: 1, languages_code: 'de-AT', name: 'Lasagne (AT)' },
      { id: 2, languages_code: 'de-DE', name: 'Lasagne (DE)' },
    ];
    expect(TranslationHelper.getTranslation(withRegions, 'de-DE', 'name')).toBe('Lasagne (DE)');
  });

  it('takes another region of the same language when the exact code is missing', () => {
    const onlyAustrian = [{ id: 1, languages_code: 'de-AT', name: 'Lasagne (AT)' }];
    expect(TranslationHelper.getTranslation(onlyAustrian, 'de-DE', 'name')).toBe('Lasagne (AT)');
  });

  it('falls back to German and then English', () => {
    expect(TranslationHelper.getTranslation(translations, 'zh-CN', 'name')).toBe('Lasagne');
    expect(TranslationHelper.getTranslation([{ id: 2, languages_code: 'en-US', name: 'Lasagna' }], 'zh-CN', 'name')).toBe('Lasagna');
  });

  it('returns nothing for an empty list or an empty language', () => {
    expect(TranslationHelper.getTranslation([], 'de-DE', 'name')).toBeUndefined();
    expect(TranslationHelper.getTranslation(translations, '', 'name')).toBe('Lasagne');
  });

  it('reads the code out of an expanded languages relation', () => {
    const expanded = [{ id: 1, languages_code: { code: 'de-DE' } as any, name: 'Lasagne' }];
    expect(TranslationHelper.getTranslation(expanded, 'de', 'name')).toBe('Lasagne');
  });
});
