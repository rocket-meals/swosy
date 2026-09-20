// Jest test: convert forms_export.json forms to PDFs with auto-filled example data
//
// Das Formular kommt unverändert aus `forms_export.json` – der Export ist die Vorlage des Kunden
// und wird hier nur gelesen. Alles, was ein echtes Protokoll ausmacht, legt dieser Test darüber:
// Beispielwerte passend zum Alias des Feldes, Beispiel-Übersetzungen für Beschriftung und
// Kleingedrucktes, und einen Beispiel-Vorgang. So zeigen die erzeugten PDFs, wie der Ausdruck
// beim Kunden aussieht – mit Musterdaten, nie mit echten Personendaten.
import { describe, expect, it } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import { TestArtifacts } from '../../../../TestArtifacts';
import { FormHelper } from '../../../FormHelper';
import { PdfGeneratorForJest } from '../../../../pdf/PdfGeneratorHelperForJest';
import { MyDatabaseTestableHelper } from '../../../../MyDatabaseHelperInterface';
import { DatabaseTypes, FormHelperCommon, StringHelper } from 'repo-depkit-common';
import { FormExtractFormAnswer, FormExtractFormAnswerValueFileSingleOrString, FormExtractRelevantInformation, FormExtractRelevantInformationSingle } from '../../../../../forms-sync-hook';

PdfGeneratorForJest.activateForJest();

// ── Example fill values ──────────────────────────────────────────────────────

const EXAMPLE_LANGUAGE_CODE = 'de-DE';

const EXAMPLE_MULTILINE = 'Kratzer im Linoleum vor dem Schreibtisch (ca. 20 cm). Duschvorhang fehlt. Fensterdichtung im Zimmer porös, bitte vor Neuvermietung erneuern.';
const EXAMPLE_EMAIL = 'max.mustermann@example.com';
const EXAMPLE_IBAN = 'DE89370400440532013000';
const EXAMPLE_BIC = 'DEUTDEDBXXX';
const EXAMPLE_NUMBER = 1380.5;
const EXAMPLE_DATE = '2023-11-27T00:00:00.000Z'; // 27.11.2023
const EXAMPLE_STRING_FALLBACK = 'Mustereintrag';
// EXAMPLE_DROPDOWN is resolved dynamically from dropdown_values; this is the fallback
const EXAMPLE_DROPDOWN_FALLBACK = 'keine';

/**
 * Beispielwerte je Feld-Alias – ein Protokoll, das man lesen kann, statt überall derselbe Name.
 * Die Werte sind an den gedruckten Vordruck angelehnt und frei erfunden.
 */
const EXAMPLE_VALUES_BY_ALIAS: Readonly<Record<string, string>> = {
  'Mieter: Nummer': '188030',
  VONUMMER: 'VO-2023-4711',
  Wohnheimnummer: '07',
  Wohnheim: 'Dorotheenstr. 5 - 7',
  'Zimmer / Whg-Nummer': 'Zimmer in 7er WG Nr. 42-7',
  'Mieter: Vorname': 'Max',
  'Mieter: Nachname': 'Mustermann',
  'Mieter: Geburts Datum': '14.03.1999',
  'Mieter: Telefon/Mobil': '0172 3458247',
  'Mieter: Adresse (neu)': 'Musterweg 12\n30159 Musterstadt',
  'Adresse (Heimat)': 'Am Beispielberg 3\n38100 Musterhausen',
};

/** Datumswerte je Alias, damit Mietende und Auszug nicht auf denselben Tag fallen. */
const EXAMPLE_DATES_BY_ALIAS: Readonly<Record<string, string>> = {
  Mietbeginn: '2021-10-01T00:00:00.000Z',
  Mietende: '2024-02-29T00:00:00.000Z',
  Auszugsdatum: '2023-11-27T00:00:00.000Z',
  'Verfügbar Ab -1 (Auszugsdatum)': '2023-11-28T00:00:00.000Z',
};

/** Ankreuzfelder je Alias – ein Protokoll, in dem beide Antworten vorkommen. */
const EXAMPLE_BOOLEANS_BY_ALIAS: Readonly<Record<string, boolean>> = {
  'Übergabe persönlich?': true,
  'Mängelfrei?': false,
};

/**
 * Beispiel-Übersetzungen: die Beschriftung, die der Mieter auch in der App liest, und das
 * Kleingedruckte darunter. Im Export stehen die Übersetzungen nur als Ids, deshalb setzt der
 * Test sie hier – ohne den Export selbst anzufassen.
 */
const EXAMPLE_TRANSLATIONS_BY_ALIAS: Readonly<Record<string, { name?: string; description?: string }>> = {
  'Mieter: Telefon/Mobil': { description: '(nur, wenn abweichend von bisheriger Nummer)' },
  'Mieter: E-Mail Adresse': { description: '(nur, wenn abweichend von bisheriger E-Mail)' },
  'Mieter: Adresse (neu)': { name: 'Mieter: Neue Adresse', description: '(Anschrift, unter der wir nach dem Auszug erreichbar sind)' },
  Bankverbindung: { name: 'Bankverbindung für Kautionsrückzahlung', description: '(nur, wenn abweichend von bisheriger Bankverbindung)' },
  'Mängel: Reinigung': { description: '(Endreinigung wird bei Bedarf in Rechnung gestellt)' },
};

/** Untertitel und Name des Formulars, wie ihn eine gepflegte Übersetzung liefern würde. */
const EXAMPLE_FORM_DESCRIPTION = 'Protokoll über die Rückgabe des Wohnraums und die Abrechnung der Kaution.';

// Signature image as data URI (reuse existing test fixture)
const SIGNATURE_PNG_PATH = path.join(__dirname, '../../../__tests__/data/signature_handwritten_example.png');
const EXAMPLE_SIGNATURE_DATA_URI: string | null = fs.existsSync(SIGNATURE_PNG_PATH) ? `data:image/png;base64,${fs.readFileSync(SIGNATURE_PNG_PATH).toString('base64')}` : null;

// Photo URLs used for FILES_FILES fields — use larger images so they render clearly
const EXAMPLE_FILE_PHOTOS = ['https://picsum.photos/600/400', 'https://picsum.photos/601/400'];

// A small placeholder image URL for regular image fields
const EXAMPLE_IMAGE_URL: string = EXAMPLE_FILE_PHOTOS[0] ?? 'https://picsum.photos/600/400';

/** Der Beispiel-Vorgang: Kennung und Eingangsdatum stehen im Kopf des Dokuments. */
function buildExampleFormSubmission(form: DatabaseTypes.Forms): DatabaseTypes.FormSubmissions {
  return {
    alias: 'A-2023-000188',
    date_created: '2023-11-27T09:12:00.000Z',
    form: form.id,
    form_answers: [],
    id: `test-submission-${form.id}`,
    mails: [],
    status: 'published',
  } as unknown as DatabaseTypes.FormSubmissions;
}

// ── Helper: build a FormExtractRelevantInformationSingle from a raw form field ─

/** Übersetzungszeilen, wie Directus sie liefert, wenn die Relation mitgeladen wurde. */
function buildTranslationsForField(formField: DatabaseTypes.FormFields): unknown[] {
  const alias = formField.alias ?? '';
  const exampleTranslation = EXAMPLE_TRANSLATIONS_BY_ALIAS[alias];
  return [
    {
      id: `translation-${formField.id}`,
      languages_code: EXAMPLE_LANGUAGE_CODE,
      name: exampleTranslation?.name ?? alias,
      description: exampleTranslation?.description ?? null,
    },
  ];
}

function buildExtract(formField: DatabaseTypes.FormFields, submissionId: string, index: number, fillWithExampleValues = true): FormExtractRelevantInformationSingle {
  const ft = formField.field_type ?? '';
  const alias = formField.alias ?? '';
  const FT = FormHelperCommon.FORM_FIELD_TYPE;

  let value_string: string | null = null;
  let value_number: number | null = null;
  let value_boolean: boolean | null = null;
  let value_date: string | null = null;
  let value_image: string | null = null;
  let value_files: string[] = [];

  // Ein unausgefülltes Formular ist der zweite Fall, den das Layout können muss: es druckt die
  // Beschriftungen mit leeren Linien, statt die Zeilen wegzulassen.
  switch (fillWithExampleValues ? ft : '') {
    case FT.STRING:
    case FT.STRING_ADDRESS:
      value_string = EXAMPLE_VALUES_BY_ALIAS[alias] ?? EXAMPLE_STRING_FALLBACK;
      break;
    case FT.MULTILINE_TEXT:
      value_string = EXAMPLE_VALUES_BY_ALIAS[alias] ?? EXAMPLE_MULTILINE;
      break;
    case FT.DROPDOWN: {
      // Use the first option from dropdown_values if available, otherwise fall back
      const rawOptions = formField.dropdown_values;
      const options: string[] = Array.isArray(rawOptions) ? (rawOptions as string[]) : [];
      value_string = options[0] ?? EXAMPLE_DROPDOWN_FALLBACK;
      break;
    }
    case FT.STRING_EMAIL:
      value_string = EXAMPLE_EMAIL;
      break;
    case FT.STRING_BANK_ACCOUNT:
      value_string = EXAMPLE_IBAN;
      break;
    case FT.STRING_BIC:
      value_string = EXAMPLE_BIC;
      break;
    case FT.NUMBER:
      value_number = EXAMPLE_NUMBER;
      break;
    case FT.BOOLEAN_CHECKBOX:
      value_boolean = EXAMPLE_BOOLEANS_BY_ALIAS[alias] ?? false;
      break;
    case FT.DATE:
    case FT.DATE_HH_MM:
    case FT.DATE_TIMESTAMP:
    case FT.DATE_DATE_AND_HH_MM:
      value_date = EXAMPLE_DATES_BY_ALIAS[alias] ?? EXAMPLE_DATE;
      break;
    case FT.FILES_IMAGE_SIGNATURE:
      value_image = EXAMPLE_SIGNATURE_DATA_URI;
      break;
    case FT.FILES_IMAGE:
      value_image = EXAMPLE_IMAGE_URL;
      break;
    case FT.FILES_FILES:
      value_files = EXAMPLE_FILE_PHOTOS;
      break;
    default:
      break;
  }

  const formFieldWithTranslations: DatabaseTypes.FormFields = {
    ...formField,
    translations: buildTranslationsForField(formField) as DatabaseTypes.FormFields['translations'],
  };

  const answer: FormExtractFormAnswer = {
    date_created: '2023-11-27T09:12:00.000Z',
    date_updated: '2023-11-27T09:12:00.000Z',
    form_field: formField.id,
    form_submission: submissionId,
    id: `answer-${index}-${formField.id}`,
    sort: index,
    status: 'published',
    user_created: '1',
    user_updated: '1',
    value_boolean,
    value_custom: null,
    value_date,
    value_files: value_files as unknown as FormExtractFormAnswerValueFileSingleOrString[],
    value_image: value_image as unknown as DatabaseTypes.DirectusFiles | null,
    value_number,
    value_string,
    values: '',
  };

  return {
    form_field_id: formField.id,
    sort: index,
    form_field: formFieldWithTranslations,
    form_answer: answer,
  };
}

function buildFormExtract(form: DatabaseTypes.Forms, fillWithExampleValues = true): FormExtractRelevantInformation {
  const submissionId = `test-submission-${form.id}`;
  const fields: DatabaseTypes.FormFields[] = (form.form_fields ?? []) as DatabaseTypes.FormFields[];
  return fields.filter(ff => ff.status === 'published' && ff.is_visible_in_export !== false).map((ff, idx) => buildExtract(ff, submissionId, idx, fillWithExampleValues));
}

/** Das Formular mit einer Beispiel-Übersetzung, damit Titel und Untertitel daher kommen. */
function withExampleFormTranslations(form: DatabaseTypes.Forms): DatabaseTypes.Forms {
  return {
    ...form,
    translations: [
      {
        id: `translation-${form.id}`,
        languages_code: EXAMPLE_LANGUAGE_CODE,
        name: form.alias,
        description: EXAMPLE_FORM_DESCRIPTION,
      },
    ] as unknown as DatabaseTypes.Forms['translations'],
  };
}

// ── Tests ────────────────────────────────────────────────────────────────────

const FORMS_EXPORT_PATH = path.join(__dirname, '../reference_form/forms_export.json');

async function generatePdfsForAllForms(fillWithExampleValues: boolean, fileNameSuffix: string): Promise<void> {
  const raw = fs.readFileSync(FORMS_EXPORT_PATH, 'utf-8');
  const forms: DatabaseTypes.Forms[] = JSON.parse(raw);
  expect(forms.length).toBeGreaterThan(0);

  const myDatabaseHelper = new MyDatabaseTestableHelper();
  const requestOptions = {
    mockImageResolution: true,
    // Das Beispiel-Logo kommt aus dem Repository statt vom Server – sonst stünde im Briefkopf der graue Platzhalter.
    mockImageFilesByUrlPart: [MyDatabaseTestableHelper.getExampleOrganizationLogoMockImageFile()],
  };

  for (const rawForm of forms) {
    const form = withExampleFormTranslations(rawForm);
    const formExtract = buildFormExtract(form, fillWithExampleValues);
    const pdfBuffer = await FormHelper.generatePdfFromForm({
      form,
      formExtractRelevantInformation: formExtract,
      myDatabaseHelperInterface: myDatabaseHelper,
      // Ein leeres Formular wird gedruckt, bevor jemand es einreicht – dann gibt es keinen Vorgang.
      formSubmission: fillWithExampleValues ? buildExampleFormSubmission(form) : undefined,
      requestOptions,
    });
    expect(pdfBuffer).toBeTruthy();
    const safeName = StringHelper.replaceAllWithOptions({ str: form.alias ?? form.id ?? 'unknown', find: '[^a-z0-9_\\-]', replace: '_', flags: 'gi' });
    TestArtifacts.saveTestArtifact(pdfBuffer, `form/pdf/hannover/${safeName}${fileNameSuffix}.pdf`);
  }
}

describe('Hannover forms_export PDF Generator', () => {
  it('forms_export.json exists', () => {
    expect(fs.existsSync(FORMS_EXPORT_PATH)).toBe(true);
  });

  it('generates a PDF for every form in forms_export.json', async () => {
    await generatePdfsForAllForms(true, '');
  });

  it('generates a PDF for every form without any answers', async () => {
    await generatePdfsForAllForms(false, '_leer');
  });
});
