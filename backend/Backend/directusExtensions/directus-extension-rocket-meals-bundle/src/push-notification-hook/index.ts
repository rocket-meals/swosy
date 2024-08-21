import { defineHook } from '@directus/extensions-sdk';
import axios from "axios";
import {ItemsServiceCreator} from "../helpers/ItemsServiceCreator";
import {CollectionNames} from "../helpers/CollectionNames";
import {DatabaseInitializedCheck} from "../helpers/DatabaseInitializedCheck";
import {PushNotifications} from "../databaseTypes/types";

const SCHEDULE_NAME = "push_notification";

export default defineHook(async ({filter}, apiContext) => {
	const collectionName = CollectionNames.PUSH_NOTIFICATIONS

	let allTablesExist = await DatabaseInitializedCheck.checkAllTablesExistWithApiContext(SCHEDULE_NAME,apiContext);
	if (!allTablesExist) {
		return;
	}

	// Trigger before the item is created or updated
	filter(collectionName+'.items.create', async (input: any, {collection}) => {
		//console.log("items.create")
		//console.log("input")
		//console.log(input)
		if (input.status === 'published') {
			await sendNotification(input, input);
			input.status = 'published';
		}
		return input;
	});

	filter(collectionName+'.items.update', async (input: any, {keys, collection}) => {
		const itemsServiceCreator = new ItemsServiceCreator(apiContext);

		let itemService = await itemsServiceCreator.getItemsService<PushNotifications>(collection);

		// Fetch the current item from the database
		if (!keys || keys.length === 0) {
			throw new Error("No keys provided for update");
		}

		for(let i = 0; i < keys.length; i++) {
			let key = keys[i];
			const currentItemId = key; // Assuming only one item is being updated
			const currentItems = await itemService.readByQuery({
				filter: { id: currentItemId }
			});

			if (!currentItems || currentItems.length === 0) {
				throw new Error(`Item with ID ${currentItemId} not found`);
			}

			const currentItem = currentItems[0];

			// Selectively merge the current item with the updated fields
			if(!!currentItem){
				for (const key in input) {
					if (input[key] !== undefined) {
						currentItem[key] = input[key];
					}
				}
				if (currentItem.status === 'published') {
					await sendNotification(currentItem, input);
					input.status = 'published';
				}
			}
		}

		return input;
	});

	// Function to send Expo push notification
	async function sendNotification(payload: PushNotifications, input: any) {
		//console.log("Sending notification...")
		//console.log("Payload:")
		//console.log(payload)
		let expo_push_tokens_raw = payload.expo_push_tokens;

		let expoPushTokens = payload.expo_push_tokens as string[] | undefined;

		// check if expo_push_tokens is a string or an array of strings and convert to array of strings
		if (typeof expo_push_tokens_raw === 'string') { // this happens on update in directus admin panel
			//console.log("expo_push_tokens is a string")
			expoPushTokens = JSON.parse(expo_push_tokens_raw);
		} else if (typeof expo_push_tokens_raw === 'object') { // this happens on create in directus admin panel
			//console.log("expo_push_tokens is an object")
		}

		if(!expoPushTokens) {
			//console.log("expoPushTokens is empty")
			input.status = 'failed';
			input.status_log = "expo_push_tokens is empty";
			throw new Error(`expo_push_tokens is empty`);
		}

		//console.log("expoPushTokens:")
		//console.log(expoPushTokens)

		let title: string | undefined = undefined; // can't be null, otherwise it will result in an error from expo
		if(payload.message_title) { // check if message_title is set
			title = payload.message_title;
		}

		let body: string | undefined = undefined; // can't be null, otherwise it will result in an error from expo
		if(payload.message_body) { // check if message_body is set
			body = payload.message_body;
		}

		let data: any | undefined = undefined; // can't be null, otherwise it will result in an error from expo
		if(payload.message_data) { // check if message_data is set
			data = payload.message_data;
		}

		// Every token should be: "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]" (with the ExponentPushToken prefix and square brackets)

		const messages = expoPushTokens.map(token => ({
			to: token,
			sound: 'default',
			title: title, // Replace with the actual field name
			body: body, // Replace with the actual field name
			data: data, // Replace with the actual field name
		}));

		//console.log("Messages:")
		//console.log(messages)

		try {
			await axios.post('https://exp.host/--/api/v2/push/send', messages);
		} catch (e: any) {
			console.log(`Failed to send notification: ${e.message}`)
			input.status = 'failed';
			input.status_log = e?.message.toString();
			throw new Error(`Failed to send notification: ${e.message}`);
		}
	}
});
