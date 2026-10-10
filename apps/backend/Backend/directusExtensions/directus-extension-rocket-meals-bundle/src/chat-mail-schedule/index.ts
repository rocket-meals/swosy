import { CollectionNames, DatabaseTypes } from 'repo-depkit-common';
import { ItemsServiceHelper } from '../helpers/ItemsServiceHelper';
import { MyDatabaseHelper } from '../helpers/MyDatabaseHelper';
import { MyDefineHook } from '../helpers/MyDefineHook';
import { ChatMailDigestHelper } from '../helpers/ChatMailDigestHelper';
import { ChatMessageMailHelper } from '../helpers/ChatMessageMailHelper';

const SCHEDULE_NAME = 'chat_mail_schedule';

/**
 * Sends the mails about new chat messages once a chat was quiet for a few minutes
 * ({@link ChatMailDigestHelper}). The `chat-conversation-state-hook` notes the first message not
 * mailed yet in `chats.mail_pending_since`; every message bumps `chats.date_updated`.
 */
export default MyDefineHook.defineHookWithAllTablesExisting(SCHEDULE_NAME, async ({ schedule }, apiContext) => {
  let running = false;

  schedule('0 * * * * *', async () => {
    // A slow mail server must not let two runs mail the same chat.
    if (running) {
      return;
    }
    running = true;
    try {
      const myDatabaseHelper = new MyDatabaseHelper(apiContext);
      const chatsHelper = new ItemsServiceHelper<DatabaseTypes.Chats>(myDatabaseHelper, CollectionNames.CHATS);
      const quietChats = await chatsHelper.readByQuery({
        filter: { _and: [{ mail_pending_since: { _nnull: true } }, { date_updated: { _lte: ChatMailDigestHelper.getQuietCutoff(new Date()) } }] },
        fields: ['id', 'mail_pending_since'],
        limit: -1,
      });
      if (quietChats.length === 0) {
        return;
      }

      const mailHelper = new ChatMessageMailHelper(myDatabaseHelper);
      for (const chat of quietChats) {
        const since = chat.mail_pending_since;
        if (!since) {
          continue;
        }
        try {
          // Cleared first: a message written meanwhile notes itself again and is mailed in a later
          // run, instead of getting lost.
          await chatsHelper.updateOne(chat.id, { mail_pending_since: null }, { disableEventEmit: true });
          await mailHelper.sendMailsForChat(chat.id, since);
        } catch (error) {
          apiContext.logger.error(`${SCHEDULE_NAME}: Failed to send the mails of chat ${chat.id}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    } catch (error) {
      apiContext.logger.error(`${SCHEDULE_NAME}: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      running = false;
    }
  });
});
