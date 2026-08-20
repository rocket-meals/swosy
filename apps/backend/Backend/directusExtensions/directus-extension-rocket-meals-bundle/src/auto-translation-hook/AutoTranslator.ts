/**
 * AutoTranslator.ts – machine translation: source text in, translated text out.
 *
 * Backed by DeepL (see {@link DeepLTranslator}), it produces the content translations that
 * `helpers/ContentTranslationHelper.ts` then stores as `*_translations` rows. Every call costs
 * API quota, so translating the same text twice is a bug, not just slow.
 *
 * Not to be confused with `helpers/translations/BackendTranslator.ts`, which translates nothing:
 * it looks a shipped, already translated text up by its key.
 */

import { DeepLTranslator } from './DeepLTranslator';
import { AutoTranslatorInterface, TranslationRequest } from './AutoTranslatorInterface';
import { AutoTranslatorSettings } from './AutoTranslatorSettings';
import { EnvVariableHelper } from '../helpers/EnvVariableHelper';
import { MyDatabaseHelper } from '../helpers/MyDatabaseHelper';

export class AutoTranslator {
  private readonly logger: any;
  autoTranslatorSettings: AutoTranslatorSettings;
  private translatorImplementation: undefined | AutoTranslatorInterface;

  constructor(autoTranslatorSettings: AutoTranslatorSettings, myDatabaseHelper: MyDatabaseHelper) {
    this.logger = myDatabaseHelper?.apiContext?.logger;
    this.autoTranslatorSettings = autoTranslatorSettings;
  }

  async init() {
    let auth_key = await this.getAuthKey();
    if (!auth_key) {
      const message = 'Auth Key not set! Please set the key in .env file: ' + EnvVariableHelper.getEnvFieldNameForAutoTranslateApiKey();
      await this.setSettings(this.getSettingsAuthKeyErrorObject(message));
      return;
    }
    try {
      await this.reloadAuthKey(auth_key);
      let correctObj = await this.getSettingsAuthKeyCorrectObject();
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

  async translate(request: TranslationRequest) {
    if (!this.translatorImplementation) return null;
    const translation = await this.translatorImplementation.translate(request);
    try {
      await this.reloadUsage(); //update usage stats
    } catch (err) {
      // Don't let usage reload failure lose the translation result
      console.error('Error reloading usage after translation:', err);
    }
    return translation;
  }

  async getSettingsAuthKeyCorrectObject() {
    const usage = await this.getUsage();
    const extra = await this.getExtra();
    return {
      valid_auth_key: true,
      informations: 'Auth Key is valid!',
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

  async reloadAuthKey(auth_key: string) {
    this.translatorImplementation = new DeepLTranslator(auth_key);
    await this.translatorImplementation.init();
    await this.reloadUsage();
  }

  async reloadUsage() {
    const usage = await this.getUsage();
    const used = usage.used || 0;
    const limit = usage.limit || 0;
    let percentage = 0;
    if (limit > 0) {
      percentage = Math.round((used / limit) * 100);
    }
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

  async getAuthKey() {
    return await this.autoTranslatorSettings.getAuthKey();
  }
}
