import { ApiContext } from './ApiContext';
import { EventContext as ExtentContextDirectusTypes } from '@directus/types';
import { ItemsServiceHelper } from './ItemsServiceHelper';
import { DatabaseTypes } from 'repo-depkit-common';
import { ServerInfo } from './ItemsServiceCreator';
import { createDirectus, DirectusClient, rest, RestClient, serverInfo } from '@directus/sdk';
import { DocumentOrganizationHelper } from './DocumentOrganizationHelper';
import { MockImageFile } from './pdf/MockImageFileHelper';
import * as path from 'node:path';

/**
 * Was eine Installation zum Briefkopf eines Formular-PDFs beisteuert: ihr Logo.
 *
 * Nur das Logo – der Name der herausgebenden Einrichtung steht nicht im Briefkopf, sondern auf
 * jeder Seite in der Fußzeile, und kommt aus der Server-Info (siehe
 * `FormPdfDocumentHelper.resolveOrganization`). Das Feld darf leer sein; dann greift der
 * Rückfall auf das `project_logo` der Server-Info.
 */
export type DocumentOrganization = {
  /** Bereits aufgelöste Bild-URL des Logos aus `app_settings.company_image`. */
  logoUrl: string | null;
};

/**
 * Die Angaben zu einer Person, die ein erzeugtes Dokument nennt.
 *
 * Bewusst nur diese drei Felder: Ein Dokument nennt einen Namen, sonst nichts. Wer einen
 * ganzen `DirectusUsers`-Datensatz durchreicht, nimmt in Kauf, dass eines Tages mehr davon im
 * PDF landet, als dort hingehört.
 */
export type DocumentUser = {
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
};

export interface MyDatabaseTestableHelperInterface {
  getServerInfo(): Promise<ServerInfo>;
  getServerUrl(): string;
  getServerPort(): string;
  getAdminBearerToken(): Promise<string | undefined>;
  /**
   * Das Logo der Einrichtung für den Briefkopf erzeugter Dokumente.
   *
   * Absichtlich Teil der schmalen Test-Schnittstelle: die PDF-Erzeugung ist damit weiterhin
   * offline testbar, und der Test liefert Beispielwerte statt einer Datenbankabfrage.
   */
  getDocumentOrganization(): Promise<DocumentOrganization>;
  /**
   * Die Person hinter einer Nutzer-Id – für die Zeile „Zuletzt bearbeitet von" im Formular-PDF.
   *
   * Aus demselben Grund Teil der schmalen Test-Schnittstelle wie
   * {@link getDocumentOrganization}: Das PDF bleibt offline erzeugbar. `null`, wenn es die Id
   * nicht gibt oder sie nicht gelesen werden kann – ein Dokument darf an einem fehlenden Namen
   * nicht scheitern.
   */
  getDocumentUserById(userId: string): Promise<DocumentUser | null>;
}

export class MyDatabaseTestableHelper implements MyDatabaseTestableHelperInterface {
  /**
   * Die Datei-ID, unter der das Beispiel-Logo als `app_settings.company_image` steht.
   *
   * Eine feste Beispiel-UUID: Das Beispiel-PDF verlangt sein Logo damit unter derselben
   * Asset-URL wie im Betrieb. Wer offline rendert, ordnet dieser ID die Datei aus dem
   * Repository zu (siehe {@link getExampleOrganizationLogoMockImageFile}).
   */
  public static readonly EXAMPLE_COMPANY_IMAGE_FILE_ID = '1e6a0c8e-4b2d-4c7a-9a4f-0b1d2e3f4a5b';

  /**
   * Das Beispiel-Logo ist ein Wort-Bild-Zeichen im Querformat (720 × 180, also 4:1).
   *
   * Absicht: Genau diese Form haben die Logos echter Einrichtungen – ein Schriftzug neben
   * einem Zeichen. Das Beispiel-PDF zeigt damit denselben Fall wie der Betrieb, und dass der
   * Briefkopf ein breites Logo verträgt, ist am erzeugten Beispiel zu sehen.
   */
  private static getExampleOrganizationLogoPath(): string {
    return MyDatabaseTestableHelper.getExampleDataPath('example_organization_logo_wide.svg');
  }

  /** Die Datei-ID des quadratischen Beispiel-Logos – der zweite Fall, den der Briefkopf trägt. */
  public static readonly EXAMPLE_SQUARE_COMPANY_IMAGE_FILE_ID = '2f7b1d9f-5c3e-4d8b-8b5a-1c2d3e4f5a6b';

  /** Ein quadratisches Beispiel-Logo (180 × 180), damit auch diese Form geprüft bleibt. */
  private static getExampleSquareOrganizationLogoPath(): string {
    return MyDatabaseTestableHelper.getExampleDataPath('example_organization_logo.svg');
  }

  /**
   * Pfad zu einer Beispiel-Datei aus den Testdaten. Bewusst eine Funktion und kein statisches
   * Feld: Diese Klasse landet mit im Extension-Bundle, und das Bundle ist ein ES-Modul, in dem
   * es kein `__dirname` gibt. Ein statisches Feld würde beim Laden ausgewertet und das ganze
   * Bundle (alle Hooks und Endpoints) mit „__dirname is not defined in ES module scope“ abbrechen.
   * Aufgerufen wird das nur in Tests, dort gibt es `__dirname`.
   */
  private static getExampleDataPath(fileName: string): string {
    return path.join(__dirname, 'form', '__tests__', 'data', fileName);
  }

  private cachedServerInfo: ServerInfo | undefined = undefined;
  private cachedClient: (DirectusClient<DatabaseTypes.CustomDirectusTypes> & RestClient<DatabaseTypes.CustomDirectusTypes>) | undefined = undefined;
  public useOfflineServerInfo: boolean = true;

  getServerUrl(): string {
    return 'https://test.rocket-meals.de/rocket-meals/api';
  }

  async getServerInfo(): Promise<ServerInfo> {
    if (!this.useOfflineServerInfo) {
      if (!this.cachedServerInfo) {
        this.cachedServerInfo = await this.downloadServerInfo();
      }
      if (this.cachedServerInfo) {
        return this.cachedServerInfo;
      }
    }
    return this.getServerInfoNoInternetTest();
  }

  async getServerInfoNoInternetTest(): Promise<ServerInfo> {
    return {
      project: {
        project_name: 'Rocket Meals',
        project_color: '#D14610',
        project_logo: undefined,
      },
    };
  }

  getServerPort(): string {
    return '8055';
  }

  /**
   * Der Briefkopf der Beispiel-PDFs: ein schlichtes Beispiel-Logo, kein echtes Logo einer
   * echten Einrichtung – die Beispiel-PDFs landen im Repository.
   *
   * Bewusst kein Sonderweg: Die Beispiel-`AppSettings` gehen durch dieselbe Auflösung wie die
   * Einstellungen aus der Datenbank, die Logo-URL ist also eine echte Asset-URL.
   */
  async getDocumentOrganization(): Promise<DocumentOrganization> {
    return DocumentOrganizationHelper.resolveDocumentOrganization(MyDatabaseTestableHelper.getExampleAppSettings(), this);
  }

  /**
   * Die Nutzer-Id, unter der die Beispiel-Bearbeiterin zu finden ist.
   *
   * Der Beispiel-Vorgang trägt sein `user_updated` als aufgelöstes Objekt (siehe
   * `FormHelper.getExampleFormSubmission`); diese Id deckt den anderen Fall ab, in dem Directus
   * nur die Id liefert und das Dokument die Person nachladen muss.
   */
  public static readonly EXAMPLE_DOCUMENT_USER_ID = '6b4c9f3a-2d71-4f58-9a0c-7e5b1d8c2f34';

  /** Die Beispiel-Bearbeiterin – reine Musterdaten, keine echte Person. */
  public static getExampleDocumentUser(): DocumentUser {
    return {
      first_name: 'Ulrike',
      last_name: 'Wohnheimer',
      email: 'wohnheimleitung@example.com',
    };
  }

  /**
   * Offline-Ersatz für den Nutzer-Lookup: Die Beispiel-Id liefert die Beispiel-Person, jede
   * andere Id nichts. Tests kommen damit ohne Datenbank aus.
   */
  async getDocumentUserById(userId: string): Promise<DocumentUser | null> {
    if (userId === MyDatabaseTestableHelper.EXAMPLE_DOCUMENT_USER_ID) {
      return MyDatabaseTestableHelper.getExampleDocumentUser();
    }
    return null;
  }

  /** Die `app_settings`, mit denen Beispiel-Dokumente erzeugt werden – reine Musterdaten. */
  public static getExampleAppSettings(): Partial<DatabaseTypes.AppSettings> {
    return {
      company_image: MyDatabaseTestableHelper.EXAMPLE_COMPANY_IMAGE_FILE_ID,
    };
  }

  /**
   * Dieselben Beispieldaten mit dem quadratischen Logo – der zweite Fall des Briefkopfs.
   * Das Beispiel-PDF zeigt damit, dass ein quadratisches Logo nicht über die 16mm Höhe wächst.
   */
  public static getExampleAppSettingsWithSquareLogo(): Partial<DatabaseTypes.AppSettings> {
    return {
      company_image: MyDatabaseTestableHelper.EXAMPLE_SQUARE_COMPANY_IMAGE_FILE_ID,
    };
  }

  /**
   * Die Zuordnung, mit der das Beispiel-Logo offline ausgeliefert wird: Die Beispiel-Datei-ID
   * kommt in der angefragten Asset-URL vor, geantwortet wird mit der Datei aus dem Repository.
   */
  public static getExampleOrganizationLogoMockImageFile(): MockImageFile {
    return {
      urlPart: MyDatabaseTestableHelper.EXAMPLE_COMPANY_IMAGE_FILE_ID,
      filePath: MyDatabaseTestableHelper.getExampleOrganizationLogoPath(),
      contentType: 'image/svg+xml',
    };
  }

  /** Dieselbe Zuordnung für das quadratische Beispiel-Logo. */
  public static getExampleSquareOrganizationLogoMockImageFile(): MockImageFile {
    return {
      urlPart: MyDatabaseTestableHelper.EXAMPLE_SQUARE_COMPANY_IMAGE_FILE_ID,
      filePath: MyDatabaseTestableHelper.getExampleSquareOrganizationLogoPath(),
      contentType: 'image/svg+xml',
    };
  }

  public getPublicClient() {
    if (!this.cachedClient) {
      this.cachedClient = createDirectus<DatabaseTypes.CustomDirectusTypes>(this.getServerUrl()).with(rest());
    }
    return this.cachedClient;
  }

  async downloadServerInfo(): Promise<ServerInfo> {
    // The SDK's ServerInfoOutput type does not declare all fields (e.g. project_color)
    // which the Directus server actually returns and our local ServerInfo type expects.
    return (await this.getPublicClient().request(serverInfo())) as unknown as ServerInfo;
  }

  async getAdminBearerToken(): Promise<string | undefined> {
    return undefined;
  }
}

export interface MyDatabaseHelperInterface extends MyDatabaseTestableHelperInterface {
  apiContext: ApiContext;
  eventContext: ExtentContextDirectusTypes | undefined;

  getUsersHelper(): ItemsServiceHelper<DatabaseTypes.DirectusUsers>;
}
