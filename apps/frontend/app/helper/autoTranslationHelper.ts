/**
 * Flags the backend's machine translation (`auto-translation-hook`) keeps on every content
 * translation row (`*_translations`, e.g. of foods, food offers or news).
 */
export type AutoTranslationFlags = {
	let_be_translated?: boolean | null;
	be_source_for_translations?: boolean | null;
};

/**
 * Whether the text of a translation row was translated by machine: the row is not the source of
 * the translations and is still set to be translated. A row maintained by hand has
 * `let_be_translated` switched off, the source row carries `be_source_for_translations`.
 */
export function isAutoTranslatedTranslation(translation: AutoTranslationFlags | null | undefined): boolean {
	return translation?.let_be_translated === true && translation?.be_source_for_translations !== true;
}
