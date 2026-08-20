/**
 * AutoTranslatorInterface.ts – what a machine-translation provider has to offer.
 *
 * Implemented by {@link DeepLTranslator}; kept separate so the provider can be swapped or mocked.
 */

export type TranslationRequest = {
  text: string;
  source_language?: string;
  destination_language: string;
};

export interface AutoTranslatorInterface {
  init(): Promise<void>;

  translate(request: TranslationRequest): Promise<any>;

  getUsage(): Promise<any>;

  getExtra(): Promise<any>;
}
