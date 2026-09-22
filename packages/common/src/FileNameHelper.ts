import { StringHelper } from './StringHelper';

export type SafeFileNameOptions = {
  /** Woraus der Name entstehen soll – ein Titel, eine Vorgangskennung, ein Alias. */
  name: string | null | undefined;
  /** Die Endung ohne Punkt, z. B. `pdf`. */
  extension: string;
  /** Der Name, wenn von `name` nichts übrig bleibt. Ohne Angabe: `file`. */
  fallbackName?: string;
};

/**
 * Dateinamen, die überall ankommen.
 *
 * Ein Dateiname reist durch Stellen, die nur ASCII vertragen: `Content-Disposition` einer
 * HTTP-Antwort trägt nichts anderes, und im Dateisystem eines Geräts hat ein Schrägstrich in
 * der Mitte schon einen Pfad daraus gemacht. Ein „Übergabeprotokoll 2023/188" käme dort als
 * Bytesalat oder als Unterordner an.
 *
 * Deshalb bleibt nur, was unstrittig ist: Buchstaben und Ziffern aus ASCII. Alles dazwischen
 * wird zu einem Unterstrich, mehrere zu einem einzigen, und am Rand bleibt keiner stehen.
 * Bleibt danach nichts übrig, trägt die Datei den Ersatznamen – eine Datei ohne Namen gibt es
 * nicht.
 */
export class FileNameHelper {
  /** Der Name, wenn ein Titel nichts hergibt, das ein Dateiname sein könnte. */
  static readonly DEFAULT_FALLBACK_NAME = 'file';

  static buildSafeFileName(options: SafeFileNameOptions): string {
    const { name, extension, fallbackName } = options;
    const safeName = FileNameHelper.toSafeFileNameBase(name) || fallbackName || FileNameHelper.DEFAULT_FALLBACK_NAME;
    return `${safeName}.${extension}`;
  }

  /** Der Namensteil ohne Endung – leer, wenn nichts Brauchbares darin steht. */
  static toSafeFileNameBase(name: string | null | undefined): string {
    const sanitizedName = StringHelper.replaceAllWithOptions({ str: String(name ?? ''), find: String.raw`[^A-Za-z0-9]+`, replace: '_' });
    return StringHelper.replaceAllWithOptions({ str: sanitizedName, find: String.raw`^_+|_+$`, replace: '' });
  }
}
