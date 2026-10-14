import type { TranslationLanguage } from 'repo-depkit-common';

/** One language of a legal document. `content` is Markdown with `{{operator.*}}` / `{{customer.*}}` placeholders. */
export type LegalDocumentText = {
  title: string;
  content: string;
};

/** Every language of a legal document. A `Record` so a missing language fails the typecheck. */
export type LegalDocumentTexts = Record<TranslationLanguage, LegalDocumentText>;

export type LegalDocument = {
  /**
   * The fixed primary key of the wiki. The same on every server, so the document can be found
   * and updated without guessing, and a link to `wikis?id=...` works everywhere.
   */
  wikiId: string;
  /** What the app looks the page up by (`wikis?custom_id=...`, footer, drawer). */
  customId: string;
  alias: string;
  texts: LegalDocumentTexts;
};
