/**
 * form-pdf-preview-endpoint – zeigt ein Formular so, wie es gedruckt aussehen wird.
 *
 * `POST /form-pdf-preview` bekommt das Formular und die Werte, die gerade in der App stehen,
 * und antwortet mit dem fertigen PDF. Nichts davon wird gespeichert: das Dokument entsteht für
 * diese eine Antwort und ist danach wieder weg. Beim Versand einer Einreichung baut
 * `forms-sync-hook` dasselbe Dokument – dieselbe Vorlage, dieselben Regeln –, hängt es aber an
 * eine Mail.
 *
 * Anfrage:
 * ```
 * {
 *   "form_id": "…",                 // Pflicht: welches Formular gedruckt wird
 *   "form_submission_id": "…",      // optional: Vorgangskennung und Datum im Kopf
 *   "answers": [                     // optional: die Werte; ein Feld ohne Wert bleibt leer
 *     { "form_field": "…", "value_string": "Mustermann" },
 *     { "form_field": "…", "value_boolean": true },
 *     { "form_field": "…", "value_image": "data:image/png;base64,…" }
 *   ]
 * }
 * ```
 *
 * Gelesen wird mit den Rechten des Anfragenden: Formular, Felder und Vorgang gehen durch
 * Directus' Berechtigungen. Wer das Formular nicht lesen darf, bekommt auch keine Vorschau
 * davon. Erzeugt wird das PDF danach wie beim Versand mit den Rechten des Servers – der
 * Browser, der es setzt, muss die Bilder der Installation laden können.
 */

import { defineEndpoint } from '@directus/extensions-sdk';
import { Accountability, Query } from '@directus/types';
import { CollectionNames, DatabaseTypes, StringHelper } from 'repo-depkit-common';
import { ApiContext } from '../helpers/ApiContext';
import { ContentTranslationHelper } from '../helpers/ContentTranslationHelper';
import { FormHelper } from '../helpers/form/FormHelper';
import { FormPdfDocumentHelper } from '../helpers/form/FormPdfDocumentHelper';
import { FormPdfPreviewBadRequestError, FormPdfPreviewHelper } from '../helpers/form/FormPdfPreviewHelper';
import { ItemsService } from '../helpers/ItemsServiceCreator';
import { MyDatabaseHelper } from '../helpers/MyDatabaseHelper';

const ENDPOINT_ID = 'form-pdf-preview';

/**
 * Ein Items-Service mit den Rechten des Anfragenden – nicht mit denen des Servers.
 *
 * Die `ItemsServiceHelper` des Bundles arbeiten bewusst als Administrator, weil Hooks und
 * Schedules niemandem gehören. Diese Route gehört einem Nutzer, deshalb liest sie als dieser
 * Nutzer: Directus wirft von selbst, wenn er das Formular nicht sehen darf.
 */
async function getItemsServiceForAccountability<T>(apiContext: ApiContext, accountability: Accountability | null | undefined, collection: CollectionNames): Promise<ItemsService<T>> {
  const { ItemsService: ItemsServiceClass } = apiContext.services;
  const schema = await apiContext.getSchema();
  return new ItemsServiceClass(collection, {
    accountability: accountability ?? null,
    knex: apiContext.database,
    schema: schema,
  });
}

/**
 * Der Dateiname, unter dem der Browser das PDF anbietet – aus dem Titel des Dokuments.
 *
 * Nur Buchstaben und Ziffern aus ASCII bleiben stehen: `Content-Disposition` trägt nur
 * ASCII, ein „Übergabeprotokoll" käme sonst als Bytesalat beim Nutzer an.
 */
function getPdfFileName(form: DatabaseTypes.Forms): string {
  const documentTitle = FormPdfDocumentHelper.getDocumentTitle(form);
  const sanitizedTitle = StringHelper.replaceAllWithOptions({ str: documentTitle, find: String.raw`[^A-Za-z0-9]+`, replace: '_' });
  const trimmedTitle = StringHelper.replaceAllWithOptions({ str: sanitizedTitle, find: String.raw`^_+|_+$`, replace: '' });
  return `${trimmedTitle || 'form'}.pdf`;
}

/**
 * Der Vorgang, dessen Kennung im Kopf steht – oder nichts.
 *
 * Eine Vorschau ohne Vorgang ist zulässig (ein Formular, das noch niemand eingereicht hat),
 * deshalb ist eine nicht lesbare Einreichung hier kein Fehler: der Kopf bleibt dann leer.
 */
async function readFormSubmissionForHeader(apiContext: ApiContext, accountability: Accountability | null | undefined, form_submission_id: string | null): Promise<DatabaseTypes.FormSubmissions | undefined> {
  if (!form_submission_id) {
    return undefined;
  }
  try {
    const formSubmissionsService = await getItemsServiceForAccountability<DatabaseTypes.FormSubmissions>(apiContext, accountability, CollectionNames.FORM_SUBMISSIONS);
    // `user_updated` wird aufgelöst, damit „Zuletzt bearbeitet von" einen Namen zeigt.
    return await formSubmissionsService.readOne(form_submission_id, {
      fields: ['*', 'user_updated.id', 'user_updated.first_name', 'user_updated.last_name', 'user_updated.email'],
    });
  } catch (error) {
    console.log(ENDPOINT_ID + ': form submission not readable for the requesting user, rendering without it: ' + error);
    return undefined;
  }
}

export default defineEndpoint({
  id: ENDPOINT_ID,
  handler: (router, apiContext: ApiContext) => {
    router.post('/', async (req: any, res: any) => {
      const accountability = req?.accountability as Accountability | undefined;
      if (!accountability?.user) {
        return res.status(401).json({ error: 'Authentication required.' });
      }

      let previewRequest;
      try {
        previewRequest = FormPdfPreviewHelper.parseRequest(req.body);
      } catch (error: any) {
        if (error instanceof FormPdfPreviewBadRequestError) {
          return res.status(400).json({ error: error.message });
        }
        throw error;
      }

      try {
        const formsService = await getItemsServiceForAccountability<DatabaseTypes.Forms>(apiContext, accountability, CollectionNames.FORMS);
        const form = await formsService.readOne(previewRequest.form_id, ContentTranslationHelper.QUERY_FIELDS_FOR_ALL_FIELDS_AND_FOR_TRANSLATION_FETCHING as Query);

        const formFieldsService = await getItemsServiceForAccountability<DatabaseTypes.FormFields>(apiContext, accountability, CollectionNames.FORM_FIELDS);
        const formFields = await formFieldsService.readByQuery({
          filter: { form: { _eq: previewRequest.form_id } },
          limit: -1,
          ...ContentTranslationHelper.QUERY_FIELDS_FOR_ALL_FIELDS_AND_FOR_TRANSLATION_FETCHING,
        } as Query);

        const formSubmission = await readFormSubmissionForHeader(apiContext, accountability, previewRequest.form_submission_id);

        const formExtractRelevantInformation = FormPdfPreviewHelper.buildFormExtractRelevantInformation(formFields, previewRequest.answers);

        // Der interne Server-Modus, weil Traefik die Anfragen des PDF-Browsers nach außen nicht
        // zurückroutet – dieselbe Begründung wie beim Versand einer Einreichung.
        const myDatabaseHelper = new MyDatabaseHelper(apiContext).cloneWithInternalServerMode();
        const pdfBuffer = await FormHelper.generatePdfFromForm({
          form,
          formExtractRelevantInformation,
          myDatabaseHelperInterface: myDatabaseHelper,
          formSubmission,
        });

        res.set('Content-Type', 'application/pdf');
        res.set('Content-Disposition', `inline; filename="${getPdfFileName(form)}"`);
        // Eine Vorschau ist nur für den Stand gültig, der gerade geschickt wurde.
        res.set('Cache-Control', 'no-store');
        return res.send(pdfBuffer);
      } catch (error: any) {
        const status = error?.status ?? error?.statusCode;
        if (status === 403 || error?.code === 'FORBIDDEN') {
          return res.status(403).json({ error: 'The form is not readable for this user.' });
        }
        if (status === 404 || error?.code === 'ROUTE_NOT_FOUND' || error?.message?.includes('does not exist')) {
          return res.status(404).json({ error: 'Form not found: ' + previewRequest.form_id });
        }
        console.error(ENDPOINT_ID + ': could not generate the form pdf preview: ' + error);
        console.error(error);
        return res.status(500).json({ error: 'Could not generate the form pdf preview.' });
      }
    });
  },
});
