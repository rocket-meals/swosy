import * as fs from 'node:fs';

/**
 * Eine lokale Datei, die eine bestimmte Bild-URL beantwortet, statt sie aus dem Netz zu laden.
 *
 * Gedacht für Tests, die offline laufen: Das Beispiel-PDF verlangt sein Logo unter der echten
 * Asset-URL (`<serverUrl>/assets/<id>?...`), dahinter steht aber kein Server. Statt einen
 * Sonderweg im Produktivcode zu bauen, liefert die Mock-Mechanik genau für diese URL den Inhalt
 * einer Datei aus dem Repository aus.
 */
export type MockImageFile = {
  /**
   * Teil der Bild-URL, der diese Datei auswählt – üblicherweise die Datei-ID des Assets.
   * Bewusst ein Teilstring und kein vollständiger Vergleich: Breite, Qualität und weitere
   * Transformationsparameter hängen an der URL und ändern sich mit dem Aufrufer.
   */
  urlPart: string;
  /** Pfad der lokalen Datei, deren Inhalt ausgeliefert wird. */
  filePath: string;
  /** Content-Type, mit dem geantwortet wird, z. B. `image/svg+xml`. */
  contentType: string;
};

export class MockImageFileHelper {
  /**
   * Die erste Zuordnung, deren `urlPart` in der angefragten URL vorkommt – sonst `undefined`.
   *
   * Groß-/Kleinschreibung spielt keine Rolle, damit eine von Hand gepflegte Datei-ID nicht
   * still am Vergleich vorbeiläuft.
   */
  public static findMockImageFileForUrl(url: string, mockImageFiles: MockImageFile[] | undefined): MockImageFile | undefined {
    if (!mockImageFiles || mockImageFiles.length === 0 || !url) {
      return undefined;
    }
    const urlLowerCase = url.toLowerCase();
    return mockImageFiles.find(mockImageFile => {
      const urlPart = mockImageFile.urlPart?.toLowerCase();
      return !!urlPart && urlLowerCase.includes(urlPart);
    });
  }

  /**
   * Der Inhalt der zugeordneten Datei; `null`, wenn es sie nicht gibt oder sie nicht lesbar ist.
   * Der Aufrufer fällt dann auf sein bisheriges Verhalten zurück.
   */
  public static readMockImageFileBody(mockImageFile: MockImageFile): Buffer | null {
    try {
      if (!fs.existsSync(mockImageFile.filePath)) {
        return null;
      }
      return fs.readFileSync(mockImageFile.filePath);
    } catch (error) {
      console.error('Could not read the mocked image file ' + mockImageFile.filePath + ': ' + error);
      return null;
    }
  }
}
