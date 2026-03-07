import { CronHelper, DatabaseTypes, MailAdresses } from 'repo-depkit-common';
import { MyDatabaseHelper } from '../helpers/MyDatabaseHelper';
import { MyDefineHook } from '../helpers/MyDefineHook';

const HOOK_NAME = 'files-without-folder-report-schedule';

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

    const fileList = filesWithoutFolder
      .map((file: DatabaseTypes.DirectusFiles) => `- ${file.title || file.filename_download} (ID: ${file.id})`)
      .join('\n');

    const subject = 'Dateien ohne Ordner gefunden (' + filesWithoutFolder.length + ')';
    const markdown_content =
      `Es wurden **${filesWithoutFolder.length}** Datei(en) gefunden, die in keinem Ordner liegen:\n\n` + fileList;

    await myDatabaseHelper.sendMail({
      recipient: MailAdresses.SupportMail,
      subject: subject,
      markdown_content: markdown_content,
      ignore_mail_limit: true,
    });

    apiContext.logger.info(HOOK_NAME + ': Mail created for files without folder.');
  });
});
