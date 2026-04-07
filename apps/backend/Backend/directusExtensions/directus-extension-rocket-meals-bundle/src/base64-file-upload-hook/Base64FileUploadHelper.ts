import { CollectionNames } from 'repo-depkit-common';
import { FilesServiceHelper, MyFileTypes } from '../helpers/FilesServiceHelper';
import { Buffer } from 'node:buffer';
import { MyDatabaseHelper } from '../helpers/MyDatabaseHelper';
import { DirectusFieldsServiceHelper } from '../helpers/DirectusFieldsServiceHelper';

interface Base64DecodedFile {
  type: string;
  data: Buffer;
  extension: string;
}

/**
 * Check if a value is a base64 data URI string (e.g. "data:image/png;base64,iVBOR...").
 */
export function isBase64DataUri(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith('data:') && value.includes(';base64,');
}

/**
 * Known MIME-subtype to file-extension overrides for subtypes that are
 * not directly usable as filename extensions (e.g. "svg+xml" → "svg").
 */
const MIME_EXTENSION_MAP: Record<string, string> = {
  'svg+xml': 'svg',
  'x-icon': 'ico',
  'vnd.microsoft.icon': 'ico',
};

/**
 * Decode a base64 data URI string into its components.
 * @param dataString A data URI like "data:image/png;base64,iVBOR..."
 * @returns The decoded MIME type, raw buffer, and file extension.
 */
export function decodeBase64DataUri(dataString: string): Base64DecodedFile {
  const matches = dataString.match(/^data:([A-Za-z0-9+/.-]+);base64,(.+)$/);
  if (!matches || matches.length !== 3 || !matches[1] || !matches[2]) {
    throw new Error('Invalid base64 data URI string');
  }

  const mimeType: string = matches[1];
  // Extract extension from MIME type (e.g. "image/png" → "png")
  const rawSubtype: string = mimeType.includes('/') ? mimeType.split('/')[1]! : mimeType;
  const extension: string = MIME_EXTENSION_MAP[rawSubtype] ?? rawSubtype;

  return {
    type: mimeType,
    data: Buffer.from(matches[2], 'base64'),
    extension: extension,
  };
}

/**
 * Process a single field in the input payload: if it contains a base64 data URI,
 * upload the file to Directus and replace the field value with the new file ID.
 *
 * @param input         The mutable payload object.
 * @param fieldName     The field to inspect (e.g. "value_image").
 * @param collectionName The Directus collection this payload belongs to.
 * @param myDatabaseHelper Helper for accessing Directus services.
 */
export async function processBase64FileField(
  input: Record<string, any>,
  fieldName: string,
  collectionName: CollectionNames,
  myDatabaseHelper: MyDatabaseHelper
): Promise<void> {
  const value = input[fieldName];
  if (!isBase64DataUri(value)) {
    return; // Not a base64 data URI — nothing to do
  }

  // Decode the base64 payload
  const decoded = decodeBase64DataUri(value);

  // Look up the configured Directus folder for this file field
  const fieldsHelper = new DirectusFieldsServiceHelper(myDatabaseHelper);
  const folderId = await fieldsHelper.getFolderIdForFileFieldInCollection(collectionName, fieldName);

  // Upload the file using admin accountability so the upload always succeeds
  const filesHelper = new FilesServiceHelper(myDatabaseHelper, true);
  const filename = `${collectionName}_${fieldName}_${Date.now()}.${decoded.extension}`;
  const fileId = await filesHelper.uploadOneFromBuffer(
    decoded.data,
    filename,
    decoded.type as MyFileTypes,
    myDatabaseHelper,
    folderId || undefined
  );

  // Replace the base64 string with the created file ID
  input[fieldName] = fileId;
}
