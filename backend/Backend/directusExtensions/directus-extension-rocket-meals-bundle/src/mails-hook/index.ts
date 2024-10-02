import {defineHook} from '@directus/extensions-sdk';
import {DatabaseInitializedCheck} from "../helpers/DatabaseInitializedCheck";
import {CollectionNames} from "../helpers/CollectionNames";
import {Mails} from "../databaseTypes/types";
import {EmailOptions, MailService as MailServiceType} from "@directus/api/dist/services/mail";

const SCHEDULE_NAME = "food_feedback_report";

export default defineHook(async ({schedule, filter}, apiContext) => {
	let allTablesExist = await DatabaseInitializedCheck.checkAllTablesExistWithApiContext(SCHEDULE_NAME,apiContext);
	if (!allTablesExist) {
		return;
	}

	async function sendMail(options: EmailOptions) {
		let {MailService} = apiContext.services;
		const getSchema = apiContext.getSchema;
		const database = apiContext.database;
		const schema = await getSchema();
		let mailService: MailServiceType = new MailService({
			accountability: null, //this makes us admin
			knex: database, //TODO: i think this is not neccessary
			schema: schema,
		});
		return await mailService.send(options);
	}

	const collection = CollectionNames.MAILS;

	// filter all update actions where from value running to start want to change, since this is not allowed
	filter<Partial<Mails>>(collection+'.items.create', async (input: Partial<Mails>, {collection}) => {

		try{
			await sendMail({
				to: input.recipient,
				subject: input.subject,
				template: {
					name: input.template_name,
					data: input.template_data,
				}
			});
		} catch (error) {
			console.error(error);
			throw error;
		}

		return input;
	});
});
