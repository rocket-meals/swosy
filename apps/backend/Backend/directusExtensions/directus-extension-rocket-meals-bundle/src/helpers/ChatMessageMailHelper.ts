import { CollectionNames, DatabaseTypes, DateHelper, MailAdresses } from 'repo-depkit-common';
import { PrimaryKey } from '@directus/types';
import { ItemsServiceHelper } from './ItemsServiceHelper';
import { MyDatabaseHelper } from './MyDatabaseHelper';
import { ChatMailDigestHelper } from './ChatMailDigestHelper';
import { ChatMailRecipientHelper, ChatMailRecipientKind } from './ChatMailRecipientHelper';
import { AppFeedbackAnswerMail } from './rocket-meals-module/AppFeedbackAnswerMail';
import { RocketMealsModulePages } from './rocket-meals-module/RocketMealsModulePages';
import { BackendLanguageResolver } from './translations/BackendLanguageResolver';

const HELPER_NAME = 'ChatMessageMailHelper';

type ChatMessage = Pick<DatabaseTypes.ChatMessages, 'id' | 'message' | 'profile' | 'user_created' | 'date_created'>;

/** A user address to mail and the profile whose language the mail is written in. */
type UserRecipient = { email: string; profileId: PrimaryKey };

/**
 * Sends the delayed mails about the messages of a chat (see {@link ChatMailDigestHelper}):
 *
 * - **Support** gets a mail about what users wrote after the last answer of support, with links to
 *   the chat pages of the module "Rocket Meals". Internal mail, hence German like the other reports.
 * - **Every participant** (and the author of a linked feedback) gets a mail about what others wrote
 *   after their own last message – to the address of their Directus account and the contact email
 *   of their app feedback. Before anything goes out, every address is checked
 *   ({@link ChatMailRecipientHelper}): guests and other `example.com` addresses get nothing, the
 *   default admin stands for support. A profile with `profiles.email_notifications = false` gets
 *   nothing either (empty counts as yes).
 */
export class ChatMessageMailHelper {
  private readonly adminCache = new Map<string, boolean>();

  constructor(private readonly myDatabaseHelper: MyDatabaseHelper) {}

  /**
   * Called {@link ChatMailDigestHelper.QUIET_MS} after a message was saved. Does nothing when a
   * newer message was written meanwhile (its own timer takes over) or the mails were sent already.
   * Otherwise it takes over `chats.mail_pending_since` and mails everything written since then.
   */
  async sendMailsIfQuiet(chatId: string, messageId: PrimaryKey, messageDate: string): Promise<void> {
    const chatMessagesHelper = new ItemsServiceHelper<DatabaseTypes.ChatMessages>(this.myDatabaseHelper, CollectionNames.CHAT_MESSAGES);
    // Messages of the same millisecond are ordered by id, so exactly one of them counts as the last.
    const newerMessages = await chatMessagesHelper.readByQuery({
      filter: { _and: [{ chat: { _eq: chatId } }, { _or: [{ date_created: { _gt: messageDate } }, { _and: [{ date_created: { _eq: messageDate } }, { id: { _gt: messageId } }] }] }] },
      fields: ['id'],
      limit: 1,
    });
    if (newerMessages.length > 0) {
      return;
    }

    const chatsHelper = new ItemsServiceHelper<DatabaseTypes.Chats>(this.myDatabaseHelper, CollectionNames.CHATS);
    const chat = await chatsHelper.readOne(chatId, { fields: ['id', 'mail_pending_since'] });
    const since = chat?.mail_pending_since;
    if (!since) {
      return;
    }
    // Cleared first: a message written meanwhile notes itself again and is mailed by its own timer
    // instead of getting lost.
    await chatsHelper.updateOne(chatId, { mail_pending_since: null }, { disableEventEmit: true });
    await this.sendMailsForChat(chatId, since);
  }

  /** Mails everything written in the chat since `since`. */
  async sendMailsForChat(chatId: string, since: string): Promise<void> {
    const chatMessagesHelper = new ItemsServiceHelper<DatabaseTypes.ChatMessages>(this.myDatabaseHelper, CollectionNames.CHAT_MESSAGES);
    const messages: ChatMessage[] = await chatMessagesHelper.readByQuery({
      filter: { _and: [{ chat: { _eq: chatId } }, { date_created: { _gte: since } }] },
      fields: ['id', 'message', 'profile', 'user_created', 'date_created'],
      sort: ['date_created'],
      limit: -1,
    });
    if (messages.length === 0) {
      return;
    }

    const staffMessageIds = new Set<PrimaryKey>();
    for (const message of messages) {
      if (await this.isStaffMessage(message)) {
        staffMessageIds.add(message.id);
      }
    }
    const isStaffMessage = (message: ChatMessage) => staffMessageIds.has(message.id);

    const relatedAppFeedbacks = await this.findRelatedItems(() => this.myDatabaseHelper.getAppFeedbacksHelper().findItems({ chat: chatId }), chatId, 'app feedbacks');
    const relatedFoodFeedbacks = await this.findRelatedItems(() => this.myDatabaseHelper.getFoodFeedbacksHelper().findItems({ chat: chatId }), chatId, 'food feedbacks');

    let supportMessages = ChatMailDigestHelper.getUnseenMessages(messages, isStaffMessage);

    const userRecipients = new Map<string, UserRecipient & { messages: ChatMessage[] }>();
    for (const profileId of await this.collectProfiles(chatId, relatedAppFeedbacks, relatedFoodFeedbacks)) {
      const unseen = ChatMailDigestHelper.getUnseenMessages(messages, message => String(ItemsServiceHelper.getPrimaryKeyFromItemOrString(message.profile)) === String(profileId));
      if (unseen.length === 0) {
        continue;
      }
      for (const email of await this.collectEmailsOfProfile(profileId, relatedAppFeedbacks)) {
        const recipient = ChatMailRecipientHelper.classify(email);
        if (recipient.kind === ChatMailRecipientKind.SUPPORT && supportMessages.length === 0) {
          supportMessages = unseen;
        } else if (recipient.kind === ChatMailRecipientKind.USER && !userRecipients.has(recipient.email.toLowerCase())) {
          userRecipients.set(recipient.email.toLowerCase(), { email: recipient.email, profileId, messages: unseen });
        }
      }
    }

    if (supportMessages.length > 0) {
      try {
        await this.mailSupport(chatId, supportMessages, relatedAppFeedbacks, relatedFoodFeedbacks);
      } catch (error) {
        console.error(`${HELPER_NAME}: Failed to mail support about chat ${chatId}`, error);
      }
    }
    await this.mailUsers(chatId, Array.from(userRecipients.values()), relatedAppFeedbacks);
  }

  /** Support writes from the module "Rocket Meals" without profile; an admin in the app has one. */
  private async isStaffMessage(message: ChatMessage): Promise<boolean> {
    if (!ItemsServiceHelper.getPrimaryKeyFromItemOrString(message.profile)) {
      return true;
    }
    const creatorId = ItemsServiceHelper.getPrimaryKeyFromItemOrString(message.user_created);
    if (!creatorId) {
      return false;
    }
    const key = String(creatorId);
    if (!this.adminCache.has(key)) {
      this.adminCache.set(key, await this.myDatabaseHelper.getUsersHelper().isAdminUser(key));
    }
    return this.adminCache.get(key) === true;
  }

  /** The feedbacks a chat belongs to; empty when they cannot be read – mails are best effort. */
  private async findRelatedItems<T>(load: () => Promise<T[]>, chatId: string, label: string): Promise<T[]> {
    try {
      return await load();
    } catch (error) {
      console.error(`${HELPER_NAME}: Failed to load related ${label} for chat ${chatId}`, error);
      return [];
    }
  }

  /** The participants of the chat and the authors of its feedbacks, in case they are not (yet) a participant. */
  private async collectProfiles(chatId: string, relatedAppFeedbacks: DatabaseTypes.AppFeedbacks[], relatedFoodFeedbacks: DatabaseTypes.FoodsFeedbacks[]): Promise<Set<PrimaryKey>> {
    const profileIds = new Set<PrimaryKey>();
    try {
      const participantsHelper = new ItemsServiceHelper<DatabaseTypes.ChatsParticipants>(this.myDatabaseHelper, CollectionNames.CHATS_PARTICIPANTS);
      for (const participantLink of await participantsHelper.findItems({ chats_id: chatId })) {
        const profileId = ItemsServiceHelper.getPrimaryKeyFromItemOrString(participantLink?.profiles_id);
        if (profileId) {
          profileIds.add(profileId);
        }
      }
    } catch (error) {
      console.error(`${HELPER_NAME}: Failed to load chat participants for chat ${chatId}`, error);
    }
    for (const feedback of [...relatedAppFeedbacks, ...relatedFoodFeedbacks]) {
      const profileId = ItemsServiceHelper.getPrimaryKeyFromItemOrString(feedback?.profile);
      if (profileId) {
        profileIds.add(profileId);
      }
    }
    return profileIds;
  }

  /** The account addresses of a profile and the contact emails of its app feedbacks, still unchecked. */
  private async collectEmailsOfProfile(profileId: PrimaryKey, relatedAppFeedbacks: DatabaseTypes.AppFeedbacks[]): Promise<string[]> {
    const emails: string[] = [];
    try {
      // The setting lives on the profile – several users can share one profile.
      const profile = await this.myDatabaseHelper.getProfilesHelper().readOne(profileId, { fields: ['id', 'email_notifications'] });
      if (profile?.email_notifications === false) {
        return [];
      }
    } catch (error) {
      console.error(`${HELPER_NAME}: Failed to read the mail setting of profile ${profileId}`, error);
    }
    try {
      const users = await this.myDatabaseHelper.getUsersHelper().readByQuery({
        filter: { profile: { _eq: profileId } },
        fields: ['id', 'email'],
        limit: -1,
      });
      for (const user of users) {
        if (user.email) {
          emails.push(user.email);
        }
      }
    } catch (error) {
      console.error(`${HELPER_NAME}: Failed to load the users of profile ${profileId}`, error);
    }
    for (const appFeedback of relatedAppFeedbacks) {
      if (appFeedback.contact_email && String(ItemsServiceHelper.getPrimaryKeyFromItemOrString(appFeedback.profile)) === String(profileId)) {
        emails.push(appFeedback.contact_email);
      }
    }
    return emails;
  }

  private async mailSupport(chatId: string, messages: ChatMessage[], relatedAppFeedbacks: DatabaseTypes.AppFeedbacks[], relatedFoodFeedbacks: DatabaseTypes.FoodsFeedbacks[]): Promise<void> {
    const chatsHelper = new ItemsServiceHelper<DatabaseTypes.Chats>(this.myDatabaseHelper, CollectionNames.CHATS);
    const chat = await chatsHelper.readOne(chatId);

    const server_info = await this.myDatabaseHelper.getServerInfo();
    const project_name = server_info?.project?.project_name || 'Rocket Meals';
    const publicUrl = this.myDatabaseHelper.getServerUrl();

    const humanReadableDate = DateHelper.getHumanReadableDateAndTime(new Date());
    const subject = `${project_name} - Chat - Neue Nachricht - ${humanReadableDate}`;

    const feedbackLinks = [
      ...relatedAppFeedbacks.map(appFeedback => `- App-Feedback "${appFeedback.title || appFeedback.id}": [Antworten](${RocketMealsModulePages.getAdminUrl(publicUrl, RocketMealsModulePages.APP_FEEDBACKS, appFeedback.id)})`),
      ...relatedFoodFeedbacks.map(foodFeedback => `- Speise-Feedback "${foodFeedback.comment || foodFeedback.id}": [Antworten](${RocketMealsModulePages.getAdminUrl(publicUrl, RocketMealsModulePages.FOOD_FEEDBACKS, foodFeedback.id)})`),
    ].join('\n');

    const lines = [`Im Chat "${chat?.alias || chatId}" gibt es neue Nachrichten.`, '', '## Nachrichten', '', ChatMailDigestHelper.joinMessages(messages)];
    if (feedbackLinks) {
      lines.push('', '## Antworten', '', feedbackLinks);
    }

    await this.myDatabaseHelper.sendMail({
      recipient: MailAdresses.SupportMail,
      subject: subject,
      markdown_content: lines.join('\n'),
    });
    console.log(`${HELPER_NAME}: Mailed support about ${messages.length} new message(s) in chat ${chatId}`);
  }

  /**
   * One mail per address, in the language of the profile. It contains the messages and points to
   * the menu item "Chats" of the app to reply there; in the chat of an app feedback it also quotes
   * the feedback.
   */
  private async mailUsers(chatId: string, recipients: (UserRecipient & { messages: ChatMessage[] })[], relatedAppFeedbacks: DatabaseTypes.AppFeedbacks[]): Promise<void> {
    if (recipients.length === 0) {
      return;
    }
    const server_info = await this.myDatabaseHelper.getServerInfo();
    const projectName = server_info?.project?.project_name || 'Rocket Meals';
    const languageResolver = new BackendLanguageResolver(this.myDatabaseHelper);
    const profilesHelper = this.myDatabaseHelper.getProfilesHelper();
    const appFeedback = relatedAppFeedbacks[0];

    for (const { email, profileId, messages } of recipients) {
      try {
        // Without a readable profile the mail still goes out, in the default language.
        const profile = await profilesHelper.readOne(profileId).catch(() => undefined);
        const language = await languageResolver.resolveForProfile(profile);
        const mailInput = { answer: ChatMailDigestHelper.joinMessages(messages), projectName, translate: language.translate, supportEmail: MailAdresses.SupportMail, recipient: email };
        const mail = appFeedback ? AppFeedbackAnswerMail.buildChatAnswer({ ...mailInput, feedback: appFeedback }) : AppFeedbackAnswerMail.buildChatAnswerWithoutFeedback(mailInput);
        if (!mail) {
          continue;
        }
        await this.myDatabaseHelper.sendMail(mail);
        console.log(`${HELPER_NAME}: Mailed ${messages.length} new message(s) in chat ${chatId} to a participant`);
      } catch (error) {
        console.error(`${HELPER_NAME}: Failed to mail the new messages in chat ${chatId} to a participant`, error);
      }
    }
  }
}
