import { MockImageFile } from './MockImageFileHelper';

export type PdfGeneratorOptions = {
  format?: 'A3' | 'A4' | 'A5' | 'Legal' | 'Letter' | 'Tabloid';
  landscape?: boolean;
  printBackground?: boolean;
  /** Must be true for `headerTemplate`/`footerTemplate` to be printed at all. */
  displayHeaderFooter?: boolean;
  /**
   * HTML that Chromium repeats on every page. It is rendered in its own document, so it needs
   * inline styles and an explicit font-size; the classes `pageNumber` and `totalPages` are
   * filled in by Chromium. The margin on that side has to leave room for it.
   */
  headerTemplate?: string;
  footerTemplate?: string;
  margin?: {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
  };
};

export type RequestOptions = {
  bearerToken?: string | null;
  mockImageResolution?: boolean; // if true, images are mocked with a placeholder image
  /**
   * Bild-URLs, die aus einer lokalen Datei beantwortet werden, statt aus dem Netz zu laden.
   *
   * Wird vor dem grauen Platzhalter von `mockImageResolution` geprüft: Passt eine Zuordnung auf
   * die angefragte URL, liefert der Generator den Dateiinhalt aus; sonst bleibt es beim
   * bisherigen Verhalten. Damit durchläuft z. B. das Beispiel-Logo dieselbe Asset-URL wie im
   * Betrieb und ist im PDF trotzdem zu sehen.
   */
  mockImageFilesByUrlPart?: MockImageFile[];
};
