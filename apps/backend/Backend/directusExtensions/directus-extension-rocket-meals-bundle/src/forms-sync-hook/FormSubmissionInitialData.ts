import { DatabaseTypes } from 'repo-depkit-common';
import { FormAnswersValueFieldKeys, FormImportSyncFormSubmissions, KeyOfFormAnswersValueFieldsType } from './FormImportTypes';

/**
 * Was beim Anlegen eines Entwurfs (z. B. eines Abnahmeprotokolls) in `form_submissions.data` landet.
 *
 * Der Entwurf wird aus einer externen Quelle erzeugt (in Hannover aus dem TL1-CSV-Export der
 * Mietverhaeltnisse). Sobald jemand das Protokoll ausfuellt, ueberschreiben die Antworten in
 * `form_answers` die importierten Werte, und die Quelldatei ist beim naechsten Export schon wieder
 * eine andere. Damit spaeter nachvollziehbar bleibt, **womit** ein Vorgang angelegt wurde, wird der
 * Zustand beim Anlegen hier einmal als JSON festgehalten.
 *
 * Das Feld ist eine Momentaufnahme und wird danach nie wieder angefasst: `syncFormSubmission`
 * schreibt es nur im Erstellungsfall, ein bereits vorhandener Vorgang bleibt unveraendert.
 */
export const FORM_SUBMISSION_INITIAL_DATA_VERSION = 1;

/** Die gesetzten `value_*`-Felder einer importierten Antwort. */
export type FormSubmissionInitialDataAnswerValues = {
  [key in KeyOfFormAnswersValueFieldsType]?: unknown;
};

export type FormSubmissionInitialDataAnswer = {
  /** Die Kennung, ueber die der Import das Formularfeld sucht. */
  external_import_id: string;
  /**
   * Das getroffene Formularfeld – oder `null`, wenn es zu dieser `external_import_id` kein Feld gab.
   * `null` heisst also: dieser Wert lag zwar vor, wurde aber nicht als Antwort angelegt.
   */
  form_field: string | null;
  /** Der Alias des getroffenen Formularfeldes, damit die Kennung ohne DB-Blick lesbar bleibt. */
  form_field_alias: string | null;
  values: FormSubmissionInitialDataAnswerValues;
};

export type FormSubmissionInitialData = {
  /** Schema-Version, damit spaetere Leser alte Eintraege erkennen. */
  version: number;
  /** Zeitpunkt, zu dem der Entwurf angelegt wurde. */
  date_created: string;
  /** Der Workflow, der den Entwurf angelegt hat. */
  workflow_id: string;
  form: string;
  form_internal_custom_id: string | null;
  internal_custom_id: string;
  alias: string | null;
  /** Der unveraenderte Datensatz aus der Quelle, aus dem die Antworten entstanden sind. */
  source: unknown;
  /** Alle importierten Werte – auch die, fuer die kein Formularfeld existiert. */
  form_answers: FormSubmissionInitialDataAnswer[];
};

/** Liest die gesetzten `value_*`-Felder einer importierten Antwort heraus. */
function extractFormAnswerValues(formAnswer: Partial<DatabaseTypes.FormAnswers>): FormSubmissionInitialDataAnswerValues {
  let values: FormSubmissionInitialDataAnswerValues = {};
  for (let valueFieldKey of Object.values(FormAnswersValueFieldKeys)) {
    let value = formAnswer[valueFieldKey];
    if (value !== undefined) {
      values[valueFieldKey] = value;
    }
  }
  return values;
}

/**
 * Baut die Momentaufnahme, die beim Anlegen eines Entwurfs in `form_submissions.data` geschrieben wird.
 */
export function buildFormSubmissionInitialData(params: { workflowId: string; form: DatabaseTypes.Forms; formSubmission: FormImportSyncFormSubmissions; dictFormFieldExternalImportIdToFormField: { [key: string]: DatabaseTypes.FormFields } }): FormSubmissionInitialData {
  let { workflowId, form, formSubmission, dictFormFieldExternalImportIdToFormField } = params;

  let answers: FormSubmissionInitialDataAnswer[] = [];
  for (let passedFormAnswer of formSubmission.form_answers) {
    let formField = dictFormFieldExternalImportIdToFormField[passedFormAnswer.external_import_id];
    answers.push({
      external_import_id: passedFormAnswer.external_import_id,
      form_field: formField?.id ?? null,
      form_field_alias: formField?.alias ?? null,
      values: extractFormAnswerValues(passedFormAnswer),
    });
  }

  return {
    version: FORM_SUBMISSION_INITIAL_DATA_VERSION,
    date_created: new Date().toISOString(),
    workflow_id: workflowId,
    form: form.id,
    form_internal_custom_id: form.internal_custom_id ?? null,
    internal_custom_id: formSubmission.internal_custom_id,
    alias: formSubmission.alias ?? null,
    source: formSubmission.source ?? null,
    form_answers: answers,
  };
}
