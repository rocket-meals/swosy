import axios from 'axios';
import {CollectionNames, DatabaseTypes} from 'repo-depkit-common';
import {ItemsServiceHelper} from '../helpers/ItemsServiceHelper';
import {MyDatabaseHelper} from '../helpers/MyDatabaseHelper';
import {MyDefineHook} from "../helpers/MyDefineHook";

const SCHEDULE_NAME = 'push_notification';

/** Reads the expo push tokens of the payload, which arrive as JSON string (update) or as array (create). */
function resolveExpoPushTokens(payload: DatabaseTypes.PushNotifications): string[] | undefined {
  const expo_push_tokens_raw = payload.expo_push_tokens;

  // check if expo_push_tokens is a string or an array of strings and convert to array of strings
  if (typeof expo_push_tokens_raw === 'string') {
    // this happens on update in directus admin panel
    console.log('expo_push_tokens is a string');
    return JSON.parse(expo_push_tokens_raw);
  }
  if (typeof expo_push_tokens_raw === 'object') {
    // this happens on create in directus admin panel
    console.log('expo_push_tokens is an object');
  }
  return payload.expo_push_tokens as string[] | undefined;
}

/** Rich content (e.g. an image) of the notification. Can't be null, otherwise it will result in an error from expo. */
function resolveRichContent(payload: DatabaseTypes.PushNotifications): any {
  // https://github.com/expo/expo/discussions/27980
  let richContent: any = undefined; // https://docs.expo.dev/push-notifications/sending-notifications/#message-request-format

  const payload_image_url = payload.image_url;
  // check if image_url is set, is a string and a url
  if (payload_image_url && typeof payload_image_url === 'string' && payload_image_url.startsWith('http')) {
    richContent = {
      image: payload_image_url,
    };
  }
  if (payload.richContent) {
    // check if richContent is set
    if (typeof payload.richContent === 'string') {
      richContent = JSON.parse(payload.richContent);
    } else if (typeof payload.richContent === 'object') {
      richContent = payload.richContent;
    }
  }
  return richContent;
}

/** The number on the app icon (iOS); 0 removes it, empty leaves it as it is. Can't be null, otherwise it will result in an error from expo. */
function resolveBadge(payload: DatabaseTypes.PushNotifications): number | undefined {
  const badgeRaw = typeof payload.ios_badge_count === 'string' ? Number.parseInt(payload.ios_badge_count, 10) : payload.ios_badge_count;
  if (typeof badgeRaw === 'number' && Number.isInteger(badgeRaw) && badgeRaw >= 0) {
    return badgeRaw;
  }
  return undefined;
}

export default MyDefineHook.defineHookWithAllTablesExisting(SCHEDULE_NAME,({ filter }, apiContext) => {
  const collectionName = CollectionNames.PUSH_NOTIFICATIONS;
  const myDatabaseHelper = new MyDatabaseHelper(apiContext);

  // Trigger before the item is created or updated
  filter<Partial<DatabaseTypes.PushNotifications>>(collectionName + '.items.create', async (input: any, { collection }) => {
    //console.log("items.create")
    //console.log("input")
    //console.log(input)#

    if (ItemsServiceHelper.isStatusUndefined(input)) {
      input = ItemsServiceHelper.setStatusPublished(input);
    }
    if (ItemsServiceHelper.isStatusPublished(input)) {
      await sendNotification(input, input);
    }
    return input;
  });

  // Merge the updated fields into the current item for a single key, and send the
  // notification if the merged item is now published. Returns the (possibly updated) input.
  async function mergeUpdateAndNotifyIfPublished(itemService: ReturnType<typeof myDatabaseHelper.getPushNotificationsHelper>, currentItemId: any, input: Partial<DatabaseTypes.PushNotifications>) {
    const currentItems = await itemService.readByQuery({
      filter: { id: currentItemId },
    });

    if (!currentItems || currentItems.length === 0) {
      throw new Error(`Item with ID ${currentItemId} not found`);
    }

    const currentItem = currentItems[0];
    if (!currentItem) {
      return input;
    }

    // Selectively merge the current item with the updated fields
    for (const key in input) {
      // @ts-ignore - we want to copy the value from input to currentItem
      if (input[key] !== undefined) {
        // @ts-ignore - we want to copy the value from input to currentItem
        currentItem[key] = input[key];
      }
    }
    if (ItemsServiceHelper.isStatusPublished(currentItem)) {
      await sendNotification(currentItem, input);
      return ItemsServiceHelper.setStatusPublished(input);
    }
    return input;
  }

  filter<Partial<DatabaseTypes.PushNotifications>>(collectionName + '.items.update', async (input: Partial<DatabaseTypes.PushNotifications>, { keys, collection }) => {
    let itemService = myDatabaseHelper.getPushNotificationsHelper();

    // Fetch the current item from the database
    if (!keys || keys.length === 0) {
      throw new Error('No keys provided for update');
    }

    for (const key of keys) {
      const currentItemId = key; // Assuming only one item is being updated
      input = await mergeUpdateAndNotifyIfPublished(itemService, currentItemId, input); // NOSONAR S9382 - sequential on purpose: input is accumulated across iterations (each merge uses the previous result) and each step may send a push notification
    }

    return input;
  });

  // Function to send Expo push notification
  async function sendNotification(payload: DatabaseTypes.PushNotifications, input: any) {
    console.log('Sending notification...');
    console.log('Payload:');
    console.log(payload);
    const expoPushTokens = resolveExpoPushTokens(payload);

    if (!expoPushTokens) {
      //console.log("expoPushTokens is empty")
      input.status = 'failed';
      input.status_log = 'expo_push_tokens is empty';
      throw new Error(`expo_push_tokens is empty`);
    }

    console.log('expoPushTokens:');
    console.log(expoPushTokens);

    // title, body and data can't be null, otherwise it will result in an error from expo
    const title: string | undefined = payload.message_title || undefined;
    const body: string | undefined = payload.message_body || undefined;
    const data: any = payload.message_data || undefined;

    // Every token should be: "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]" (with the ExponentPushToken prefix and square brackets)

    const richContent = resolveRichContent(payload);
    const badge = resolveBadge(payload);

    const messages = expoPushTokens.map(token => ({
      to: token,
      sound: 'default',
      title: title, // Replace with the actual field name
      body: body, // Replace with the actual field name
      data: data, // Replace with the actual field name
      richContent: richContent, // https://github.com/expo/expo/discussions/27980#discussioncomment-12934879
      badge: badge, // https://docs.expo.dev/push-notifications/sending-notifications/#message-request-format
    }));

    console.log('Messages:');
    console.log(messages);

    try {
      await axios.post('https://exp.host/--/api/v2/push/send', messages);
      input.status_log = 'success';
    } catch (e: any) {
      console.log(`Failed to send notification: ${e.message}`);
      input.status = 'failed';
      input.status_log = e?.message.toString();
      throw new Error(`Failed to send notification: ${e.message}`);
    }
  }
});
