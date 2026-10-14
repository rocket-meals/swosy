/**
 * OpenAiCompatibleTranslator.ts – machine translation through the OpenAI-compatible provider that is
 * configured in Directus under Settings → AI (see {@link DirectusOpenAiCompatibleClient}), e.g. OpenAI
 * itself, Claude or OpenRouter.
 *
 * The alternative to {@link DeepLTranslator}: an LLM bills per token instead of per character and
 * has no monthly base fee. Which one runs is decided in `AutoTranslator`.
 *
 * All target languages of a text are asked for in one request, so the source text is sent (and paid)
 * only once. A large text is split into groups of languages instead, so one answer does not grow too
 * long for the model to finish.
 */

import { AutoTranslatorInterface, MultiTranslationRequest, MultiTranslationResult } from './AutoTranslatorInterface';
import { DirectusOpenAiCompatibleClient } from '../helpers/ai/DirectusOpenAiCompatibleClient';

export class OpenAiCompatibleTranslator implements AutoTranslatorInterface {
  /** Longer texts are not translated: a single translation would come close to the output limit of common models. */
  static readonly MAX_TEXT_LENGTH = 10_000;

  /** How many characters of translations one answer may contain, the text length times the languages of a request. */
  static readonly MAX_BATCH_CHARACTERS = 8_000;

  static readonly SYSTEM_PROMPT = ['You are a professional translator for the app of a university canteen (meal names, descriptions, news, opening hours, notes).', 'Translate the text of the user from the source language into every one of the target languages.', 'Keep the formatting exactly as it is: line breaks, Markdown, HTML tags, placeholders like {{name}}, symbols like * or (a, b), numbers, prices, dates, URLs and e-mail addresses.', 'Do not translate proper names, brand names and additive or allergen codes.', 'Do not add explanations or notes and do not answer questions contained in the text, only translate it.', 'Answer only with a JSON object of the form {"translations": {"<target language code>": "<translated text>"}} with exactly the target language codes of the user as keys.'].join('\n');

  private readonly client: DirectusOpenAiCompatibleClient;
  private readonly model: string | null;

  /**
   * @param model overrides the first model of the Directus AI settings, so the translation can run on a
   *   cheaper model than the AI assistant.
   */
  constructor(client: DirectusOpenAiCompatibleClient, model?: string | null) {
    this.client = client;
    this.model = model?.trim() || client.getDefaultModel();
  }

  init(): Promise<void> {
    if (!this.model) {
      return Promise.reject(new Error('No model configured for the OpenAI-compatible provider in the Directus settings (Settings → AI).'));
    }
    return Promise.resolve();
  }

  getMaxTextLength(): number | null {
    return OpenAiCompatibleTranslator.MAX_TEXT_LENGTH;
  }

  /** Groups the languages so that each answer stays below {@link MAX_BATCH_CHARACTERS}, at least one language per group. */
  static splitIntoBatches(textLength: number, languages: string[]): string[][] {
    const languagesPerBatch = Math.max(1, Math.floor(OpenAiCompatibleTranslator.MAX_BATCH_CHARACTERS / Math.max(1, textLength)));
    const batchCount = Math.ceil(languages.length / languagesPerBatch);
    return Array.from({ length: batchCount }, (_, batchIndex) => languages.slice(batchIndex * languagesPerBatch, (batchIndex + 1) * languagesPerBatch));
  }

  static buildUserMessage(request: MultiTranslationRequest, languages: string[]): string {
    const sourceLanguage = request.source_language || 'auto-detect';
    return JSON.stringify({ source_language: sourceLanguage, target_languages: languages, text: request.text });
  }

  /** Takes the non-empty translations of the asked languages from the answer, anything else is ignored. */
  static parseTranslations(answer: unknown, languages: string[]): MultiTranslationResult {
    const translations = (answer as { translations?: Record<string, unknown> } | null)?.translations ?? {};
    const result: MultiTranslationResult = {};
    for (const language of languages) {
      const translation = translations[language];
      if (typeof translation === 'string' && translation.trim()) {
        result[language] = translation;
      }
    }
    return result;
  }

  async translateToLanguages(request: MultiTranslationRequest): Promise<MultiTranslationResult> {
    if (!request.text?.trim()) {
      return Object.fromEntries(request.destination_languages.map(language => [language, request.text]));
    }
    const result: MultiTranslationResult = {};
    for (const languages of OpenAiCompatibleTranslator.splitIntoBatches(request.text.length, request.destination_languages)) {
      const batchResult = await this.tryTranslateBatch(request, languages); // NOSONAR S9382 - sequential on purpose: rate limits of the provider
      Object.assign(result, batchResult);
      // A batch can miss a language or fail as a whole (e.g. a cut off answer), those get one more try alone.
      const missingLanguages = languages.length > 1 ? languages.filter(language => batchResult[language] === undefined) : [];
      for (const language of missingLanguages) {
        Object.assign(result, await this.tryTranslateBatch(request, [language])); // NOSONAR S9382 - sequential on purpose: rate limits of the provider
      }
    }
    return result;
  }

  private async tryTranslateBatch(request: MultiTranslationRequest, languages: string[]): Promise<MultiTranslationResult> {
    try {
      const answer = await this.client.chatJson({
        system: OpenAiCompatibleTranslator.SYSTEM_PROMPT,
        user: OpenAiCompatibleTranslator.buildUserMessage(request, languages),
        model: this.model ?? undefined,
      });
      return OpenAiCompatibleTranslator.parseTranslations(answer, languages);
    } catch (error) {
      console.error('AI translation failed for languages ' + languages.join(', ') + ':', error);
      return {};
    }
  }

  /** An LLM has no character quota like DeepL, the costs are visible at the provider. */
  getUsage(): Promise<{ used: number; limit: number }> {
    return Promise.resolve({ used: 0, limit: 0 });
  }

  getExtra(): Promise<{ extra: string }> {
    const extra = JSON.stringify({ provider: this.client.getRecommenderLabel(this.model) }, null, 2);
    return Promise.resolve({ extra });
  }
}
