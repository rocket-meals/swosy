/**
 * Vue composable for the Directus app extensions of this bundle: a `translate` function bound to
 * the language the Directus UI is shown in. Only usable inside a component `setup`.
 *
 * Directus writes its UI language to `<html lang>` whenever it changes (user profile, project
 * default). Watching that attribute keeps our texts in the same language as Directus' own –
 * including a switch of the language while a page is open.
 */

import { useStores } from '@directus/extensions-sdk';
import { computed, onBeforeUnmount, ref } from 'vue';
import type { TranslationParams } from 'repo-depkit-common/src/translations';
import { AppExtensionLanguageHelper } from './AppExtensionLanguageHelper';
import type { BackendTranslationKeys } from '../translations/BackendTranslationKeys';

function readHtmlLanguage(): string | undefined {
  return typeof document !== 'undefined' ? document.documentElement?.lang || undefined : undefined;
}

export function useAppExtensionTranslate() {
  const { useUserStore, useServerStore } = useStores();
  const userStore = useUserStore();
  const serverStore = useServerStore();

  const htmlLanguage = ref<string | undefined>(readHtmlLanguage());
  if (typeof MutationObserver !== 'undefined' && typeof document !== 'undefined') {
    const observer = new MutationObserver(() => {
      htmlLanguage.value = readHtmlLanguage();
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    onBeforeUnmount(() => observer.disconnect());
  }

  const language = computed<string | undefined>(() =>
    AppExtensionLanguageHelper.resolveUiLanguage({
      htmlLanguage: htmlLanguage.value,
      userLanguage: userStore.currentUser?.language,
      projectDefaultLanguage: serverStore.info?.project?.default_language,
      browserLanguage: typeof navigator !== 'undefined' ? navigator.language : undefined,
    })
  );

  const translate = (key: BackendTranslationKeys, params?: TranslationParams) => AppExtensionLanguageHelper.translate(key, language.value, params);

  const formatDateTime = (date: string | Date | null | undefined) => AppExtensionLanguageHelper.formatDateTime(date, language.value);

  return { language, translate, formatDateTime };
}
