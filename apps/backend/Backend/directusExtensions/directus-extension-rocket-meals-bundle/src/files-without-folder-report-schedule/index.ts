import { CollectionNames, CronHelper, DatabaseTypes, MailAdresses } from 'repo-depkit-common';
import { MyDatabaseHelper } from '../helpers/MyDatabaseHelper';
import { MyDefineHook } from '../helpers/MyDefineHook';

const HOOK_NAME = 'files-without-folder-report-schedule';

const UNREFERENCED_MARKER = '**[UNREFERENZIERT]**';
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
  if (candidateFileIds.length === 0) {
    return referencedFileIds;
  }

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
      const item = await collectionHelper.readSingleton();
      const value = item?.[fileIdField];
      if (value) {
        const fileId = getFileIdFromRelationValue(value);
        if (candidateIdSet.has(fileId)) {
          referencedFileIds.add(fileId);
        }
      }
      continue;
    }

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

  return referencedFileIds;
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
    const unreferencedAmount = filesWithoutFolder.length - referencedFileIds.size;

    apiContext.logger.info(HOOK_NAME + ': ' + unreferencedAmount + ' of them are not referenced by any item.');

    const fileList = filesWithoutFolder
      .map((file: DatabaseTypes.DirectusFiles) => {
        const marker = referencedFileIds.has(file.id) ? '' : ' ' + UNREFERENCED_MARKER;
        return `- ${file.title || file.filename_download} (ID: ${file.id})${marker}`;
      })
      .join('\n');

    const subject = 'Dateien ohne Ordner gefunden (' + filesWithoutFolder.length + ', davon ' + unreferencedAmount + ' unreferenziert)';
    const markdown_content =
      `Es wurden **${filesWithoutFolder.length}** Datei(en) gefunden, die in keinem Ordner liegen.\n\n` +
      `Davon werden **${unreferencedAmount}** Datei(en) von keinem Eintrag referenziert (markiert mit ${UNREFERENCED_MARKER}).\n` +
      `Die übrigen Dateien sind referenziert (z.B. als Mail-Anhang) und nur unsortiert.\n\n` +
      fileList;

    await myDatabaseHelper.sendMail({
      recipient: MailAdresses.SupportMail,
      subject: subject,
      markdown_content: markdown_content,
    });

    apiContext.logger.info(HOOK_NAME + ': Mail created for files without folder.');
  });
});
