// Was die App an die PDF-Vorschau schickt: die Werte, die gerade in den Feldern stehen –
// Bilder nur dann als Base64, wenn es sie auf dem Server noch gar nicht gibt.

jest.mock('@/constants/Constants', () => ({ isWeb: true }));
jest.mock('repo-depkit-common-ui', () => ({ MyBuffer: require('buffer').Buffer }));
jest.mock('expo-file-system/legacy', () => ({ cacheDirectory: 'file:///cache/', EncodingType: { Base64: 'base64' }, writeAsStringAsync: jest.fn() }));
jest.mock('@/constants/ServerUrl', () => ({ __esModule: true, default: { ServerUrl: 'https://example.org/api' } }));
jest.mock('@/redux/actions/Auth/Auth', () => ({ ServerAPI: { getClient: () => ({ getToken: async () => 'token' }) } }));

import { FormHelperCommon } from 'repo-depkit-common';
import { buildFormPdfPreviewAnswers, buildFormPdfPreviewFileName } from './formPdfPreviewHelper';

const FIELD_TYPE = FormHelperCommon.FORM_FIELD_TYPE;

const FILE_ID_SIGNATURE = '24794e32-0db9-4e76-9a35-27545b99e4dd';
const FILE_ID_ATTACHMENT = '486e0a7d-cf7c-4c80-b56d-82b9fb458faf';
const DATA_URI_IMAGE = 'data:image/png;base64,iVBORw0KGgo=';

const formatDate = (_fieldType: string, value: string) => `iso-${value}`;
const toDataUri = async () => DATA_URI_IMAGE;

function buildAnswer(answerId: string, fieldType: string, storedValues: Record<string, any> = {}): any {
	return {
		id: answerId,
		form_field: { id: `field-${answerId}`, field_type: fieldType },
		value_string: null,
		value_number: null,
		value_boolean: null,
		value_date: null,
		value_custom: null,
		value_image: null,
		value_files: [],
		...storedValues,
	};
}

describe('buildFormPdfPreviewAnswers', () => {
	it('sends the value that is currently in the field', async () => {
		const answers = [buildAnswer('a', FIELD_TYPE.STRING), buildAnswer('b', FIELD_TYPE.NUMBER), buildAnswer('c', FIELD_TYPE.DATE)];
		const formData = {
			a: { value: 'Mustermann', error: '', custom_type: 'value_string' },
			b: { value: '1.234,56', error: '', custom_type: 'value_number' },
			c: { value: '27.11.2023', error: '', custom_type: 'value_date' },
		};

		const previewAnswers = await buildFormPdfPreviewAnswers({ formAnswers: answers, formData, formatDate, toDataUri });

		expect(previewAnswers[0]).toEqual({ form_field: 'field-a', value_string: 'Mustermann' });
		expect(previewAnswers[1]).toEqual({ form_field: 'field-b', value_number: '1.234,56' });
		expect(previewAnswers[2]).toEqual({ form_field: 'field-c', value_date: 'iso-27.11.2023' });
	});

	it('keeps a checkbox that was answered with no', async () => {
		const answers = [buildAnswer('a', FIELD_TYPE.BOOLEAN_CHECKBOX), buildAnswer('b', FIELD_TYPE.BOOLEAN_CHECKBOX, { value_boolean: false })];
		// Die Formularseite führt nur Felder mit einem Wert - eine gespeicherte „Nein"-Antwort
		// steht deshalb nicht in `formData` und muss aus der Antwort selbst kommen.
		const formData = { a: { value: 1, error: '', custom_type: 'value_boolean' } };

		const previewAnswers = await buildFormPdfPreviewAnswers({ formAnswers: answers, formData, formatDate, toDataUri });

		expect(previewAnswers[0]?.value_boolean).toBe(true);
		expect(previewAnswers[1]?.value_boolean).toBe(false);
	});

	it('sends a freshly drawn signature as an embedded image', async () => {
		const answers = [buildAnswer('a', FIELD_TYPE.FILES_IMAGE_SIGNATURE)];
		const formData = { a: { value: { name: 'signature.png', type: 'image/png', image: 'file:///signature.png' }, error: '', custom_type: 'value_image' } };

		const previewAnswers = await buildFormPdfPreviewAnswers({ formAnswers: answers, formData, formatDate, toDataUri });

		expect(previewAnswers[0]?.value_image).toBe(DATA_URI_IMAGE);
	});

	it('sends an already uploaded image as its file id, not as its asset url', async () => {
		const answers = [buildAnswer('a', FIELD_TYPE.FILES_IMAGE, { value_image: FILE_ID_SIGNATURE })];
		const formData = { a: { value: `https://example.org/api/assets/${FILE_ID_SIGNATURE}`, error: '', custom_type: 'value_image' } };

		const previewAnswers = await buildFormPdfPreviewAnswers({ formAnswers: answers, formData, formatDate, toDataUri });

		expect(previewAnswers[0]?.value_image).toBe(FILE_ID_SIGNATURE);
	});

	it('sends uploaded attachments as ids and leaves a not yet uploaded document out', async () => {
		const answers = [buildAnswer('a', FIELD_TYPE.FILES_FILES)];
		const formData = {
			a: {
				value: [
					{ directus_files_id: FILE_ID_ATTACHMENT, edit: true, name: 'scan.png', type: 'image/png' },
					{ name: 'photo.jpg', type: 'image/jpeg', image: 'file:///photo.jpg' },
					{ name: 'contract.pdf', type: 'application/pdf', image: 'file:///contract.pdf' },
				],
				error: '',
				custom_type: 'value_files',
			},
		};

		const previewAnswers = await buildFormPdfPreviewAnswers({ formAnswers: answers, formData, formatDate, toDataUri });

		expect(previewAnswers[0]?.value_files).toEqual([FILE_ID_ATTACHMENT, DATA_URI_IMAGE]);
	});

	it('falls back to the stored answer for a field nobody touched', async () => {
		const answers = [buildAnswer('a', FIELD_TYPE.STRING, { value_string: 'Mustermann' })];

		const previewAnswers = await buildFormPdfPreviewAnswers({ formAnswers: answers, formData: {}, formatDate, toDataUri });

		expect(previewAnswers[0]?.value_string).toBe('Mustermann');
	});
});

describe('buildFormPdfPreviewFileName', () => {
	it('keeps only letters and digits of the reference', () => {
		expect(buildFormPdfPreviewFileName('A-2023/000188')).toBe('A_2023_000188.pdf');
	});

	it('has a name even without a reference', () => {
		expect(buildFormPdfPreviewFileName(null)).toBe('form.pdf');
		expect(buildFormPdfPreviewFileName('../../etc/passwd')).toBe('etc_passwd.pdf');
	});
});
