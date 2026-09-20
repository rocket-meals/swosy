import { DatabaseTypes } from 'repo-depkit-common';
import { DocumentOrganization, MyDatabaseTestableHelperInterface } from './MyDatabaseHelperInterface';
import { DirectusFilesAssetHelper } from './DirectusFilesAssetHelper';

/**
 * Der eine Weg von `app_settings` zum Briefkopf: Name und Logo der herausgebenden Einrichtung.
 *
 * Betrieb und Beispiel-PDF gehen hier durch dieselbe Methode – das Beispiel unterscheidet sich
 * nur in den `AppSettings`, die es mitbringt, nicht im Weg zur Logo-URL.
 */
export class DocumentOrganizationHelper {
  /** Das Logo geht unbeschnitten in den Briefkopf, deshalb die Original-Transformation. */
  public static readonly LOGO_TRANSFORM_OPTIONS = DirectusFilesAssetHelper.PRESET_FILE_TRANSFORMATION_IMAGE_ORIGINAL;

  /**
   * Löst `company_name` und `company_image` zu Name und Bild-URL auf.
   *
   * Beide Felder dürfen leer sein – dann bleibt das jeweilige Ergebnis `null` und der Aufrufer
   * entscheidet über den Rückfall (siehe `FormPdfDocumentHelper.resolveOrganization`).
   */
  public static resolveDocumentOrganization(appSettings: Partial<DatabaseTypes.AppSettings> | null | undefined, myDatabaseTestableHelperInterface: MyDatabaseTestableHelperInterface): DocumentOrganization {
    const companyImage = appSettings?.company_image;
    let logoUrl: string | null = null;
    if (companyImage) {
      logoUrl = DirectusFilesAssetHelper.getDirectAssetUrlByObjectOrId(companyImage, myDatabaseTestableHelperInterface, DocumentOrganizationHelper.LOGO_TRANSFORM_OPTIONS);
    }
    return {
      name: appSettings?.company_name || null,
      logoUrl: logoUrl,
    };
  }
}
