/**
 * AutoTranslatorInterface.ts – what a machine-translation provider has to offer.
 *
 * Implemented by {@link OpenAiCompatibleTranslator} and {@link DeepLTranslator}; kept separate so the provider can be swapped or mocked.
 *
 * A provider always gets one text with all its target languages. How it gets there is its own
 * decision: DeepL translates language by language, an LLM answers several languages in one JSON
 * and splits large texts into smaller groups of languages.
 */

export type TranslationRequest = {
  text: string;
  source_language?: string;
  destination_language: string;
};

export type MultiTranslationRequest = {
  text: string;
  source_language?: string;
  destination_languages: string[];
};

/** Translated text per destination language. A language that failed is missing. */
export type MultiTranslationResult = Record<string, string>;

export interface AutoTranslatorInterface {
  init(): Promise<void>;

  /**
   * The longest text in characters the provider translates at all, longer texts are skipped.
   * `null` means no limit.
   */
  getMaxTextLength(): number | null;

  translateToLanguages(request: MultiTranslationRequest): Promise<MultiTranslationResult>;

  getUsage(): Promise<any>;

  getExtra(): Promise<any>;
}
