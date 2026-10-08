import {ChatHelper, CollectionNames, DatabaseTypes, DateHelper, MailAdresses} from 'repo-depkit-common';
import {ItemsServiceHelper} from '../helpers/ItemsServiceHelper';
import {MyDatabaseHelper} from '../helpers/MyDatabaseHelper';
import {PushNotificationHelper} from '../helpers/PushNotificationHelper';
import {AccountabilityHelper} from "../helpers/AccountabilityHelper";
import {PrimaryKey} from "@directus/types";
import {MyDefineHook} from "../helpers/MyDefineHook";
import {BackendLanguageResolver} from '../helpers/translations/BackendLanguageResolver';
import {AppFeedbackAnswerMail} from './AppFeedbackAnswerMail';

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

    if (!messageFromAdmin) {
      try {
        await notifySupportAboutAppFeedbackChatMessage(chatId, message, myDatabaseHelper);
      } catch (error) {
        console.error(`${HOOK_NAME}: Failed to notify support about chat message ${messageId}`, error);
      }
    } else {
      try {
        await mailAnswerToAppFeedbackContactEmail(chatId, message, myDatabaseHelper);
      } catch (error) {
        console.error(`${HOOK_NAME}: Failed to mail the answer of chat message ${messageId} to the app feedback contact email`, error);
      }
    }

    const profilesToNotify = await collectProfilesToNotify(chatId, message, myDatabaseHelper);
    const profilesArray = Array.from(profilesToNotify);
    console.log(`${HOOK_NAME}: Profiles to notify for chat ${chatId}:`, profilesArray);

    if (profilesArray.length > 0) {
      const expoPushTokens = await collectExpoPushTokensForProfiles(profilesToNotify, myDatabaseHelper);
      console.log(`${HOOK_NAME}: Expo push tokens gathered for chat ${chatId}:`, expoPushTokens);
    } else {
      console.log(`${HOOK_NAME}: No profiles to notify for chat ${chatId}`);
    }
  });
});

/**
 * Mail support when a user writes in a chat that belongs to an app feedback. Support answers
 * those requests from its mailbox, so a reply that only lands in the chat would go unnoticed.
 * Chats without a linked app feedback (e.g. food feedback chats) are not covered by this.
 */
async function notifySupportAboutAppFeedbackChatMessage(
  chatId: string,
  message: DatabaseTypes.ChatMessages,
  myDatabaseHelper: MyDatabaseHelper
): Promise<void> {
  const appFeedbacksHelper = myDatabaseHelper.getAppFeedbacksHelper();
  const relatedAppFeedbacks = await appFeedbacksHelper.findItems({ chat: chatId });

  if (relatedAppFeedbacks.length === 0) {
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
  const feedbackLinks = relatedAppFeedbacks
    .map(appFeedback => `- ${appFeedback.title || appFeedback.id}: ${publicUrl}/admin/content/app_feedbacks/${appFeedback.id}`)
    .join('\n');

  const markdown_content = [
    `Ein Nutzer hat im Chat "${chatAlias}" etwas Neues geschrieben.`,
    '',
    '## Nachricht',
    '',
    messageText,
    '',
    '## Chat',
    '',
    `${publicUrl}/admin/content/chats/${chatId}`,
    '',
    '## Zugehöriges App-Feedback',
    '',
    feedbackLinks,
  ].join('\n');

  await myDatabaseHelper.sendMail({
    recipient: MailAdresses.SupportMail,
    subject: subject,
    markdown_content: markdown_content,
  });

  console.log(`${HOOK_NAME}: Notified support about a new user message in app feedback chat ${chatId}`);
}

/**
 * Mail the answer of support to the contact email of the app feedback the chat belongs to. The
 * answer is shown in the app as well, but a user who left an email may not open the app again
 * soon. Written in the language of the feedback's profile.
 */
async function mailAnswerToAppFeedbackContactEmail(
  chatId: string,
  message: DatabaseTypes.ChatMessages,
  myDatabaseHelper: MyDatabaseHelper
): Promise<void> {
  const appFeedbacksHelper = myDatabaseHelper.getAppFeedbacksHelper();
  const relatedAppFeedbacks = await appFeedbacksHelper.findItems({ chat: chatId });
  const feedbacksWithEmail = relatedAppFeedbacks.filter(appFeedback => !!AppFeedbackAnswerMail.getRecipient(appFeedback));

  if (feedbacksWithEmail.length === 0) {
    return;
  }

  const server_info = await myDatabaseHelper.getServerInfo();
  const projectName = server_info?.project?.project_name || 'Rocket Meals';
  const languageResolver = new BackendLanguageResolver(myDatabaseHelper);
  const profilesHelper = myDatabaseHelper.getProfilesHelper();

  for (const appFeedback of feedbacksWithEmail) {
    const profileId = ItemsServiceHelper.getPrimaryKeyFromItemOrString(appFeedback.profile);
    // Without a readable profile the mail still goes out, in the default language.
    const profile = profileId ? await profilesHelper.readOne(profileId).catch(() => undefined) : undefined;
    const language = await languageResolver.resolveForProfile(profile);

    const mail = AppFeedbackAnswerMail.build({
      feedback: appFeedback,
      answer: message?.message,
      projectName,
      translate: language.translate,
    });
    if (!mail) {
      continue;
    }

    await myDatabaseHelper.sendMail(mail);
    console.log(`${HOOK_NAME}: Mailed the answer in chat ${chatId} to the contact email of app feedback ${appFeedback.id}`);
  }
}

async function collectProfilesToNotify(
  chatId: string,
  message: DatabaseTypes.ChatMessages,
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

  try {
    const foodFeedbacksHelper = myDatabaseHelper.getFoodFeedbacksHelper();
    const relatedFoodFeedbacks = await foodFeedbacksHelper.findItems({ chat: chatId });
    console.log(`${HOOK_NAME}: Found ${relatedFoodFeedbacks.length} food feedbacks for chat ${chatId}`);

    for (const foodFeedback of relatedFoodFeedbacks) {
      const feedbackProfileId = ItemsServiceHelper.getPrimaryKeyFromItemOrString(foodFeedback?.profile);
      if (feedbackProfileId) {
        profileIds.add(feedbackProfileId);
      }
    }
  } catch (error) {
    console.error(`${HOOK_NAME}: Failed to load related food feedbacks for chat ${chatId}`, error);
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
