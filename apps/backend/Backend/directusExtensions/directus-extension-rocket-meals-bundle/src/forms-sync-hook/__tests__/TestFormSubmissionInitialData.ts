import { describe, expect, it } from '@jest/globals';
import { DatabaseTypes } from 'repo-depkit-common';
import { buildFormSubmissionInitialData, FORM_SUBMISSION_INITIAL_DATA_VERSION } from '../FormSubmissionInitialData';
import { FormImportSyncFormSubmissions } from '../FormImportTypes';

const form = {
  id: 'form-id',
  internal_custom_id: 'housing-contract-sync-hannover',
} as DatabaseTypes.Forms;

/** Ein Formularfeld, wie es der Import ueber `external_import_id` findet. */
function buildFormField(values: Partial<DatabaseTypes.FormFields>): DatabaseTypes.FormFields {
  return values as DatabaseTypes.FormFields;
}

const formFieldByExternalImportId = {
  NAME: buildFormField({ id: 'field-name', alias: 'Nachname', external_import_id: 'NAME' }),
  MIETENDE: buildFormField({ id: 'field-mietende', alias: 'Mietende', external_import_id: 'MIETENDE' }),
};

const formSubmission: FormImportSyncFormSubmissions = {
  internal_custom_id: 'housing-contract-sync-hannover-420-01-05-51-6',
  alias: 'Dorotheenstraße/Zimmer 51-6 - Mustermann, Max',
  source: { NAME: 'Mustermann', MIETENDE: '2025-05-31T00:00:00.000Z', TELEFONMOBIL: '+49 123' },
  form_answers: [
    { external_import_id: 'NAME', value_string: 'Mustermann' },
    { external_import_id: 'MIETENDE', value_date: '2025-05-31T00:00:00.000Z' },
    { external_import_id: 'TELEFONMOBIL', value_string: '+49 123' },
  ],
};

function buildInitialData() {
  return buildFormSubmissionInitialData({
    workflowId: 'housing-contract-sync-hannover',
    form: form,
    formSubmission: formSubmission,
    dictFormFieldExternalImportIdToFormField: formFieldByExternalImportId,
  });
}

describe('Form Submission Initial Data', () => {
  it('keeps the untouched source record of the draft', () => {
    const initialData = buildInitialData();

    expect(initialData.source).toEqual(formSubmission.source);
    expect(initialData.internal_custom_id).toBe(formSubmission.internal_custom_id);
    expect(initialData.alias).toBe(formSubmission.alias);
    expect(initialData.form).toBe(form.id);
    expect(initialData.form_internal_custom_id).toBe(form.internal_custom_id);
    expect(initialData.workflow_id).toBe('housing-contract-sync-hannover');
    expect(initialData.version).toBe(FORM_SUBMISSION_INITIAL_DATA_VERSION);
    expect(typeof initialData.date_created).toBe('string');
  });

  it('records each imported value together with the form field it was written to', () => {
    const initialData = buildInitialData();

    expect(initialData.form_answers).toEqual([
      { external_import_id: 'NAME', form_field: 'field-name', form_field_alias: 'Nachname', values: { value_string: 'Mustermann' } },
      { external_import_id: 'MIETENDE', form_field: 'field-mietende', form_field_alias: 'Mietende', values: { value_date: '2025-05-31T00:00:00.000Z' } },
      // Kein Formularfeld mit dieser Kennung: der Wert lag vor, wurde aber nicht als Antwort angelegt.
      { external_import_id: 'TELEFONMOBIL', form_field: null, form_field_alias: null, values: { value_string: '+49 123' } },
    ]);
  });

  it('survives JSON serialization, because that is how it is stored', () => {
    const initialData = buildInitialData();

    expect(JSON.parse(JSON.stringify(initialData))).toEqual(initialData);
  });

  it('falls back to null when the draft carries no alias and no source', () => {
    const initialData = buildFormSubmissionInitialData({
      workflowId: 'some-workflow',
      form: form,
      formSubmission: { internal_custom_id: 'some-id', form_answers: [] },
      dictFormFieldExternalImportIdToFormField: {},
    });

    expect(initialData.alias).toBeNull();
    expect(initialData.source).toBeNull();
    expect(initialData.form_answers).toEqual([]);
  });
});
