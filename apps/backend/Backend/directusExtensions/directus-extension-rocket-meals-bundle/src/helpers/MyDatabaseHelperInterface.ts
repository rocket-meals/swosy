import { ApiContext } from './ApiContext';
import { EventContext as ExtentContextDirectusTypes } from '@directus/types';
import { ItemsServiceHelper } from './ItemsServiceHelper';
import { DatabaseTypes } from 'repo-depkit-common';
import { ServerInfo } from './ItemsServiceCreator';
import { createDirectus, DirectusClient, rest, RestClient, serverInfo } from '@directus/sdk';
import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Wer ein erzeugtes Dokument herausgibt: der Briefkopf eines Formular-PDFs.
 *
 * Das ist bewusst **nicht** der App-Name aus der Directus-Server-Info. Ein Abnahmeprotokoll
 * trägt den Namen der Einrichtung, die es ausgibt („Studentenwerk Hannover"), nicht den Namen
 * der App, mit der es ausgefüllt wurde. Beide Felder dürfen leer sein – dann fällt der Aufrufer
 * auf die Server-Info zurück (siehe `FormHelper.resolveDocumentOrganization`).
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

  private static readonly EXAMPLE_ORGANIZATION_LOGO_PATH = path.join(__dirname, 'form', '__tests__', 'data', 'example_organization_logo.svg');

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
   */
  async getDocumentOrganization(): Promise<DocumentOrganization> {
    return {
      name: MyDatabaseTestableHelper.EXAMPLE_ORGANIZATION_NAME,
      logoUrl: MyDatabaseTestableHelper.getExampleOrganizationLogoDataUri(),
    };
  }

  /** Das Beispiel-Logo als Data-URI, damit das PDF ohne Server erzeugt werden kann. */
  public static getExampleOrganizationLogoDataUri(): string | null {
    const logoPath = MyDatabaseTestableHelper.EXAMPLE_ORGANIZATION_LOGO_PATH;
    if (!fs.existsSync(logoPath)) {
      return null;
    }
    const logoSvg = fs.readFileSync(logoPath);
    return `data:image/svg+xml;base64,${logoSvg.toString('base64')}`;
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
