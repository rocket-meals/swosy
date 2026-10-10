import {ChatHelper, CollectionNames, DatabaseTypes, DateHelper, MailAdresses} from 'repo-depkit-common';
import {ItemsServiceHelper} from '../helpers/ItemsServiceHelper';
import {MyDatabaseHelper} from '../helpers/MyDatabaseHelper';
import {PushNotificationHelper} from '../helpers/PushNotificationHelper';
import {AccountabilityHelper} from "../helpers/AccountabilityHelper";
import {PrimaryKey} from "@directus/types";
import {MyDefineHook} from "../helpers/MyDefineHook";
import {BackendLanguageResolver} from '../helpers/translations/BackendLanguageResolver';
import {BackendTranslationKeys} from '../helpers/translations/BackendTranslationKeys';
import {AppFeedbackAnswerMail} from '../helpers/rocket-meals-module/AppFeedbackAnswerMail';
import {RocketMealsModulePages} from '../helpers/rocket-meals-module/RocketMealsModulePages';
import {ChatMailRecipientHelper, ChatMailRecipientKind} from '../helpers/ChatMailRecipientHelper';
import {AppFeedbackStateSyncHelper} from '../helpers/AppFeedbackStateSyncHelper';
import {HookKeysHelper} from '../helpers/HookKeysHelper';

const HOOK_NAME = 'chat_conversation_state';

export default MyDefineHook.defineHookWithAllTablesExisting(HOOK_NAME, async ({ action }, apiContext) => {
  // The state of a chat – set below on every message, or by hand in the module – is also the state
  // of its app feedbacks, so an export of `app_feedbacks` shows it.
  action(CollectionNames.CHATS + '.items.update', async (meta, eventContext) => {
    const payload = meta?.payload as Partial<DatabaseTypes.Chats> | undefined;
    if (!payload?.conversation_state) {
      return;
    }
    try {
      await AppFeedbackStateSyncHelper.syncFeedbacksFromChats(new MyDatabaseHelper(apiContext, eventContext), HookKeysHelper.getKeysFromMeta(meta), payload.conversation_state);
    } catch (error) {
      console.error(`${HOOK_NAME}: Failed to sync the state of app feedbacks with their chat`, error);
    }
  });

  action(CollectionNames.CHAT_MESSAGES + '.items.create', async (meta, eventContext) => {
    const messageId = meta?.key as string | undefined;
    if (!messageId) {
      return;
    }

    console.log(`${HOOK_NAME}: Processing new chat message with ID ${messageId}`);

    const myDatabaseHelper = new MyDatabaseHelper(apiContext, eventContext);
    const chatMessagesHelper = new ItemsServiceHelper<DatabaseTypes.ChatMessages>(
      myDatabaseHelper,
      CollectionNames.CHAT_MESSAGES
    );
    const chatsHelper = new ItemsServiceHelper<DatabaseTypes.Chats>(
      myDatabaseHelper,
      CollectionNames.CHATS
    );

    const message = await chatMessagesHelper.readOne(messageId);

    console.log(`${HOOK_NAME}: Retrieved chat message:`, message);

    const chatId = message?.chat as string | undefined;
    console.log(`${HOOK_NAME}: Associated chat ID:`, chatId);
    if (!chatId) {
      return;
    }

    // Support answers from the Directus app (e.g. the module "Rocket Meals" → "Speise-Feedbacks"),
    // which is not only used by admins but also by staff roles with app access.
    let messageFromAdmin = AccountabilityHelper.isAppAccessAccountability(eventContext?.accountability || null);
    console.log(`${HOOK_NAME}: Message from admin or backend user (accountability check):`, messageFromAdmin);

    if (!messageFromAdmin) {
      const creatorId = message?.user_created as string | undefined;
      if (creatorId) {
        messageFromAdmin = await myDatabaseHelper.getUsersHelper().isAdminUser(creatorId);
      }
    }

    const conversationState = ChatHelper.getConversationStateAfterMessage(messageFromAdmin);

    console.log(`${HOOK_NAME}: Conversation state:`, conversationState);

    await chatsHelper.updateOne(chatId, { conversation_state: conversationState });

    const relatedAppFeedbacks = await findRelatedItems(() => myDatabaseHelper.getAppFeedbacksHelper().findItems({ chat: chatId }), chatId, 'app feedbacks');
    const relatedFoodFeedbacks = await findRelatedItems(() => myDatabaseHelper.getFoodFeedbacksHelper().findItems({ chat: chatId }), chatId, 'food feedbacks');

    const profilesToNotify = await collectProfilesToNotify(chatId, message, relatedAppFeedbacks, relatedFoodFeedbacks, myDatabaseHelper);
    console.log(`${HOOK_NAME}: Profiles to notify for chat ${chatId}:`, Array.from(profilesToNotify));

    let mailRecipients: AnswerMailRecipients = { users: new Map(), mailSupport: false };
    try {
      mailRecipients = await collectAnswerMailRecipients(profilesToNotify, message, relatedAppFeedbacks, messageFromAdmin, myDatabaseHelper);
    } catch (error) {
      console.error(`${HOOK_NAME}: Failed to collect the mail recipients of chat message ${messageId}`, error);
    }

    // A message of a user is for support, so is one to a participant that stands for support.
    if (!messageFromAdmin || mailRecipients.mailSupport) {
      try {
        await notifySupportAboutChatMessage(chatId, message, relatedAppFeedbacks, relatedFoodFeedbacks, myDatabaseHelper);
      } catch (error) {
        console.error(`${HOOK_NAME}: Failed to notify support about chat message ${messageId}`, error);
      }
    }

    try {
      await mailAnswerToRecipients(chatId, message, relatedAppFeedbacks, mailRecipients.users, myDatabaseHelper);
    } catch (error) {
      console.error(`${HOOK_NAME}: Failed to mail chat message ${messageId} to the other participants`, error);
    }

    if (!messageFromAdmin) {
      return;
    }

    try {
      await pushAnswerToProfiles(profilesToNotify, message, myDatabaseHelper);
    } catch (error) {
      console.error(`${HOOK_NAME}: Failed to send push notifications for chat message ${messageId}`, error);
    }
  });
});

/** The feedbacks a chat belongs to; empty when they cannot be read – notifications are best effort. */
async function findRelatedItems<T>(load: () => Promise<T[]>, chatId: string, label: string): Promise<T[]> {
  try {
    return await load();
  } catch (error) {
    console.error(`${HOOK_NAME}: Failed to load related ${label} for chat ${chatId}`, error);
    return [];
  }
}

/**
 * Mail support about a message it has to read: one of a user, or one to a participant whose
 * address stands for support (`ChatMailRecipientHelper`). Support answers those requests from its
 * mailbox, so a reply that only lands in the chat would go unnoticed. The links lead to the chat
 * pages of the module "Rocket Meals", where support answers. Internal mail to support, hence
 * German like the other reports.
 */
async function notifySupportAboutChatMessage(
  chatId: string,
  message: DatabaseTypes.ChatMessages,
  relatedAppFeedbacks: DatabaseTypes.AppFeedbacks[],
  relatedFoodFeedbacks: DatabaseTypes.FoodsFeedbacks[],
  myDatabaseHelper: MyDatabaseHelper
): Promise<void> {
  const chatsHelper = new ItemsServiceHelper<DatabaseTypes.Chats>(myDatabaseHelper, CollectionNames.CHATS);
  const chat = await chatsHelper.readOne(chatId);

  const server_info = await myDatabaseHelper.getServerInfo();
  const project_name = server_info?.project?.project_name || 'Rocket Meals';
  const publicUrl = myDatabaseHelper.getServerUrl();

  const humanReadableDate = DateHelper.getHumanReadableDateAndTime(new Date());
  const subject = `${project_name} - Chat - Neue Nachricht - ${humanReadableDate}`;

  const chatAlias = chat?.alias || chatId;
  const messageText = message?.message || '';
  const feedbackLinks = [
    ...relatedAppFeedbacks.map(appFeedback => `- App-Feedback "${appFeedback.title || appFeedback.id}": [Antworten](${RocketMealsModulePages.getAdminUrl(publicUrl, RocketMealsModulePages.APP_FEEDBACKS, appFeedback.id)})`),
    ...relatedFoodFeedbacks.map(foodFeedback => `- Speise-Feedback "${foodFeedback.comment || foodFeedback.id}": [Antworten](${RocketMealsModulePages.getAdminUrl(publicUrl, RocketMealsModulePages.FOOD_FEEDBACKS, foodFeedback.id)})`),
  ].join('\n');

  const lines = [`Im Chat "${chatAlias}" gibt es eine neue Nachricht.`, '', '## Nachricht', '', messageText];
  if (feedbackLinks) {
    lines.push('', '## Antworten', '', feedbackLinks);
  }
  const markdown_content = lines.join('\n');

  await myDatabaseHelper.sendMail({
    recipient: MailAdresses.SupportMail,
    subject: subject,
    markdown_content: markdown_content,
  });

  console.log(`${HOOK_NAME}: Notified support about a new message in chat ${chatId}`);
}

/** Where the mail about a message goes: addresses of users (with the profile for the language), and whether support gets one. */
type AnswerMailRecipients = {
  /** Lower-cased address → the address as written and the profile it belongs to. */
  users: Map<string, { email: string; profileId?: PrimaryKey }>;
  mailSupport: boolean;
};

/**
 * The addresses to mail about a message, checked before anything goes out
 * ({@link ChatMailRecipientHelper}): the account address of every other participant, and for an
 * answer of support also the contact email the author left in the app feedback. Guests and other
 * `example.com` addresses get nothing, the default admin stands for support. Users who switched
 * off mails in Directus (`email_notifications`) get nothing either.
 */
async function collectAnswerMailRecipients(
  profileIds: Set<PrimaryKey>,
  message: DatabaseTypes.ChatMessages,
  relatedAppFeedbacks: DatabaseTypes.AppFeedbacks[],
  messageFromAdmin: boolean,
  myDatabaseHelper: MyDatabaseHelper
): Promise<AnswerMailRecipients> {
  const recipients: AnswerMailRecipients = { users: new Map(), mailSupport: false };
  const addRecipient = (email: string | null | undefined, profileId: PrimaryKey | undefined) => {
    const recipient = ChatMailRecipientHelper.classify(email);
    if (recipient.kind === ChatMailRecipientKind.SUPPORT) {
      recipients.mailSupport = true;
    } else if (recipient.kind === ChatMailRecipientKind.USER) {
      const key = recipient.email.toLowerCase();
      if (!recipients.users.has(key)) {
        recipients.users.set(key, { email: recipient.email, profileId });
      }
    }
  };

  if (profileIds.size > 0) {
    const users = await myDatabaseHelper.getUsersHelper().readByQuery({
      filter: { profile: { _in: Array.from(profileIds) } },
      fields: ['id', 'email', 'profile', 'email_notifications'],
      limit: -1,
    });
    for (const user of users) {
      if (user.email_notifications === false) {
        continue;
      }
      addRecipient(user.email, ItemsServiceHelper.getPrimaryKeyFromItemOrString(user.profile));
    }
  }

  if (messageFromAdmin) {
    const senderProfileId = ItemsServiceHelper.getPrimaryKeyFromItemOrString(message?.profile);
    for (const appFeedback of relatedAppFeedbacks) {
      const ownerProfileId = ItemsServiceHelper.getPrimaryKeyFromItemOrString(appFeedback.profile);
      const writtenByOwner = !!senderProfileId && String(senderProfileId) === String(ownerProfileId);
      if (!writtenByOwner) {
        addRecipient(appFeedback.contact_email, ownerProfileId);
      }
    }
  }

  return recipients;
}

/**
 * Mail a message to the other participants, in the language of their profile. The mail contains
 * the message and points to the menu item "Chats" of the app to reply there; in the chat of an app
 * feedback it also quotes the feedback.
 */
async function mailAnswerToRecipients(
  chatId: string,
  message: DatabaseTypes.ChatMessages,
  relatedAppFeedbacks: DatabaseTypes.AppFeedbacks[],
  recipients: AnswerMailRecipients['users'],
  myDatabaseHelper: MyDatabaseHelper
): Promise<void> {
  if (recipients.size === 0) {
    return;
  }

  const server_info = await myDatabaseHelper.getServerInfo();
  const projectName = server_info?.project?.project_name || 'Rocket Meals';
  const languageResolver = new BackendLanguageResolver(myDatabaseHelper);
  const profilesHelper = myDatabaseHelper.getProfilesHelper();
  const appFeedback = relatedAppFeedbacks[0];

  for (const { email, profileId } of recipients.values()) {
    try {
      // Without a readable profile the mail still goes out, in the default language.
      const profile = profileId ? await profilesHelper.readOne(profileId).catch(() => undefined) : undefined;
      const language = await languageResolver.resolveForProfile(profile);
      const mailInput = { answer: message?.message, projectName, translate: language.translate, supportEmail: MailAdresses.SupportMail, recipient: email };
      const mail = appFeedback ? AppFeedbackAnswerMail.buildChatAnswer({ ...mailInput, feedback: appFeedback }) : AppFeedbackAnswerMail.buildChatAnswerWithoutFeedback(mailInput);
      if (!mail) {
        continue;
      }
      await myDatabaseHelper.sendMail(mail);
      console.log(`${HOOK_NAME}: Mailed the message in chat ${chatId} to a participant`);
    } catch (error) {
      console.error(`${HOOK_NAME}: Failed to mail the message in chat ${chatId} to a participant`, error);
    }
  }
}

/** Long answers are cut in the push – the whole text is in the chat. */
const PUSH_BODY_MAX_LENGTH = 180;

function getPushBody(text: string | null | undefined): string | undefined {
  const trimmed = (text || '').trim();
  if (trimmed.length === 0) {
    return undefined;
  }
  return trimmed.length > PUSH_BODY_MAX_LENGTH ? `${trimmed.substring(0, PUSH_BODY_MAX_LENGTH - 1)}…` : trimmed;
}

/** One push per profile with all its devices, titled in the language of the profile. */
async function pushAnswerToProfiles(
  profileIds: Set<PrimaryKey>,
  message: DatabaseTypes.ChatMessages,
  myDatabaseHelper: MyDatabaseHelper
): Promise<void> {
  if (profileIds.size === 0) {
    return;
  }

  const languageResolver = new BackendLanguageResolver(myDatabaseHelper);
  const profilesHelper = myDatabaseHelper.getProfilesHelper();
  const pushNotificationsHelper = myDatabaseHelper.getPushNotificationsHelper();
  const messageBody = getPushBody(message?.message);

  for (const profileId of profileIds) {
    try {
      const expoPushTokens = await collectExpoPushTokensForProfiles(new Set([profileId]), myDatabaseHelper);
      if (expoPushTokens.length === 0) {
        continue;
      }
      const profile = await profilesHelper.readOne(profileId).catch(() => undefined);
      const language = await languageResolver.resolveForProfile(profile);

      await pushNotificationsHelper.createOne({
        expo_push_tokens: expoPushTokens,
        message_title: language.translate(BackendTranslationKeys.notification_support_answer_title),
        message_body: messageBody,
      });
      console.log(`${HOOK_NAME}: Sent a push about the support answer to profile ${profileId}`);
    } catch (error) {
      console.error(`${HOOK_NAME}: Failed to send a push to profile ${profileId}`, error);
    }
  }
}

async function collectProfilesToNotify(
  chatId: string,
  message: DatabaseTypes.ChatMessages,
  relatedAppFeedbacks: DatabaseTypes.AppFeedbacks[],
  relatedFoodFeedbacks: DatabaseTypes.FoodsFeedbacks[],
  myDatabaseHelper: MyDatabaseHelper
): Promise<Set<PrimaryKey>> {
  const profileIds = new Set<PrimaryKey>();

  try {
    const chatParticipantsHelper = new ItemsServiceHelper<DatabaseTypes.ChatsParticipants>(
      myDatabaseHelper,
      CollectionNames.CHATS_PARTICIPANTS
    );
    const participantLinks = await chatParticipantsHelper.findItems({ chats_id: chatId });
    console.log(`${HOOK_NAME}: Found ${participantLinks.length} chat participantLinks for chat ${chatId}`);

    for (const participantLink of participantLinks) {
      const participantProfileId = ItemsServiceHelper.getPrimaryKeyFromItemOrString(participantLink?.profiles_id); // Attention, not participant directly.
      if (participantProfileId) {
        profileIds.add(participantProfileId);
      }
    }
  } catch (error) {
    console.error(`${HOOK_NAME}: Failed to load chat participants for chat ${chatId}`, error);
  }

  // The authors of the feedbacks, in case they are not (yet) a participant of the chat.
  for (const feedback of [...relatedAppFeedbacks, ...relatedFoodFeedbacks]) {
    const feedbackProfileId = ItemsServiceHelper.getPrimaryKeyFromItemOrString(feedback?.profile);
    if (feedbackProfileId) {
      profileIds.add(feedbackProfileId);
    }
  }

  const senderProfileId = ItemsServiceHelper.getPrimaryKeyFromItemOrString(message?.profile);
  if (senderProfileId) {
    profileIds.delete(senderProfileId);
    console.log(`${HOOK_NAME}: Removed sender profile ${senderProfileId} from notification recipients`);
  }

  return profileIds;
}

async function collectExpoPushTokensForProfiles(
  profileIds: Set<PrimaryKey>,
  myDatabaseHelper: MyDatabaseHelper
): Promise<string[]> {
  const expoTokens = new Set<string>();

  if (profileIds.size === 0) {
    return [];
  }

  const deviceHelper = myDatabaseHelper.getDevicesHelper();
  const profileIdArray = Array.from(profileIds);

  try {
    for (const profileId of profileIdArray || []) {
      const devices = await deviceHelper.readManyByProfileId(profileId);
      console.log(
        `${HOOK_NAME}: Found ${devices.length} devices for profile ${profileId ?? 'unknown'}`
      );

      for (const device of devices) {
        const expoToken = PushNotificationHelper.getExpoPushTokenFromDevice(device);
        if (expoToken) {
          expoTokens.add(expoToken);
        }
      }
    }
  } catch (error) {
    console.error(`${HOOK_NAME}: Failed to load devices for profiles ${profileIdArray.join(', ')}`, error);
  }

  return Array.from(expoTokens);
}
