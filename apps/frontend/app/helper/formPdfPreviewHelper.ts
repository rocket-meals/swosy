import { Share } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { DatabaseTypes, StringHelper } from 'repo-depkit-common';
import { MyBuffer } from 'repo-depkit-common-ui';
import { isWeb } from '@/constants/Constants';
import Server from '@/constants/ServerUrl';
import { ServerAPI } from '@/redux/actions/Auth/Auth';

/**
 * Die PDF-Vorschau eines Formulars.
 *
 * Wie ein ausgefülltes Formular gedruckt aussieht, weiß nur das Backend: dort liegt die
 * Vorlage, und dort entsteht auch das PDF, das beim Einreichen an die Mail geht. Die App kann
 * es nicht selbst setzen, deshalb schickt sie die Werte, die gerade in den Feldern stehen, an
 * `POST /form-pdf-preview` und bekommt das fertige Dokument zurück. Gespeichert wird dabei
 * nichts – weder in der App noch auf dem Server.
 *
 * Geschickt werden die Werte, nicht die Bilder: ein Bild, das schon hochgeladen ist, reist als
 * Datei-Id, und nur eine frisch aufgenommene Unterschrift (die es auf dem Server noch gar nicht
 * gibt) reist als Base64-Bild mit. So bleibt die Anfrage klein, und die Vorschau verlangt
 * nicht, dass vorher gespeichert wird.
 */

/** Eine Antwort, wie die Vorschau-Route sie erwartet: das Feld und sein Wert. */
export type FormPdfPreviewAnswer = {
	form_field: string;
	value_string?: string | null;
	value_number?: string | number | null;
	value_boolean?: boolean | null;
	value_date?: string | null;
	value_custom?: string | null;
	/** Eine Directus-Datei-Id oder ein `data:image/...`-Bild. */
	value_image?: string | null;
	/** Directus-Datei-Ids oder `data:image/...`-Bilder. */
	value_files?: string[];
};

export type FormPdfPreviewRequestBody = {
	form_id: string;
	form_submission_id?: string | null;
	answers: FormPdfPreviewAnswer[];
};

/** Ein Eintrag des Formulars, wie ihn `formData` auf der Formularseite hält. */
export type FormPdfPreviewFormDataEntry = { value: any; error: string; custom_type?: string };

/** Eine neu ausgewählte Datei, bevor sie hochgeladen ist. */
type PickedFile = { name?: string; type?: string; image?: string; directus_files_id?: string; edit?: boolean };

const ENDPOINT_PATH = '/form-pdf-preview';
const MIME_TYPE_IMAGE_PREFIX = 'image/';

const isPickedFile = (value: unknown): value is PickedFile => typeof value === 'object' && value !== null;

/** Der Wert eines Feldes, so wie er in der Datenbank steht – für Felder, die niemand angefasst hat. */
function buildAnswerFromStoredValues(answer: DatabaseTypes.FormAnswers, formFieldId: string): FormPdfPreviewAnswer {
	const storedFiles = ((answer as any)?.value_files ?? []) as (PickedFile | string)[];
	return {
		form_field: formFieldId,
		value_string: (answer as any)?.value_string ?? null,
		value_number: (answer as any)?.value_number ?? null,
		value_boolean: (answer as any)?.value_boolean ?? null,
		value_date: (answer as any)?.value_date ?? null,
		value_custom: (answer as any)?.value_custom ?? null,
		value_image: typeof (answer as any)?.value_image === 'string' ? (answer as any).value_image : null,
		value_files: storedFiles.map(file => (typeof file === 'string' ? file : String(file?.directus_files_id ?? ''))).filter(Boolean),
	};
}

/** Die Tri-State-Checkbox der App (1 / 0 / nichts) als Wahrheitswert des Dokuments. */
function toBooleanValue(value: any): boolean | null {
	if (value === 1 || value === true) return true;
	if (value === 0 || value === false) return false;
	return null;
}

/**
 * Das Bild eines Feldes.
 *
 * Ein frisch aufgenommenes Bild liegt nur lokal vor und muss als Base64 mitreisen. Ein Bild,
 * das schon hochgeladen ist, steht in `formData` als Asset-Adresse – dafür wird die Datei-Id
 * aus der gespeicherten Antwort genommen, damit der Server das Bild selbst laden kann.
 */
async function resolveImageValue(value: any, answer: DatabaseTypes.FormAnswers, toDataUri: (fileData: { name: string; type: string; image: string }) => Promise<string>): Promise<string | null> {
	if (isPickedFile(value) && value.name && value.image) {
		return await toDataUri({ name: value.name, type: value.type || '', image: value.image });
	}
	if (typeof value === 'string' && value.length > 0) {
		const storedImageId = (answer as any)?.value_image;
		return typeof storedImageId === 'string' ? storedImageId : null;
	}
	return null;
}

/**
 * Die Anhänge eines Feldes.
 *
 * Hochgeladene Dateien reisen als Id. Eine noch nicht hochgeladene Datei reist nur mit, wenn
 * sie ein Bild ist: nur Bilder erscheinen im Dokument, alles andere würde die Anfrage bloß
 * aufblähen.
 */
async function resolveFilesValue(value: any, toDataUri: (fileData: { name: string; type: string; image: string }) => Promise<string>): Promise<string[]> {
	if (!Array.isArray(value)) {
		return [];
	}

	const fileValues: string[] = [];
	for (const file of value) {
		if (!isPickedFile(file)) continue;
		if (file.directus_files_id) {
			fileValues.push(String(file.directus_files_id));
			continue;
		}
		const isImage = (file.type || '').startsWith(MIME_TYPE_IMAGE_PREFIX);
		if (isImage && file.image) {
			fileValues.push(await toDataUri({ name: file.name || '', type: file.type || '', image: file.image }));
		}
	}
	return fileValues;
}

/**
 * Die Werte des Formulars für die Vorschau-Route.
 *
 * Felder, die niemand angefasst hat, kommen aus der gespeicherten Antwort – sonst verschwände
 * ein angekreuztes „Nein" aus der Vorschau, denn `formData` führt nur, was auf dem Bildschirm
 * einen Wert hatte.
 */
export async function buildFormPdfPreviewAnswers(options: {
	formAnswers: DatabaseTypes.FormAnswers[];
	formData: { [key: string]: FormPdfPreviewFormDataEntry };
	formatDate: (fieldType: string, value: string) => string | null;
	toDataUri: (fileData: { name: string; type: string; image: string }) => Promise<string>;
}): Promise<FormPdfPreviewAnswer[]> {
	const { formAnswers, formData, formatDate, toDataUri } = options;

	const previewAnswers: FormPdfPreviewAnswer[] = [];
	for (const answer of formAnswers || []) {
		const formField = answer?.form_field as DatabaseTypes.FormFields;
		const formFieldId = typeof formField === 'string' ? formField : formField?.id;
		if (!formFieldId) continue;

		const formDataEntry = formData?.[String(answer?.id)];
		if (!formDataEntry) {
			previewAnswers.push(buildAnswerFromStoredValues(answer, formFieldId));
			continue;
		}

		const fieldType = (typeof formField === 'string' ? '' : formField?.field_type) || '';
		const customType = formDataEntry.custom_type || fieldType.split('-')[0];
		const value = formDataEntry.value;

		const previewAnswer: FormPdfPreviewAnswer = { form_field: formFieldId };
		if (customType === 'value_string') {
			previewAnswer.value_string = typeof value === 'string' ? value : null;
		} else if (customType === 'value_number') {
			previewAnswer.value_number = value === null || value === undefined || value === '' ? null : value;
		} else if (customType === 'value_boolean') {
			previewAnswer.value_boolean = toBooleanValue(value);
		} else if (customType === 'value_custom') {
			previewAnswer.value_custom = value ?? null;
		} else if (customType === 'value_date') {
			previewAnswer.value_date = typeof value === 'string' ? formatDate(fieldType, value) : null;
		} else if (customType === 'value_image') {
			previewAnswer.value_image = await resolveImageValue(value, answer, toDataUri);
		} else if (customType === 'value_files') {
			previewAnswer.value_files = await resolveFilesValue(value, toDataUri);
		}
		previewAnswers.push(previewAnswer);
	}

	return previewAnswers;
}

/**
 * Der Dateiname der Vorschau – aus der Vorgangskennung, auf Buchstaben und Ziffern gekürzt.
 * Der Name landet im Dateisystem des Geräts und im Teilen-Menü, deshalb bleibt nichts darin,
 * was ein Pfad sein könnte.
 */
export function buildFormPdfPreviewFileName(alias: string | null | undefined): string {
	const sanitizedAlias = StringHelper.replaceAllWithOptions({ str: String(alias ?? ''), find: String.raw`[^A-Za-z0-9]+`, replace: '_' });
	const trimmedAlias = StringHelper.replaceAllWithOptions({ str: sanitizedAlias, find: String.raw`^_+|_+$`, replace: '' });
	return `${trimmedAlias || 'form'}.pdf`;
}

/** Holt das PDF vom Backend. Wirft, wenn die Route nichts liefert – der Aufrufer sagt es dem Nutzer. */
export async function requestFormPdfPreview(body: FormPdfPreviewRequestBody): Promise<ArrayBuffer> {
	const token = await ServerAPI.getClient().getToken();

	const response = await fetch(`${Server.ServerUrl}${ENDPOINT_PATH}`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(body),
	});

	if (!response.ok) {
		throw new Error(`Form pdf preview failed with status ${response.status}`);
	}

	return await response.arrayBuffer();
}

/** Wie lange die Adresse des Dokuments im Browser gültig bleibt, bevor sie freigegeben wird. */
const BLOB_URL_LIFETIME_MS = 60_000;

/**
 * Zeigt das PDF: im Web in einem neuen Tab, auf dem Gerät über das Teilen-Menü, das eine
 * Vorschau anbietet. Dasselbe Muster wie beim Herunterladen eines Bildes im Vollbild.
 *
 * Der neue Tab entsteht erst, nachdem das Backend geantwortet hat – manche Browser zählen das
 * nicht mehr zum Tippen des Nutzers und blocken ihn. Dann wird das Dokument stattdessen
 * heruntergeladen; ein Download wird nicht geblockt.
 */
export async function openFormPdfPreview(pdfBytes: ArrayBuffer, fileName: string): Promise<void> {
	if (isWeb) {
		const blob = new Blob([pdfBytes], { type: 'application/pdf' });
		const blobUrl = URL.createObjectURL(blob);
		const openedWindow = window.open(blobUrl, '_blank');
		if (!openedWindow) {
			const link = document.createElement('a');
			link.href = blobUrl;
			link.download = fileName;
			document.body.appendChild(link);
			link.click();
			link.remove();
		}
		setTimeout(() => URL.revokeObjectURL(blobUrl), BLOB_URL_LIFETIME_MS);
		return;
	}

	const base64 = MyBuffer.from(pdfBytes).toString('base64');
	const fileUri = `${(FileSystem as any).cacheDirectory}${fileName}`;
	await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });
	await Share.share({ url: fileUri, message: fileUri });
}
