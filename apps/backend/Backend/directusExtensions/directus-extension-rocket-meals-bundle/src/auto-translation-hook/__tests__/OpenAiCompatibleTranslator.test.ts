import { describe, expect, it, jest } from '@jest/globals';
import { OpenAiCompatibleTranslator } from '../OpenAiCompatibleTranslator';
import { AutoTranslator, AutoTranslatorProvider } from '../AutoTranslator';
import { CollectionAutoTranslator } from '../CollectionAutoTranslator';
import { DirectusOpenAiCompatibleClient } from '../../helpers/ai/DirectusOpenAiCompatibleClient';

// No network calls to DeepL in the tests.
jest.mock('deepl-node', () => ({
  __esModule: true,
  default: {
    Translator: class {
      getUsage = async () => ({ character: { count: 1, limit: 2 } });
      getSourceLanguages = async () => [];
      getTargetLanguages = async () => [];
    },
  },
}));

/** A fake provider: `answer` gets the parsed user message and returns the content of the answer. */
function createClient(answer: (userMessage: any) => string, calls: any[] = [], models: string[] = ['model-a']) {
  const fakeOpenAi = {
    chat: {
      completions: {
        create: async (body: any) => {
          calls.push(body);
          return { choices: [{ message: { content: answer(JSON.parse(body.messages[1].content)) } }] };
        },
      },
    },
  } as any;
  return new DirectusOpenAiCompatibleClient({ name: 'Claude', baseUrl: 'https://x', apiKey: 'k', headers: {}, models }, fakeOpenAi);
}

/** Answers every asked language with `<language>: <text>`. */
function translateAll(userMessage: any): string {
  const translations = Object.fromEntries(userMessage.target_languages.map((language: string) => [language, language + ': ' + userMessage.text]));
  return JSON.stringify({ translations });
}

const AI_SETTINGS_ROW = {
  ai_openai_compatible_name: 'Claude',
  ai_openai_compatible_base_url: 'https://x',
  ai_openai_compatible_api_key: 'k',
  ai_openai_compatible_models: ['model-a'],
};

function createAutoTranslator(options: { aiSettingsRow: object | null; deeplKey: string | null }) {
  const savedSettings: any[] = [];
  const autoTranslatorSettings = { getAuthKey: () => options.deeplKey, setSettings: async (value: any) => savedSettings.push(value) } as any;
  const apiContext = {
    getSchema: async () => ({}),
    services: {
      SettingsService: class {
        readSingleton = async () => options.aiSettingsRow;
      },
    },
  };
  const autoTranslator = new AutoTranslator(autoTranslatorSettings, { apiContext } as any);
  return { autoTranslator, savedSettings };
}

describe('OpenAiCompatibleTranslator', () => {
  it('translates into all languages with one request', async () => {
    const calls: any[] = [];
    const translator = new OpenAiCompatibleTranslator(createClient(translateAll, calls));
    await translator.init();

    const result = await translator.translateToLanguages({ text: 'Nudeln (a, g)', source_language: 'de-DE', destination_languages: ['en-US', 'fr-FR', 'tr-TR'] });

    expect(result).toEqual({ 'en-US': 'en-US: Nudeln (a, g)', 'fr-FR': 'fr-FR: Nudeln (a, g)', 'tr-TR': 'tr-TR: Nudeln (a, g)' });
    expect(calls).toHaveLength(1);
    expect(calls[0].model).toBe('model-a');
    expect(JSON.parse(calls[0].messages[1].content)).toEqual({ source_language: 'de-DE', target_languages: ['en-US', 'fr-FR', 'tr-TR'], text: 'Nudeln (a, g)' });
  });

  it('splits a large text into groups of languages', async () => {
    const calls: any[] = [];
    const translator = new OpenAiCompatibleTranslator(createClient(translateAll, calls));
    const text = 'x'.repeat(3_000); // 8000 / 3000 → two languages per request

    const result = await translator.translateToLanguages({ text, destination_languages: ['en', 'fr', 'tr', 'ar', 'zh'] });

    expect(Object.keys(result)).toEqual(['en', 'fr', 'tr', 'ar', 'zh']);
    expect(calls.map(call => JSON.parse(call.messages[1].content).target_languages)).toEqual([['en', 'fr'], ['tr', 'ar'], ['zh']]);
  });

  it('groups languages by the length of the text', () => {
    expect(OpenAiCompatibleTranslator.splitIntoBatches(10, ['a', 'b', 'c'])).toEqual([['a', 'b', 'c']]);
    expect(OpenAiCompatibleTranslator.splitIntoBatches(5_000, ['a', 'b', 'c'])).toEqual([['a'], ['b'], ['c']]);
    expect(OpenAiCompatibleTranslator.splitIntoBatches(20_000, ['a'])).toEqual([['a']]);
    expect(OpenAiCompatibleTranslator.splitIntoBatches(10, [])).toEqual([]);
  });

  it('asks again alone for a language missing in the batch answer', async () => {
    const calls: any[] = [];
    const answer = (userMessage: any) => (userMessage.target_languages.length > 1 ? JSON.stringify({ translations: { en: 'Pasta' } }) : translateAll(userMessage));
    const translator = new OpenAiCompatibleTranslator(createClient(answer, calls));

    const result = await translator.translateToLanguages({ text: 'Nudeln', destination_languages: ['en', 'fr'] });

    expect(result).toEqual({ en: 'Pasta', fr: 'fr: Nudeln' });
    expect(calls).toHaveLength(2);
  });

  it('leaves out a language that also fails alone', async () => {
    const translator = new OpenAiCompatibleTranslator(createClient(() => 'keine Ahnung'));
    await expect(translator.translateToLanguages({ text: 'Hallo', destination_languages: ['en'] })).resolves.toEqual({});
  });

  it('uses the model override and does not call the AI for empty text', async () => {
    const calls: any[] = [];
    const translator = new OpenAiCompatibleTranslator(createClient(translateAll, calls), 'cheap-model');
    await expect(translator.translateToLanguages({ text: ' ', destination_languages: ['en'] })).resolves.toEqual({ en: ' ' });
    expect(calls).toHaveLength(0);
    await translator.translateToLanguages({ text: 'y', destination_languages: ['en'] });
    expect(calls[0].model).toBe('cheap-model');
  });

  it('fails to init without a model', async () => {
    const translator = new OpenAiCompatibleTranslator(createClient(translateAll, [], []));
    await expect(translator.init()).rejects.toThrow('No model');
  });
});

describe('AutoTranslator', () => {
  it('reads the provider from AUTO_TRANSLATE_PROVIDER, AI by default', () => {
    expect(AutoTranslator.getConfiguredProvider(undefined)).toBe(AutoTranslatorProvider.AI);
    expect(AutoTranslator.getConfiguredProvider('ai')).toBe(AutoTranslatorProvider.AI);
    expect(AutoTranslator.getConfiguredProvider(' DeepL ')).toBe(AutoTranslatorProvider.DEEPL);
  });

  it('uses the AI provider from the Directus settings', async () => {
    const { autoTranslator, savedSettings } = createAutoTranslator({ aiSettingsRow: AI_SETTINGS_ROW, deeplKey: 'deepl-key' });
    await autoTranslator.init();
    expect(autoTranslator.isReady()).toBe(true);
    expect(savedSettings.at(-1).informations).toContain('AI');
  });

  it('falls back to DeepL without an AI provider', async () => {
    const { autoTranslator, savedSettings } = createAutoTranslator({ aiSettingsRow: null, deeplKey: 'deepl-key' });
    await autoTranslator.init();
    expect(autoTranslator.isReady()).toBe(true);
    expect(savedSettings.at(-1).informations).toContain('DeepL');
  });

  it('is not ready without AI provider and DeepL key', async () => {
    const { autoTranslator, savedSettings } = createAutoTranslator({ aiSettingsRow: null, deeplKey: null });
    await autoTranslator.init();
    expect(autoTranslator.isReady()).toBe(false);
    expect(savedSettings.at(-1).valid_auth_key).toBe(false);
  });

  it('skips a text longer than the provider accepts', async () => {
    const { autoTranslator } = createAutoTranslator({ aiSettingsRow: AI_SETTINGS_ROW, deeplKey: null });
    await autoTranslator.init();
    const text = 'x'.repeat(OpenAiCompatibleTranslator.MAX_TEXT_LENGTH + 1);
    await expect(autoTranslator.translateToLanguages({ text, destination_languages: ['en'] })).resolves.toEqual({});
  });
});

describe('CollectionAutoTranslator.translateTranslationItems', () => {
  it('asks the translator once per field for all languages', async () => {
    const requests: any[] = [];
    const autoTranslator = {
      isReady: () => true,
      translateToLanguages: async (request: any) => {
        requests.push(request);
        return Object.fromEntries(request.destination_languages.map((language: string) => [language, language + ': ' + request.text]));
      },
    } as any;

    const items = await CollectionAutoTranslator.translateTranslationItems({
      autoTranslator,
      fieldsToTranslate: ['name', 'description'],
      sourceTranslation: { name: 'Nudeln', description: '', languages_code: 'de-DE' },
      FIELD_LANGUAGES_ID_OR_CODE: 'languages_code',
      languageCodes: ['en-US', 'fr-FR'],
    });

    expect(requests).toEqual([{ text: 'Nudeln', source_language: 'de-DE', destination_languages: ['en-US', 'fr-FR'] }]);
    expect(items['en-US']).toEqual({ name: 'en-US: Nudeln', languages_code: { code: 'en-US' }, let_be_translated: true, be_source_for_translations: false });
    expect(items['fr-FR'].name).toBe('fr-FR: Nudeln');
  });
});
