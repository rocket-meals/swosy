import { CollectionNames, CronHelper, DatabaseTypes, MailAdresses } from 'repo-depkit-common';
import { MyDatabaseHelper } from '../helpers/MyDatabaseHelper';
import { ItemsServiceHelper } from '../helpers/ItemsServiceHelper';
import { MyDefineHook } from '../helpers/MyDefineHook';

const HOOK_NAME = 'files-without-folder-report-schedule';

const CANDIDATE_ID_CHUNK_SIZE = 250;

type SpecificCollection = { [key: string]: string | DatabaseTypes.DirectusFiles };

function getFileIdFromRelationValue(value: string | DatabaseTypes.DirectusFiles): string {
  return typeof value === 'string' ? value : value.id;
}

function chunkArray<T>(items: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Scans all schema relations pointing to directus_files and returns which of the
 * candidate file ids are referenced by at least one item (e.g. mail attachments,
 * form answers, food images, ...). Only the candidate ids are queried, so this
 * stays cheap even on large databases.
 */
async function findReferencedFileIds(candidateFileIds: string[], myDatabaseHelper: MyDatabaseHelper): Promise<Set<string>> {
  const referencedFileIds = new Set<string>();
  if (candidateFileIds.length > 0) {
    await collectReferencedFileIds(candidateFileIds, myDatabaseHelper, referencedFileIds);
  }
  return referencedFileIds;
}

/** Walks every directus_files relation of the schema and collects the referenced candidate ids into `referencedFileIds`. */
async function collectReferencedFileIds(
  candidateFileIds: string[],
  myDatabaseHelper: MyDatabaseHelper,
  referencedFileIds: Set<string>,
): Promise<void> {
  const schema = await myDatabaseHelper.getSchema();
  const candidateIdSet = new Set(candidateFileIds);
  const candidateIdChunks = chunkArray(candidateFileIds, CANDIDATE_ID_CHUNK_SIZE);

  for (const relationKey in schema.relations) {
    const relation = schema.relations[relationKey];
    if (!relation || relation.related_collection !== CollectionNames.DIRECTUS_FILES) {
      continue;
    }

    const { collection: collectionName, field: fileIdField } = relation;
    const collectionObj = schema.collections[collectionName];
    if (!collectionObj) {
      continue;
    }

    const collectionHelper = myDatabaseHelper.getItemsServiceHelper<SpecificCollection>(collectionName as CollectionNames);

    if (collectionObj.singleton) {
      await collectSingletonFileReference(collectionHelper, fileIdField, candidateIdSet, referencedFileIds);
    } else {
      await collectCollectionFileReferences(collectionHelper, fileIdField, candidateIdChunks, referencedFileIds);
    }
  }
}

/** Adds the file the singleton references, if it is one of the candidates. */
async function collectSingletonFileReference(
  collectionHelper: ItemsServiceHelper<SpecificCollection>,
  fileIdField: string,
  candidateIdSet: Set<string>,
  referencedFileIds: Set<string>,
): Promise<void> {
  const item = await collectionHelper.readSingleton();
  const value = item?.[fileIdField];
  if (!value) {
    return;
  }
  const fileId = getFileIdFromRelationValue(value);
  if (candidateIdSet.has(fileId)) {
    referencedFileIds.add(fileId);
  }
}

/**
 * Adds every candidate file id the collection references, queried chunk by
 * chunk and skipping ids another relation already accounted for.
 */
async function collectCollectionFileReferences(
  collectionHelper: ItemsServiceHelper<SpecificCollection>,
  fileIdField: string,
  candidateIdChunks: string[][],
  referencedFileIds: Set<string>,
): Promise<void> {
  for (const candidateIdChunk of candidateIdChunks) {
    const remainingIdsInChunk = candidateIdChunk.filter(id => !referencedFileIds.has(id));
    if (remainingIdsInChunk.length === 0) {
      continue;
    }
    const items = await collectionHelper.readByQuery({
      filter: { [fileIdField]: { _in: remainingIdsInChunk } },
      fields: [fileIdField],
      limit: -1,
    });
    for (const item of items) {
      const value = item[fileIdField];
      if (value) {
        referencedFileIds.add(getFileIdFromRelationValue(value));
      }
    }
  }
}

export default MyDefineHook.defineHookWithAllTablesExisting(HOOK_NAME, async ({ schedule }, apiContext) => {
  const cronString = CronHelper.getCronString(CronHelper.EVERY_FRIDAY_AT_8AM);

  schedule(cronString, async () => {
    apiContext.logger.info(HOOK_NAME + ': start schedule run: ' + new Date().toISOString());

    const myDatabaseHelper = new MyDatabaseHelper(apiContext);
    const filesHelper = myDatabaseHelper.getFilesHelper();

    const filesWithoutFolder = await filesHelper.readByQuery({
      filter: {
        folder: {
          _null: true,
        },
      },
      fields: ['id', 'filename_download', 'title'],
      limit: -1,
    });

    if (!filesWithoutFolder || filesWithoutFolder.length === 0) {
      apiContext.logger.info(HOOK_NAME + ': No files without folder found.');
      return;
    }

    apiContext.logger.info(HOOK_NAME + ': Found ' + filesWithoutFolder.length + ' file(s) without folder.');

    // Distinguish files that are merely unsorted (no folder, but referenced somewhere,
    // e.g. as mail attachment) from files that are truly unreferenced.
    const candidateFileIds = filesWithoutFolder.map((file: DatabaseTypes.DirectusFiles) => file.id);
    const referencedFileIds = await findReferencedFileIds(candidateFileIds, myDatabaseHelper);

    const filesWithoutFolderButReferenced = filesWithoutFolder.filter((file: DatabaseTypes.DirectusFiles) => referencedFileIds.has(file.id));
    const filesWithoutReference = filesWithoutFolder.filter((file: DatabaseTypes.DirectusFiles) => !referencedFileIds.has(file.id));

    apiContext.logger.info(HOOK_NAME + ': ' + filesWithoutReference.length + ' of them are not referenced by any item.');

    const formatFileList = (files: DatabaseTypes.DirectusFiles[]): string => {
      if (files.length === 0) {
        return '_keine_';
      }
      return files.map(file => `- ${file.title || file.filename_download} (ID: ${file.id})`).join('\n');
    };

    const subject = 'Dateien ohne Ordner oder Referenz gefunden (' + filesWithoutFolder.length + ')';
    const markdown_content =
      `Es wurden **${filesWithoutFolder.length}** auffällige Datei(en) gefunden.\n\n` +
      `## Dateien ohne Ordner: ${filesWithoutFolderButReferenced.length}\n\n` +
      `Diese Dateien sind referenziert (z.B. als Mail-Anhang), liegen aber in keinem Ordner:\n\n` +
      formatFileList(filesWithoutFolderButReferenced) +
      `\n\n## Dateien ohne Referenz: ${filesWithoutReference.length}\n\n` +
      `Diese Dateien werden von keinem Eintrag referenziert:\n\n` +
      formatFileList(filesWithoutReference);

    await myDatabaseHelper.sendMail({
      recipient: MailAdresses.SupportMail,
      subject: subject,
      markdown_content: markdown_content,
    });

    apiContext.logger.info(HOOK_NAME + ': Mail created for files without folder.');
  });
});
