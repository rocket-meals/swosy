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
 * Wer ein erzeugtes Dokument herausgibt: der Briefkopf eines Formular-PDFs.
 *
 * Das ist bewusst **nicht** der App-Name aus der Directus-Server-Info. Ein Abnahmeprotokoll
 * trägt den Namen der Einrichtung, die es ausgibt („Studentenwerk Hannover"), nicht den Namen
 * der App, mit der es ausgefüllt wurde. Beide Felder dürfen leer sein – dann greift der
 * Rückfall auf den `project_descriptor` der Server-Info, und wenn auch der leer ist, bleibt der
 * Name leer (siehe `FormPdfDocumentHelper.resolveOrganization`).
 */
export type DocumentOrganization = {
  /** Name der Einrichtung aus `app_settings.company_name`. */
  name: string | null;
  /** Bereits aufgelöste Bild-URL des Logos aus `app_settings.company_image`. */
  logoUrl: string | null;
};

export interface MyDatabaseTestableHelperInterface {
  getServerInfo(): Promise<ServerInfo>;
  getServerUrl(): string;
  getServerPort(): string;
  getAdminBearerToken(): Promise<string | undefined>;
  /**
   * Name und Logo der Einrichtung für den Briefkopf erzeugter Dokumente.
   *
   * Absichtlich Teil der schmalen Test-Schnittstelle: die PDF-Erzeugung ist damit weiterhin
   * offline testbar, und der Test liefert Beispielwerte statt einer Datenbankabfrage.
   */
  getDocumentOrganization(): Promise<DocumentOrganization>;
}

export class MyDatabaseTestableHelper implements MyDatabaseTestableHelperInterface {
  /** Name der Einrichtung in Beispiel-PDFs – ein Muster, keine echte Einrichtung. */
  public static readonly EXAMPLE_ORGANIZATION_NAME = 'Studentenwerk Musterstadt';

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
  private static readonly EXAMPLE_ORGANIZATION_LOGO_PATH = path.join(__dirname, 'form', '__tests__', 'data', 'example_organization_logo_wide.svg');

  /** Die Datei-ID des quadratischen Beispiel-Logos – der zweite Fall, den der Briefkopf trägt. */
  public static readonly EXAMPLE_SQUARE_COMPANY_IMAGE_FILE_ID = '2f7b1d9f-5c3e-4d8b-8b5a-1c2d3e4f5a6b';

  /** Ein quadratisches Beispiel-Logo (180 × 180), damit auch diese Form geprüft bleibt. */
  private static readonly EXAMPLE_SQUARE_ORGANIZATION_LOGO_PATH = path.join(__dirname, 'form', '__tests__', 'data', 'example_organization_logo.svg');

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
   * Beispielwerte für den Briefkopf: eine erfundene Einrichtung und ein schlichtes Beispiel-Logo.
   * Kein echtes Logo einer echten Einrichtung – die Beispiel-PDFs landen im Repository.
   *
   * Bewusst kein Sonderweg: Die Beispiel-`AppSettings` gehen durch dieselbe Auflösung wie die
   * Einstellungen aus der Datenbank, die Logo-URL ist also eine echte Asset-URL.
   */
  async getDocumentOrganization(): Promise<DocumentOrganization> {
    return DocumentOrganizationHelper.resolveDocumentOrganization(MyDatabaseTestableHelper.getExampleAppSettings(), this);
  }

  /** Die `app_settings`, mit denen Beispiel-Dokumente erzeugt werden – reine Musterdaten. */
  public static getExampleAppSettings(): Partial<DatabaseTypes.AppSettings> {
    return {
      company_name: MyDatabaseTestableHelper.EXAMPLE_ORGANIZATION_NAME,
      company_image: MyDatabaseTestableHelper.EXAMPLE_COMPANY_IMAGE_FILE_ID,
    };
  }

  /**
   * Dieselben Beispieldaten mit dem quadratischen Logo – der zweite Fall des Briefkopfs.
   * Das Beispiel-PDF zeigt damit, dass ein quadratisches Logo nicht über die 16mm Höhe wächst.
   */
  public static getExampleAppSettingsWithSquareLogo(): Partial<DatabaseTypes.AppSettings> {
    return {
      company_name: MyDatabaseTestableHelper.EXAMPLE_ORGANIZATION_NAME,
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
      filePath: MyDatabaseTestableHelper.EXAMPLE_ORGANIZATION_LOGO_PATH,
      contentType: 'image/svg+xml',
    };
  }

  /** Dieselbe Zuordnung für das quadratische Beispiel-Logo. */
  public static getExampleSquareOrganizationLogoMockImageFile(): MockImageFile {
    return {
      urlPart: MyDatabaseTestableHelper.EXAMPLE_SQUARE_COMPANY_IMAGE_FILE_ID,
      filePath: MyDatabaseTestableHelper.EXAMPLE_SQUARE_ORGANIZATION_LOGO_PATH,
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
