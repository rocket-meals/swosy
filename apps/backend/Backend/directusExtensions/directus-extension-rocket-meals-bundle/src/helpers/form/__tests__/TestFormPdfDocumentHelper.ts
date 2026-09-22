// Jest test: the content model behind templates/form-document.liquid
import { describe, expect, it } from '@jest/globals';
import { DatabaseTypes, FormHelperCommon } from 'repo-depkit-common';
import { FormPdfDocumentHelper } from '../FormPdfDocumentHelper';
import { MyDatabaseTestableHelper, MyDatabaseTestableHelperInterface } from '../../MyDatabaseHelperInterface';
import { FormExtractFormAnswer, FormExtractFormAnswerValueFileSingleOrString, FormExtractRelevantInformation, FormExtractRelevantInformationSingle } from '../../../forms-sync-hook';

const FIELD_TYPE = FormHelperCommon.FORM_FIELD_TYPE;

type AnswerValues = {
  value_string?: string | null;
  value_number?: number | null;
  value_boolean?: boolean | null;
  value_date?: string | null;
  value_image?: string | null;
  value_files?: string[];
};

/** Eine Übersetzungszeile, wie Directus sie liefert, wenn die Relation mitgeladen wurde. */
type ContentTranslation = {
  name?: string | null;
  description?: string | null;
};

function buildExtract(alias: string, fieldType: string, values: AnswerValues = {}, translation?: ContentTranslation): FormExtractRelevantInformationSingle {
  const formField = {
    alias,
    field_type: fieldType,
    export_settings: '',
    form_settings: '',
    import_settings: '',
    id: `field-${alias}`,
    status: 'published',
    translations: translation ? [{ id: `translation-${alias}`, languages_code: 'de-DE', name: translation.name ?? null, description: translation.description ?? null }] : [],
  } as unknown as DatabaseTypes.FormFields;

  const answer = {
    form_field: formField.id,
    form_submission: 'submission',
    id: `answer-${alias}`,
    sort: 0,
    status: 'published',
    value_boolean: values.value_boolean ?? null,
    value_custom: null,
    value_date: values.value_date ?? null,
    value_files: (values.value_files ?? []) as unknown as FormExtractFormAnswerValueFileSingleOrString[],
    value_image: values.value_image as unknown as DatabaseTypes.DirectusFiles | null,
    value_number: values.value_number ?? null,
    value_string: values.value_string ?? null,
    values: '',
  } as unknown as FormExtractFormAnswer;

  return { form_field_id: formField.id, sort: 0, form_field: formField, form_answer: answer };
}

async function buildDocument(formExtractRelevantInformation: FormExtractRelevantInformation, params?: { form?: DatabaseTypes.Forms; formSubmission?: DatabaseTypes.FormSubmissions; myDatabaseHelperInterface?: MyDatabaseTestableHelperInterface }) {
  return FormPdfDocumentHelper.buildFormDocument({
    form: params?.form ?? ({ id: 'form-id', alias: 'Übergabeprotokoll' } as unknown as DatabaseTypes.Forms),
    formExtractRelevantInformation,
    myDatabaseHelperInterface: params?.myDatabaseHelperInterface ?? new MyDatabaseTestableHelper(),
    formSubmission: params?.formSubmission,
  });
}

/** Eine Einreichung, die nur den letzten Bearbeiter und dessen Zeitpunkt beisteuert. */
function buildSubmissionWithLastEditor(userUpdated: unknown, dateUpdated?: string | null): DatabaseTypes.FormSubmissions {
  return {
    id: 'submission-id',
    alias: 'A-2023-000188',
    date_created: '2023-11-27T09:12:00.000Z',
    date_updated: dateUpdated === undefined ? '2023-11-29T14:35:00.000Z' : dateUpdated,
    user_updated: userUpdated,
  } as unknown as DatabaseTypes.FormSubmissions;
}

/** Eine Datenbank, die den Nutzer nicht hergibt – das Dokument muss trotzdem entstehen. */
class MyDatabaseHelperWithFailingUserLookup extends MyDatabaseTestableHelper {
  async getDocumentUserById(): Promise<never> {
    throw new Error('user service not reachable');
  }
}

describe('FormPdfDocumentHelper', () => {
  it('uses the form alias as document title', async () => {
    const document = await buildDocument([buildExtract('Wohnheim', FIELD_TYPE.STRING, { value_string: 'Dorotheenstr. 5' })]);
    expect(document.documentTitle).toBe('Übergabeprotokoll');
  });

  it('groups consecutive fields that share an alias prefix into one section', async () => {
    const document = await buildDocument([buildExtract('Wohnheim', FIELD_TYPE.STRING, { value_string: 'Dorotheenstr. 5' }), buildExtract('Mieter: Vorname', FIELD_TYPE.STRING, { value_string: 'Max' }), buildExtract('Mieter: Nachname', FIELD_TYPE.STRING, { value_string: 'Mustermann' })]);

    expect(document.sections).toHaveLength(2);
    expect(document.sections[0]?.title).toBeNull();
    expect(document.sections[0]?.rows.map(row => row.label)).toEqual(['Wohnheim']);
    expect(document.sections[1]?.title).toBe('Mieter');
    expect(document.sections[1]?.rows.map(row => row.label)).toEqual(['Vorname', 'Nachname']);
  });

  it('keeps the full label when a prefix is used by a single field only', async () => {
    const document = await buildDocument([buildExtract('Mieter: Nummer', FIELD_TYPE.STRING, { value_string: '188030' }), buildExtract('Wohnheim', FIELD_TYPE.STRING, { value_string: 'Dorotheenstr. 5' })]);

    expect(document.sections).toHaveLength(1);
    expect(document.sections[0]?.title).toBeNull();
    expect(document.sections[0]?.rows.map(row => row.label)).toEqual(['Mieter: Nummer', 'Wohnheim']);
  });

  it('keeps the order of the fields the form author defined', async () => {
    const document = await buildDocument([buildExtract('Mieter: Vorname', FIELD_TYPE.STRING, { value_string: 'Max' }), buildExtract('Mieter: Nachname', FIELD_TYPE.STRING, { value_string: 'Mustermann' }), buildExtract('Auszugsdatum', FIELD_TYPE.DATE, { value_date: '2000-01-01T00:00:00.000Z' }), buildExtract('Mieter: Telefon', FIELD_TYPE.STRING, { value_string: '0123' })]);

    const labelsInOrder = document.sections.flatMap(section => section.rows.map(row => row.label));
    expect(labelsInOrder).toEqual(['Vorname', 'Nachname', 'Auszugsdatum', 'Mieter: Telefon']);
  });

  it('prints a row for a field nobody filled in', async () => {
    const document = await buildDocument([buildExtract('Konto-Inhaber/in', FIELD_TYPE.STRING, { value_string: null })]);

    expect(document.sections[0]?.rows[0]).toMatchObject({ type: 'text', label: 'Konto-Inhaber/in', text: '' });
  });

  it('renders a checkbox for both answers of a boolean field', async () => {
    const document = await buildDocument([buildExtract('Mängelfrei?', FIELD_TYPE.BOOLEAN_CHECKBOX, { value_boolean: true }), buildExtract('Mieterbelastung', FIELD_TYPE.BOOLEAN_CHECKBOX, { value_boolean: false }), buildExtract('Unbeantwortet', FIELD_TYPE.BOOLEAN_CHECKBOX, { value_boolean: null })]);

    const rows = document.sections[0]?.rows ?? [];
    expect(rows[0]?.options?.map(option => option.checked)).toEqual([false, true]);
    expect(rows[1]?.options?.map(option => option.checked)).toEqual([true, false]);
    expect(rows[2]?.options?.map(option => option.checked)).toEqual([false, false]);
  });

  it('splits an IBAN into groups of four characters', async () => {
    const document = await buildDocument([buildExtract('Bankverbindung', FIELD_TYPE.STRING_BANK_ACCOUNT, { value_string: 'DE89 3704 0044 0532 0130 00' })]);

    const row = document.sections[0]?.rows[0];
    expect(row?.type).toBe('character_boxes');
    expect(row?.boxGroups).toEqual([
      ['D', 'E', '8', '9'],
      ['3', '7', '0', '4'],
      ['0', '0', '4', '4'],
      ['0', '5', '3', '2'],
      ['0', '1', '3', '0'],
      ['0', '0'],
    ]);
  });

  it('prints empty boxes when no bank details were given', async () => {
    const document = await buildDocument([buildExtract('IBAN', FIELD_TYPE.STRING_BANK_ACCOUNT, { value_string: null }), buildExtract('BIC', FIELD_TYPE.STRING_BIC, { value_string: null })]);

    const rows = document.sections[0]?.rows ?? [];
    const countBoxes = (boxGroups: string[][] | undefined) => (boxGroups ?? []).reduce((sum, group) => sum + group.length, 0);
    expect(countBoxes(rows[0]?.boxGroups)).toBe(22);
    expect(countBoxes(rows[1]?.boxGroups)).toBe(11);
    expect(rows[0]?.boxGroups?.[0]).toEqual(['', '', '', '']);
  });

  it('formats numbers in German notation and keeps prefix and suffix', async () => {
    const extract = buildExtract('Kaution', FIELD_TYPE.NUMBER, { value_number: 1380.5 });
    extract.form_field.value_prefix = '€ ';
    extract.form_field.value_suffix = ' brutto';

    const document = await buildDocument([extract]);
    expect(document.sections[0]?.rows[0]?.text).toBe('€ 1.380,50 brutto');
  });

  it('prefers the translated name over the alias and prints the description as a hint', async () => {
    const document = await buildDocument([buildExtract('Mieter: Telefon/Mobil', FIELD_TYPE.STRING, { value_string: '0172 3458247' }, { name: 'Mieter: Telefon/Mobil', description: '(nur, wenn abweichend von bisheriger Nummer)' }), buildExtract('Mieter: Nachname', FIELD_TYPE.STRING, { value_string: 'Mustermann' })]);

    const rows = document.sections[0]?.rows ?? [];
    expect(rows[0]).toMatchObject({ label: 'Telefon/Mobil', hint: '(nur, wenn abweichend von bisheriger Nummer)' });
    // Ohne Übersetzung bleibt der Alias die Beschriftung und es gibt kein Kleingedrucktes.
    expect(rows[1]).toMatchObject({ label: 'Nachname', hint: null });
  });

  it('takes title and subtitle from the translations of the form', async () => {
    const form = {
      id: 'form-id',
      alias: 'Übergabeprotokoll',
      translations: [{ id: 'form-translation', languages_code: 'de-DE', name: 'Abnahmeprotokoll', description: 'Protokoll über die Rückgabe des Wohnraums.' }],
    } as unknown as DatabaseTypes.Forms;

    const document = await buildDocument([buildExtract('Wohnheim', FIELD_TYPE.STRING, { value_string: 'Dorotheenstr. 5' })], { form });
    expect(document.documentTitle).toBe('Abnahmeprotokoll');
    expect(document.documentSubtitle).toBe('Protokoll über die Rückgabe des Wohnraums.');
  });

  it('shows reference and date of the submission, and nothing when there is none', async () => {
    const formSubmission = { id: 'submission-id', alias: 'A-2023-000188', date_created: '2023-11-27T09:12:00.000Z' } as unknown as DatabaseTypes.FormSubmissions;

    const documentWithSubmission = await buildDocument([buildExtract('Wohnheim', FIELD_TYPE.STRING, { value_string: 'Dorotheenstr. 5' })], { formSubmission });
    expect(documentWithSubmission.metaEntries.map(metaEntry => metaEntry.value)).toEqual(['A-2023-000188', '27.11.2023']);
    expect(documentWithSubmission.placeAndDateValue).toBe('27.11.2023');

    const documentWithoutSubmission = await buildDocument([buildExtract('Wohnheim', FIELD_TYPE.STRING, { value_string: 'Dorotheenstr. 5' })]);
    expect(documentWithoutSubmission.metaEntries).toEqual([]);
    expect(documentWithoutSubmission.placeAndDateValue).toBe('');
  });

  it('names the last editor of the submission and when they edited it', async () => {
    const formSubmission = buildSubmissionWithLastEditor({ first_name: 'Ulrike', last_name: 'Wohnheimer', email: 'wohnheimleitung@example.com' });

    const document = await buildDocument([buildExtract('Wohnheim', FIELD_TYPE.STRING, { value_string: 'Dorotheenstr. 5' })], { formSubmission });

    expect(document.lastEdited).toEqual({
      label: 'Zuletzt bearbeitet von',
      name: 'Ulrike Wohnheimer',
      dateLabel: 'Zuletzt bearbeitet am',
      date: '29.11.2023',
    });
  });

  it('loads the last editor when the submission only carries the user id', async () => {
    const formSubmission = buildSubmissionWithLastEditor(MyDatabaseTestableHelper.EXAMPLE_DOCUMENT_USER_ID);

    const document = await buildDocument([buildExtract('Wohnheim', FIELD_TYPE.STRING, { value_string: 'Dorotheenstr. 5' })], { formSubmission });

    expect(document.lastEdited?.name).toBe('Ulrike Wohnheimer');
  });

  it('falls back to the email address when the last editor has no name', async () => {
    const formSubmission = buildSubmissionWithLastEditor({ first_name: null, last_name: '  ', email: 'wohnheimleitung@example.com' });

    const document = await buildDocument([buildExtract('Wohnheim', FIELD_TYPE.STRING, { value_string: 'Dorotheenstr. 5' })], { formSubmission });

    expect(document.lastEdited?.name).toBe('wohnheimleitung@example.com');
  });

  it('leaves the date empty when the submission was never updated', async () => {
    const formSubmission = buildSubmissionWithLastEditor({ first_name: 'Ulrike', last_name: 'Wohnheimer' }, null);

    const document = await buildDocument([buildExtract('Wohnheim', FIELD_TYPE.STRING, { value_string: 'Dorotheenstr. 5' })], { formSubmission });

    expect(document.lastEdited?.name).toBe('Ulrike Wohnheimer');
    expect(document.lastEdited?.date).toBe('');
  });

  it('shows no editor line without a submission, without a user or with an unknown user', async () => {
    const rows = [buildExtract('Wohnheim', FIELD_TYPE.STRING, { value_string: 'Dorotheenstr. 5' })];

    expect((await buildDocument(rows)).lastEdited).toBeNull();
    expect((await buildDocument(rows, { formSubmission: buildSubmissionWithLastEditor(null) })).lastEdited).toBeNull();
    // Eine Id, die es nicht mehr gibt, und ein Nutzer ganz ohne Namen und E-Mail-Adresse.
    expect((await buildDocument(rows, { formSubmission: buildSubmissionWithLastEditor('deleted-user-id') })).lastEdited).toBeNull();
    expect((await buildDocument(rows, { formSubmission: buildSubmissionWithLastEditor({ first_name: null, last_name: null, email: null }) })).lastEdited).toBeNull();
  });

  it('still builds the document when the last editor cannot be read', async () => {
    const formSubmission = buildSubmissionWithLastEditor(MyDatabaseTestableHelper.EXAMPLE_DOCUMENT_USER_ID);

    const document = await buildDocument([buildExtract('Wohnheim', FIELD_TYPE.STRING, { value_string: 'Dorotheenstr. 5' })], { formSubmission, myDatabaseHelperInterface: new MyDatabaseHelperWithFailingUserLookup() });

    expect(document.lastEdited).toBeNull();
    expect(document.sections[0]?.rows[0]?.text).toBe('Dorotheenstr. 5');
  });

  it('puts the logo into the letterhead and the issuer into the footer name', async () => {
    const document = await buildDocument([buildExtract('Wohnheim', FIELD_TYPE.STRING, { value_string: 'Dorotheenstr. 5' })]);

    // Der Name kommt aus der Server-Info, hier aus deren `project_name` - im Briefkopf steht er
    // nicht, die Fußzeile setzt ihn vor den Formulartitel.
    expect(document.organizationName).toBe('Rocket Meals');
    // Das Beispiel-Logo laeuft ueber dieselbe Asset-URL wie im Betrieb, nicht ueber einen Data-URI.
    expect(document.organizationLogoUrl).toContain(`/assets/${MyDatabaseTestableHelper.EXAMPLE_COMPANY_IMAGE_FILE_ID}`);
  });

  it('puts signatures and photos into their own areas instead of the field list', async () => {
    const document = await buildDocument([buildExtract('Zimmer', FIELD_TYPE.STRING, { value_string: '42-7' }), buildExtract('Unterschrift Heimleitung', FIELD_TYPE.FILES_IMAGE_SIGNATURE, { value_image: 'https://example.com/signature.png' }), buildExtract('Unterschrift Mieter/in', FIELD_TYPE.FILES_IMAGE_SIGNATURE, { value_image: null }), buildExtract('Mängel: Fotos', FIELD_TYPE.FILES_FILES, { value_files: ['https://example.com/a.jpg', 'https://example.com/b.jpg'] })]);

    expect(document.sections.flatMap(section => section.rows).map(row => row.label)).toEqual(['Zimmer']);
    expect(document.signatures).toEqual([
      { label: 'Unterschrift Heimleitung', imageUrl: 'https://example.com/signature.png' },
      { label: 'Unterschrift Mieter/in', imageUrl: null },
    ]);
    expect(document.attachments).toEqual([
      { label: 'Mängel: Fotos (1/2)', imageUrl: 'https://example.com/a.jpg' },
      { label: 'Mängel: Fotos (2/2)', imageUrl: 'https://example.com/b.jpg' },
    ]);
  });
});
