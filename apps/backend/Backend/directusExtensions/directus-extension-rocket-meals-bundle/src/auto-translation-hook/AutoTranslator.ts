/**
 * AutoTranslator.ts – machine translation: source text in, translated text out.
 *
 * Backed by the OpenAI-compatible provider from Directus Settings → AI (see
 * {@link OpenAiCompatibleTranslator}) or by DeepL (see {@link DeepLTranslator}), it produces the content
 * translations that `helpers/ContentTranslationHelper.ts` then stores as `*_translations` rows. Every
 * call costs API quota, so translating the same text twice is a bug, not just slow.
 *
 * Which provider runs is set with the env variable `AUTO_TRANSLATE_PROVIDER`:
 * - `ai` (default): the provider from Directus Settings → AI. Without one, DeepL is used when
 *   `AUTO_TRANSLATE_API_KEY` is set.
 * - `deepl`: always DeepL with `AUTO_TRANSLATE_API_KEY`.
 *
 * Not to be confused with `helpers/translations/BackendTranslator.ts`, which translates nothing:
 * it looks a shipped, already translated text up by its key.
 */

import { DeepLTranslator } from './DeepLTranslator';
import { OpenAiCompatibleTranslator } from './OpenAiCompatibleTranslator';
import { AutoTranslatorInterface, MultiTranslationRequest, MultiTranslationResult, TranslationRequest } from './AutoTranslatorInterface';
import { AutoTranslatorSettings } from './AutoTranslatorSettings';
import { EnvVariableHelper } from '../helpers/EnvVariableHelper';
import { MyDatabaseHelper } from '../helpers/MyDatabaseHelper';
import { DirectusOpenAiCompatibleClient } from '../helpers/ai/DirectusOpenAiCompatibleClient';

export enum AutoTranslatorProvider {
  AI = 'ai',
  DEEPL = 'deepl',
}

export class AutoTranslator {
  private readonly logger: any;
  autoTranslatorSettings: AutoTranslatorSettings;
  private translatorImplementation: undefined | AutoTranslatorInterface;
  private readonly myDatabaseHelper: MyDatabaseHelper;

  constructor(autoTranslatorSettings: AutoTranslatorSettings, myDatabaseHelper: MyDatabaseHelper) {
    this.logger = myDatabaseHelper?.apiContext?.logger;
    this.autoTranslatorSettings = autoTranslatorSettings;
    this.myDatabaseHelper = myDatabaseHelper;
  }

  /** The provider from `AUTO_TRANSLATE_PROVIDER`, the AI provider unless DeepL is asked for explicitly. */
  static getConfiguredProvider(value: string | undefined = EnvVariableHelper.getAutoTranslateProvider()): AutoTranslatorProvider {
    return value?.trim().toLowerCase() === AutoTranslatorProvider.DEEPL ? AutoTranslatorProvider.DEEPL : AutoTranslatorProvider.AI;
  }

  async init() {
    try {
      const implementation = await this.createTranslatorImplementation();
      if (!implementation) {
        await this.setSettings(this.getSettingsAuthKeyErrorObject(this.getNotConfiguredMessage()));
        return;
      }
      await implementation.init();
      this.translatorImplementation = implementation;
      await this.reloadUsage();
      const correctObj = await this.getSettingsAuthKeyCorrectObject();
      await this.setSettings(correctObj);
    } catch (error: any) {
      console.log('Error Initializing Translatior');
      console.log(error.toString());
      await this.setSettings(this.getSettingsAuthKeyErrorObject(error));
    }
  }

  isReady(): boolean {
    return !!this.translatorImplementation;
  }

  /**
   * Translates one text into all given languages, how (one by one or in one request) is up to the provider.
   * A text longer than the provider accepts is skipped, a language that failed is missing in the result.
   */
  async translateToLanguages(request: MultiTranslationRequest): Promise<MultiTranslationResult> {
    if (!this.translatorImplementation || request.destination_languages.length === 0) return {};
    const maxTextLength = this.translatorImplementation.getMaxTextLength();
    if (maxTextLength !== null && request.text.length > maxTextLength) {
      console.warn('Text with ' + request.text.length + ' characters is longer than ' + maxTextLength + ' characters the translator accepts - skipping translation');
      return {};
    }
    const translations = await this.translatorImplementation.translateToLanguages(request);
    try {
      await this.reloadUsage(); //update usage stats
    } catch (err) {
      // Don't let usage reload failure lose the translation result
      console.error('Error reloading usage after translation:', err);
    }
    return translations;
  }

  async translate(request: TranslationRequest): Promise<string | null> {
    const translations = await this.translateToLanguages({ text: request.text, source_language: request.source_language, destination_languages: [request.destination_language] });
    return translations[request.destination_language] ?? null;
  }

  async getSettingsAuthKeyCorrectObject() {
    const usage = await this.getUsage();
    const extra = await this.getExtra();
    return {
      valid_auth_key: true,
      informations: 'Auth Key is valid! Provider: ' + this.getImplementationName(),
      ...usage,
      ...extra,
    };
  }

  getSettingsAuthKeyErrorObject(error: any) {
    return {
      auth_key: null,
      valid_auth_key: false,
      informations: 'Auth Key not valid!\n' + error.toString(),
    };
  }

  /** Private Methods */

  private async createTranslatorImplementation(): Promise<AutoTranslatorInterface | null> {
    if (AutoTranslator.getConfiguredProvider() === AutoTranslatorProvider.DEEPL) {
      return this.createDeepLTranslator();
    }
    const aiTranslator = await this.createAiTranslator();
    // Without an AI provider DeepL keeps working, so an existing setup does not stop translating.
    return aiTranslator ?? this.createDeepLTranslator();
  }

  private async createAiTranslator(): Promise<OpenAiCompatibleTranslator | null> {
    const apiContext = this.myDatabaseHelper?.apiContext;
    if (!apiContext) {
      return null;
    }
    const client = await DirectusOpenAiCompatibleClient.fromDirectusSettings(apiContext);
    return client ? new OpenAiCompatibleTranslator(client, EnvVariableHelper.getAutoTranslateModel()) : null;
  }

  private createDeepLTranslator(): DeepLTranslator | null {
    const authKey = this.autoTranslatorSettings.getAuthKey();
    return authKey ? new DeepLTranslator(authKey) : null;
  }

  private getNotConfiguredMessage(): string {
    const deeplHint = 'set the DeepL key in the .env file: ' + EnvVariableHelper.getEnvFieldNameForAutoTranslateApiKey();
    if (AutoTranslator.getConfiguredProvider() === AutoTranslatorProvider.DEEPL) {
      return 'Auth Key not set! Please ' + deeplHint;
    }
    return 'No translator configured! Please configure an AI provider in the Directus settings (Settings → AI) or ' + deeplHint;
  }

  private getImplementationName(): string {
    if (this.translatorImplementation instanceof OpenAiCompatibleTranslator) {
      return 'AI (Directus Settings → AI)';
    }
    return 'DeepL';
  }

  async reloadUsage() {
    const usage = await this.getUsage();
    const used = usage.used || 0;
    const limit = usage.limit || 0;
    const percentage = limit > 0 ? Math.round((used / limit) * 100) : 0;
    await this.setSettings({ percentage: percentage, ...usage });
  }

  async getUsage() {
    if (!this.translatorImplementation) return { used: 0, limit: 0 };
    return await this.translatorImplementation.getUsage();
  }

  async getExtra() {
    if (!this.translatorImplementation) return { extra: '' };
    return await this.translatorImplementation.getExtra();
  }

  async setSettings(newSettings: any) {
    await this.autoTranslatorSettings.setSettings(newSettings);
  }
}
