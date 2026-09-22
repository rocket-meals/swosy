// Jest test: die Werte einer Vorschau-Anfrage werden zu den Zeilen des Formular-PDFs
import { describe, expect, it } from '@jest/globals';
import { DatabaseTypes, FormHelperCommon } from 'repo-depkit-common';
import { FormPdfPreviewBadRequestError, FormPdfPreviewHelper } from '../FormPdfPreviewHelper';
import { FormExtractFormAnswerValueFileSingle } from '../../../forms-sync-hook';

const FIELD_TYPE = FormHelperCommon.FORM_FIELD_TYPE;

const FILE_ID_SIGNATURE = '24794e32-0db9-4e76-9a35-27545b99e4dd';
const FILE_ID_ATTACHMENT = '486e0a7d-cf7c-4c80-b56d-82b9fb458faf';
const DATA_URI_IMAGE = 'data:image/png;base64,iVBORw0KGgo=';

function buildFormField(id: string, sort: number | null, fieldType: string = FIELD_TYPE.STRING): DatabaseTypes.FormFields {
  return {
    id,
    alias: id,
    field_type: fieldType,
    form: 'form-id',
    sort,
    status: 'published',
    translations: [],
  } as unknown as DatabaseTypes.FormFields;
}

describe('FormPdfPreviewHelper.parseRequest', () => {
  it('reads the form, the submission and the answers of a request', () => {
    const request = FormPdfPreviewHelper.parseRequest({
      form_id: 'form-id',
      form_submission_id: 'submission-id',
      answers: [{ form_field: 'field-a', value_string: 'Mustermann' }],
    });

    expect(request.form_id).toBe('form-id');
    expect(request.form_submission_id).toBe('submission-id');
    expect(request.answers).toHaveLength(1);
  });

  it('accepts a request without a submission and without answers', () => {
    const request = FormPdfPreviewHelper.parseRequest({ form_id: 'form-id' });

    expect(request.form_submission_id).toBeNull();
    expect(request.answers).toEqual([]);
  });

  it('refuses a request without a form', () => {
    expect(() => FormPdfPreviewHelper.parseRequest({ answers: [] })).toThrow(FormPdfPreviewBadRequestError);
    expect(() => FormPdfPreviewHelper.parseRequest({ form_id: '   ' })).toThrow(FormPdfPreviewBadRequestError);
    expect(() => FormPdfPreviewHelper.parseRequest('form-id')).toThrow(FormPdfPreviewBadRequestError);
  });

  it('refuses answers that are not a list of objects', () => {
    expect(() => FormPdfPreviewHelper.parseRequest({ form_id: 'form-id', answers: 'field-a' })).toThrow(FormPdfPreviewBadRequestError);
    expect(() => FormPdfPreviewHelper.parseRequest({ form_id: 'form-id', answers: ['field-a'] })).toThrow(FormPdfPreviewBadRequestError);
  });
});

describe('FormPdfPreviewHelper.buildFormExtractRelevantInformation', () => {
  it('prints every field of the form, in the order of the form', () => {
    const formFields = [buildFormField('field-c', 3), buildFormField('field-a', 1), buildFormField('field-b', null)];

    const information = FormPdfPreviewHelper.buildFormExtractRelevantInformation(formFields, []);

    expect(information.map(entry => entry.form_field_id)).toEqual(['field-a', 'field-c', 'field-b']);
  });

  it('leaves a field without an answer empty instead of dropping it', () => {
    const information = FormPdfPreviewHelper.buildFormExtractRelevantInformation([buildFormField('field-a', 1)], []);

    expect(information).toHaveLength(1);
    expect(information[0]?.form_answer.value_string).toBeNull();
    expect(information[0]?.form_answer.value_files).toEqual([]);
  });

  it('ignores values for fields the form does not have', () => {
    const information = FormPdfPreviewHelper.buildFormExtractRelevantInformation([buildFormField('field-a', 1)], [{ form_field: 'field-of-another-form', value_string: 'Mustermann' }]);

    expect(information).toHaveLength(1);
    expect(information[0]?.form_answer.value_string).toBeNull();
  });

  it('reads a number written in german notation', () => {
    const formFields = [buildFormField('field-a', 1, FIELD_TYPE.NUMBER), buildFormField('field-b', 2, FIELD_TYPE.NUMBER), buildFormField('field-c', 3, FIELD_TYPE.NUMBER)];

    const information = FormPdfPreviewHelper.buildFormExtractRelevantInformation(formFields, [
      { form_field: 'field-a', value_number: '1.234,56' },
      { form_field: 'field-b', value_number: 42 },
      { form_field: 'field-c', value_number: 'keine Zahl' },
    ]);

    expect(information[0]?.form_answer.value_number).toBe(1234.56);
    expect(information[1]?.form_answer.value_number).toBe(42);
    expect(information[2]?.form_answer.value_number).toBeNull();
  });

  it('keeps the three states of a checkbox apart', () => {
    const formFields = [buildFormField('field-a', 1, FIELD_TYPE.BOOLEAN_CHECKBOX), buildFormField('field-b', 2, FIELD_TYPE.BOOLEAN_CHECKBOX), buildFormField('field-c', 3, FIELD_TYPE.BOOLEAN_CHECKBOX)];

    const information = FormPdfPreviewHelper.buildFormExtractRelevantInformation(formFields, [
      { form_field: 'field-a', value_boolean: 1 },
      { form_field: 'field-b', value_boolean: false },
    ]);

    expect(information[0]?.form_answer.value_boolean).toBe(true);
    expect(information[1]?.form_answer.value_boolean).toBe(false);
    expect(information[2]?.form_answer.value_boolean).toBeNull();
  });

  it('takes a signature as a file of this installation or as an embedded image', () => {
    const formFields = [buildFormField('field-a', 1, FIELD_TYPE.FILES_IMAGE_SIGNATURE), buildFormField('field-b', 2, FIELD_TYPE.FILES_IMAGE_SIGNATURE)];

    const information = FormPdfPreviewHelper.buildFormExtractRelevantInformation(formFields, [
      { form_field: 'field-a', value_image: FILE_ID_SIGNATURE },
      { form_field: 'field-b', value_image: DATA_URI_IMAGE },
    ]);

    expect(information[0]?.form_answer.value_image).toBe(FILE_ID_SIGNATURE);
    expect(information[1]?.form_answer.value_image).toBe(DATA_URI_IMAGE);
  });

  it('refuses an image from somewhere else on the network', () => {
    const formFields = [buildFormField('field-a', 1, FIELD_TYPE.FILES_IMAGE), buildFormField('field-b', 2, FIELD_TYPE.FILES_IMAGE)];

    const information = FormPdfPreviewHelper.buildFormExtractRelevantInformation(formFields, [
      { form_field: 'field-a', value_image: 'http://127.0.0.1:8055/admin' },
      { form_field: 'field-b', value_files: ['https://example.org/logo.png', FILE_ID_ATTACHMENT] },
    ]);

    expect(information[0]?.form_answer.value_image).toBeNull();
    expect(information[1]?.form_answer.value_files).toHaveLength(1);
    expect((information[1]?.form_answer.value_files[0] as FormExtractFormAnswerValueFileSingle).directus_files_id).toBe(FILE_ID_ATTACHMENT);
  });

  it('takes the attachments of a field as ids or as objects of the app', () => {
    const information = FormPdfPreviewHelper.buildFormExtractRelevantInformation(
      [buildFormField('field-a', 1, FIELD_TYPE.FILES_FILES)],
      [{ form_field: 'field-a', value_files: [FILE_ID_ATTACHMENT, { directus_files_id: FILE_ID_SIGNATURE }, DATA_URI_IMAGE] }]
    );

    const valueFiles = information[0]?.form_answer.value_files ?? [];
    expect(valueFiles).toHaveLength(3);
    expect((valueFiles[0] as FormExtractFormAnswerValueFileSingle).directus_files_id).toBe(FILE_ID_ATTACHMENT);
    expect((valueFiles[1] as FormExtractFormAnswerValueFileSingle).directus_files_id).toBe(FILE_ID_SIGNATURE);
    expect(valueFiles[2]).toBe(DATA_URI_IMAGE);
  });
});
