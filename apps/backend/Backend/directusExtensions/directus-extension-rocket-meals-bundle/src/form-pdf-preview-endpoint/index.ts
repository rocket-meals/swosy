/**
 * form-pdf-preview-endpoint – gibt einen Vorgang als PDF zurück, ohne ihn zu verschicken.
 *
 * `POST /form-pdf-preview` mit `{ "form_submission_id": "…" }` antwortet mit dem Dokument zu
 * diesem Vorgang. Gebaut wird es von derselben Methode, die auch der Mailversand aufruft
 * (`FormHelper.generatePdfFromForm` über `forms-sync-hook`), aus denselben gespeicherten
 * Antworten – die Vorschau zeigt also das Blatt, das später an der Mail hängt, und nicht eine
 * zweite Wahrheit daneben.
 *
 * Gezeigt wird der **gespeicherte** Stand des Vorgangs: Wer im Formular noch tippt, sieht seine
 * Eingaben erst nach dem Speichern. Gespeichert wird beim Erzeugen nichts, das PDF entsteht für
 * diese eine Antwort.
 *
 * Gelesen wird mit den Rechten des Anfragenden: Vorgang, Formular, Antworten und Felder gehen
 * durch Directus' Berechtigungen. Gesetzt wird das PDF danach wie beim Versand mit den Rechten
 * des Servers – der Browser, der es setzt, muss die Bilder der Installation laden können.
 */

import { defineEndpoint } from '@directus/extensions-sdk';
import { Accountability, Query } from '@directus/types';
import { CollectionNames, DatabaseTypes, StringHelper } from 'repo-depkit-common';
import { ApiContext } from '../helpers/ApiContext';
import { ContentTranslationHelper } from '../helpers/ContentTranslationHelper';
import { FormHelper } from '../helpers/form/FormHelper';
import { FormPdfDocumentHelper } from '../helpers/form/FormPdfDocumentHelper';
import { buildSortedFormAnswersForExtract, FormExtractFormAnswer, resolveFormIdFromFormSubmission } from '../forms-sync-hook';
import { ItemsService } from '../helpers/ItemsServiceCreator';
import { MyDatabaseHelper } from '../helpers/MyDatabaseHelper';

const ENDPOINT_ID = 'form-pdf-preview';

/** `user_updated` wird aufgelöst, damit „Zuletzt bearbeitet von" im Dokument einen Namen zeigt. */
const FIELDS_FOR_FORM_SUBMISSION = ['*', 'user_updated.id', 'user_updated.first_name', 'user_updated.last_name', 'user_updated.email'];

/** So liest auch der Mailversand die Antworten – nur damit sind Bilder und Anhänge aufgelöst. */
const FIELDS_FOR_FORM_ANSWERS = ['*', 'value_image.*', 'value_files.*'];

/**
 * Ein Items-Service mit den Rechten des Anfragenden – nicht mit denen des Servers.
 *
 * Die `ItemsServiceHelper` des Bundles arbeiten bewusst als Administrator, weil Hooks und
 * Schedules niemandem gehören. Diese Route gehört einem Nutzer, deshalb liest sie als dieser
 * Nutzer: Directus wirft von selbst, wenn er den Vorgang nicht sehen darf.
 */
async function getItemsServiceForAccountability<T>(apiContext: ApiContext, accountability: Accountability, collection: CollectionNames): Promise<ItemsService<T>> {
  const { ItemsService: ItemsServiceClass } = apiContext.services;
  const schema = await apiContext.getSchema();
  return new ItemsServiceClass(collection, {
    accountability: accountability,
    knex: apiContext.database,
    schema: schema,
  });
}

/**
 * Der Dateiname, unter dem der Browser das PDF anbietet – aus dem Titel des Dokuments.
 *
 * Nur Buchstaben und Ziffern aus ASCII bleiben stehen: `Content-Disposition` trägt nur ASCII,
 * ein „Übergabeprotokoll" käme sonst als Bytesalat beim Nutzer an.
 */
function getPdfFileName(form: DatabaseTypes.Forms): string {
  const documentTitle = FormPdfDocumentHelper.getDocumentTitle(form);
  const sanitizedTitle = StringHelper.replaceAllWithOptions({ str: documentTitle, find: String.raw`[^A-Za-z0-9]+`, replace: '_' });
  const trimmedTitle = StringHelper.replaceAllWithOptions({ str: sanitizedTitle, find: String.raw`^_+|_+$`, replace: '' });
  return `${trimmedTitle || 'form'}.pdf`;
}

export default defineEndpoint({
  id: ENDPOINT_ID,
  handler: (router, apiContext: ApiContext) => {
    router.post('/', async (req: any, res: any) => {
      const accountability = req?.accountability as Accountability | undefined;
      if (!accountability?.user) {
        return res.status(401).json({ error: 'Authentication required.' });
      }

      const form_submission_id = typeof req.body?.form_submission_id === 'string' ? req.body.form_submission_id.trim() : '';
      if (!form_submission_id) {
        return res.status(400).json({ error: 'The field form_submission_id is required.' });
      }

      try {
        const formSubmissionsService = await getItemsServiceForAccountability<DatabaseTypes.FormSubmissions>(apiContext, accountability, CollectionNames.FORM_SUBMISSIONS);
        const formSubmission = await formSubmissionsService.readOne(form_submission_id, { fields: FIELDS_FOR_FORM_SUBMISSION });
        const form_id = resolveFormIdFromFormSubmission(formSubmission);

        const formsService = await getItemsServiceForAccountability<DatabaseTypes.Forms>(apiContext, accountability, CollectionNames.FORMS);
        const form = await formsService.readOne(form_id, ContentTranslationHelper.QUERY_FIELDS_FOR_ALL_FIELDS_AND_FOR_TRANSLATION_FETCHING as Query);

        const formAnswersService = await getItemsServiceForAccountability<DatabaseTypes.FormAnswers>(apiContext, accountability, CollectionNames.FORM_ANSWERS);
        const formAnswers = (await formAnswersService.readByQuery({
          filter: { form_submission: { _eq: form_submission_id } },
          limit: -1,
          fields: FIELDS_FOR_FORM_ANSWERS,
        })) as unknown as FormExtractFormAnswer[];

        const formFieldsService = await getItemsServiceForAccountability<DatabaseTypes.FormFields>(apiContext, accountability, CollectionNames.FORM_FIELDS);
        const formFields = await formFieldsService.readByQuery({
          filter: { form: { _eq: form_id } },
          limit: -1,
          ...ContentTranslationHelper.QUERY_FIELDS_FOR_ALL_FIELDS_AND_FOR_TRANSLATION_FETCHING,
        } as Query);

        // Ein Feld, das erst nach dieser Einreichung ins Formular kam, hat hier keine Antwort.
        // Es wird übergangen, statt die Vorschau daran scheitern zu lassen.
        const answeredFormFieldIds = new Set(formAnswers.map(formAnswer => formAnswer.form_field));
        const formFieldsWithAnswer = formFields.filter(formField => answeredFormFieldIds.has(formField.id));

        const formExtractRelevantInformation = buildSortedFormAnswersForExtract(formFieldsWithAnswer, formAnswers);

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
        // Eine Vorschau gilt nur für den Stand, den der Vorgang gerade hat.
        res.set('Cache-Control', 'no-store');
        return res.send(pdfBuffer);
      } catch (error: any) {
        const status = error?.status ?? error?.statusCode;
        if (status === 403 || error?.code === 'FORBIDDEN') {
          return res.status(403).json({ error: 'The form submission is not readable for this user.' });
        }
        if (status === 404 || error?.code === 'ROUTE_NOT_FOUND') {
          return res.status(404).json({ error: 'Form submission not found: ' + form_submission_id });
        }
        console.error(ENDPOINT_ID + ': could not generate the form pdf for submission ' + form_submission_id + ': ' + error);
        console.error(error);
        return res.status(500).json({ error: 'Could not generate the form pdf.' });
      }
    });
  },
});
