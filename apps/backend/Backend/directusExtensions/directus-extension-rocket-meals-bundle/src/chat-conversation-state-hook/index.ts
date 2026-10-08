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
import {AppFeedbackChatHelper} from '../helpers/rocket-meals-module/AppFeedbackChatHelper';
import {RocketMealsModulePages} from '../helpers/rocket-meals-module/RocketMealsModulePages';

const HOOK_NAME = 'chat_conversation_state';

export default MyDefineHook.defineHookWithAllTablesExisting(HOOK_NAME, async ({ action }, apiContext) => {
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

    if (!messageFromAdmin) {
      try {
        await notifySupportAboutFeedbackChatMessage(chatId, message, relatedAppFeedbacks, relatedFoodFeedbacks, myDatabaseHelper);
      } catch (error) {
        console.error(`${HOOK_NAME}: Failed to notify support about chat message ${messageId}`, error);
      }
      return;
    }

    try {
      await mailAnswerToAppFeedbackContactEmail(chatId, message, relatedAppFeedbacks, myDatabaseHelper);
    } catch (error) {
      console.error(`${HOOK_NAME}: Failed to mail the answer of chat message ${messageId} to the app feedback contact email`, error);
    }

    try {
      const profilesToNotify = await collectProfilesToNotify(chatId, message, relatedAppFeedbacks, relatedFoodFeedbacks, myDatabaseHelper);
      console.log(`${HOOK_NAME}: Profiles to notify for chat ${chatId}:`, Array.from(profilesToNotify));
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
 * Mail support when a user writes in a chat that belongs to an app or food feedback. Support
 * answers those requests from its mailbox, so a reply that only lands in the chat would go
 * unnoticed. The links lead to the chat pages of the module "Rocket Meals", where support answers.
 * Internal mail to support, hence German like the other reports.
 */
async function notifySupportAboutFeedbackChatMessage(
  chatId: string,
  message: DatabaseTypes.ChatMessages,
  relatedAppFeedbacks: DatabaseTypes.AppFeedbacks[],
  relatedFoodFeedbacks: DatabaseTypes.FoodsFeedbacks[],
  myDatabaseHelper: MyDatabaseHelper
): Promise<void> {
  if (relatedAppFeedbacks.length === 0 && relatedFoodFeedbacks.length === 0) {
    return;
  }

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

  const markdown_content = [
    `Ein Nutzer hat im Chat "${chatAlias}" etwas Neues geschrieben.`,
    '',
    '## Nachricht',
    '',
    messageText,
    '',
    '## Antworten',
    '',
    feedbackLinks,
  ].join('\n');

  await myDatabaseHelper.sendMail({
    recipient: MailAdresses.SupportMail,
    subject: subject,
    markdown_content: markdown_content,
  });

  console.log(`${HOOK_NAME}: Notified support about a new user message in feedback chat ${chatId}`);
}

/**
 * Mail the author of an app feedback about an answer in its chat, when they left a contact email.
 * The mail contains the answer and points to the menu item "Chats" of the app to reply there.
 * A message of the author themselves is never mailed back to them.
 */
async function mailAnswerToAppFeedbackContactEmail(
  chatId: string,
  message: DatabaseTypes.ChatMessages,
  relatedAppFeedbacks: DatabaseTypes.AppFeedbacks[],
  myDatabaseHelper: MyDatabaseHelper
): Promise<void> {
  const senderProfileId = ItemsServiceHelper.getPrimaryKeyFromItemOrString(message?.profile);
  const feedbacksToMail = relatedAppFeedbacks.filter(appFeedback => {
    const ownerProfileId = ItemsServiceHelper.getPrimaryKeyFromItemOrString(appFeedback.profile);
    const writtenByOwner = !!senderProfileId && String(senderProfileId) === String(ownerProfileId);
    return !writtenByOwner && !!AppFeedbackChatHelper.getContactEmail(appFeedback);
  });

  if (feedbacksToMail.length === 0) {
    return;
  }

  const server_info = await myDatabaseHelper.getServerInfo();
  const projectName = server_info?.project?.project_name || 'Rocket Meals';
  const languageResolver = new BackendLanguageResolver(myDatabaseHelper);
  const profilesHelper = myDatabaseHelper.getProfilesHelper();

  for (const appFeedback of feedbacksToMail) {
    const profileId = ItemsServiceHelper.getPrimaryKeyFromItemOrString(appFeedback.profile);
    // Without a readable profile the mail still goes out, in the default language.
    const profile = profileId ? await profilesHelper.readOne(profileId).catch(() => undefined) : undefined;
    const language = await languageResolver.resolveForProfile(profile);

    const mail = AppFeedbackAnswerMail.buildChatAnswer({
      feedback: appFeedback,
      answer: message?.message,
      projectName,
      translate: language.translate,
      supportEmail: MailAdresses.SupportMail,
    });
    if (!mail) {
      continue;
    }

    await myDatabaseHelper.sendMail(mail);
    console.log(`${HOOK_NAME}: Mailed the answer in chat ${chatId} to the contact email of app feedback ${appFeedback.id}`);
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
