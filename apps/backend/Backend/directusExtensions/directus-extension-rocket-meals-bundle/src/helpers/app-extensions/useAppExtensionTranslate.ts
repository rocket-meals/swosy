/**
 * Vue composable for the Directus app extensions of this bundle: a `translate` function bound to
 * the language of the logged-in backend user. Only usable inside a component `setup`.
 */

import { useStores } from '@directus/extensions-sdk';
import { computed } from 'vue';
import type { TranslationParams } from 'repo-depkit-common/src/translations';
import { AppExtensionLanguageHelper } from './AppExtensionLanguageHelper';
import type { BackendTranslationKeys } from '../translations/BackendTranslationKeys';

export function useAppExtensionTranslate() {
  const { useUserStore, useSettingsStore } = useStores();
  const userStore = useUserStore();
  const settingsStore = useSettingsStore();

  const language = computed<string | undefined>(() => AppExtensionLanguageHelper.resolveUserLanguage(userStore.currentUser?.language, settingsStore.settings?.default_language));

  const translate = (key: BackendTranslationKeys, params?: TranslationParams) => AppExtensionLanguageHelper.translate(key, language.value, params);

  const formatDateTime = (date: string | Date | null | undefined) => AppExtensionLanguageHelper.formatDateTime(date, language.value);

  return { language, translate, formatDateTime };
}
