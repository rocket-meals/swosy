import {defineHook} from '@directus/extensions-sdk';
import {DatabaseInitializedCheck} from "../helpers/DatabaseInitializedCheck";
import {CollectionNames} from "../helpers/CollectionNames";
import {DirectusFiles, Mails} from "../databaseTypes/types";
import {EmailOptions, MailService as MailServiceType} from "@directus/api/dist/services/mail";
import {DEFAULT_HTML_TEMPLATE} from "../helpers/html/HtmlGenerator";
import {MyDatabaseHelper} from "../helpers/MyDatabaseHelper";
import {MailHelper} from "../helpers/mail/MailHelper";

const SCHEDULE_NAME = "food_feedback_report";

enum MAIL_SEND_STATUS {
	SUCCESS = "success",
	PENDING = "pending",
	FAILED = "failed"
}

export type MailAttachment = {
	filename: string,
	content: string | Buffer,
	contentType?: string,
	enconding?: string,
} | {
	filename: string,
	path: string,
} | {
	raw: string,
}

export type EmailDownloadLink = {
	name: string,
	url: string,
}

export default defineHook(async ({schedule, action, filter}, apiContext) => {
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

	/**
	// schedule for deleting old mail files every minute
	const cronFrequency = '0 * * * * *'; // every minute
	schedule(cronFrequency, async () => {
		let myDatabaseHelper = new MyDatabaseHelper(apiContext);
		// search for mails files where the mails_id is null
		let mailsFilesHelper = await myDatabaseHelper.getMailsFilesHelper();
		let mailsFiles = await mailsFilesHelper.findItems({
			mails_id: null
		});
		for(let mailsFile of mailsFiles){
			let file_id: string | undefined = undefined
			let file_id_raw = mailsFile.directus_files_id;
			if(!!file_id_raw){
				if(typeof file_id_raw === 'string') {
					file_id = file_id_raw;
				} else {
					file_id = file_id_raw.id;
				}
			}
			if(!file_id){
				console.log("schedule: file_id is undefined - skipping");
			} else {
				let filesHelper = await myDatabaseHelper.getFilesHelper();
				console.log(" - deleting file with id: ", file_id);
				try{
					let file = await filesHelper.deleteOne(file_id);
					// delete the mails file
					await mailsFilesHelper.deleteOne(mailsFile.id);
				} catch (error: any) {
					console.error("Schedule: Error deleting file: ", error);
				}
			}
		}
	});
		*/

	action(CollectionNames.MAILS_FILES+'.items.create', async (meta, eventContext) => {
		let id = meta.key;
		let myDatabaseHelper = new MyDatabaseHelper(apiContext);
		let mailsHelper = await myDatabaseHelper.getMailsHelper();
		// get the mail get the attachments (directus_files), then set the mail_id for the attachments (directus_files)
		let mailsFilesHelper = await myDatabaseHelper.getMailsFilesHelper();
		console.log("Action get mail file with id: ", id);
		let mailsFile = await mailsFilesHelper.readOne(id);
		console.log("Action found mail files: ");

		let directus_files_id: string | undefined = undefined
		let directus_files_id_raw = mailsFile.directus_files_id;
		if(!!directus_files_id_raw){
			if(typeof directus_files_id_raw === 'string') {
				directus_files_id = directus_files_id_raw;
			} else {
				directus_files_id = directus_files_id_raw.id;
			}
		}
		if(!directus_files_id){
			console.log("Action: directus_files_id is undefined - skipping");
			return;
		}
		console.log("Action: found directus_files_id: ", directus_files_id);
		let filesHelper = myDatabaseHelper.getFilesHelper();
		try{
			console.log("Action: setting mails_files_id ", mailsFile.id, " for file: ", directus_files_id);
			await filesHelper.updateOne(directus_files_id, {
				mails_files_id: mailsFile.id,
			});
		} catch (error: any) {
			console.error("Action: Error setting mail_id for file: ", error);
		}

	});

	filter("shares.create", async (input, meta, eventContext) => {
		console.log("Filter: shares.create: ")
		console.log(JSON.stringify(input, null, 2));
		console.log("Accountability: ")
		console.log(JSON.stringify(eventContext.accountability, null, 2));
		return input;
	});

	// filter all update actions where from value running to start want to change, since this is not allowed
	filter<Partial<Mails>>(CollectionNames.MAILS+'.items.create', async (input: Partial<Mails>, meta, eventContext) => {
		// TODO: Maybe outsource this into a workflow instead of a filter
		let myDatabaseHelper = new MyDatabaseHelper(apiContext, eventContext);

		console.log("Filter: Mails create: ", input);
		input.send_status = MAIL_SEND_STATUS.PENDING;

		let send_attachments_as_links = input.send_attachments_as_links;
		if(send_attachments_as_links===undefined){
			send_attachments_as_links = true; // default
		}

		if(!input.template_name){
			input.template_name =  DEFAULT_HTML_TEMPLATE;
		}

		try{
			let attachments: MailAttachment[] = [];

			console.log("input: ")
			console.log(JSON.stringify(input, null, 2));

			// Bei einem Create mit einem neuen Attachment, welches vorher nocht nicht existierte.
			//input:
			//{
			//  "attachments": {
			//    "create": [
			//      {
			//        "mails_id": "+",
			//        "directus_files_id": {
			//          "id": "377d913a-1465-47ce-8db7-8954c9474e21"
			//        }
			//      }
			//    ],
			//    "update": [],
			//    "delete": []
			//  },
			//  "send_status": "pending",
			//  "template_name": "base-german-markdown-content"
			//}

			let directus_files_ids: string[] = [];
			if(input.attachments){
				// @ts-ignore - create is not always defined
				let attachments_create = input.attachments.create;
				if(attachments_create){
					for(let attachment of attachments_create){
						let directus_files_id_raw = attachment.directus_files_id as DirectusFiles | string | undefined;
						if(!!directus_files_id_raw){
							if(typeof directus_files_id_raw === 'string') {
								directus_files_ids.push(directus_files_id_raw);
							} else {
								directus_files_ids.push(directus_files_id_raw.id);
							}
						}
					}
				}
			}


			let filesHelper = myDatabaseHelper.getFilesHelper();
			let downloadLinks: EmailDownloadLink[] = [];
			for(let directus_files_id of directus_files_ids){
				try{
					let direcuts_file = await filesHelper.readOne(directus_files_id);
					// filename_disk is the name of the file on the server - its cryptic
					if(send_attachments_as_links){
						let name = direcuts_file.filename_disk || direcuts_file.filename_download || "file";
						let shareLink = await filesHelper.createDirectusFilesShareLink({
							directus_files_id: directus_files_id,
							// TODO: hier noch die Mail_id mitgeben, geht aber nur nach dem erstellen der mail oder im workflow
							name: name,
						});
						if(shareLink){
							downloadLinks.push({
								name: name,
								url: shareLink,
							});
						}
					} else {
						// https://github.com/directus/directus/issues/23937
						// https://nodemailer.com/message/attachments/
						let buffer = await filesHelper.readFileContent(directus_files_id);
						attachments.push({
							filename: direcuts_file.filename_download,
							content: buffer,
						});
					}
				} catch (error: any) {
					console.error("Filter: Error reading file: ", error);
				}

			}

			let markdown_content = input.markdown_content;
			if(downloadLinks.length>0){
				markdown_content += "\n\n";
				markdown_content += `
Sie können die Anhänge über folgende Links herunterladen:

					`
				for(let downloadLink of downloadLinks){
					markdown_content += `
[${downloadLink.name}](${downloadLink.url})
					`
				}
			}
			input.markdown_content = markdown_content;

			let data = MailHelper.getHtmlTemplateDataFromMail(input);

			let email_delivery = await sendMail({
				to: input.recipient,
				subject: input.subject,
				template: {
					name: input.template_name,
					data: data,
				},
				attachments: attachments,
			});
			input.send_status = MAIL_SEND_STATUS.SUCCESS;
			input.log = JSON.stringify(email_delivery, null, 2);

		} catch (error: any) {
			input.send_status = MAIL_SEND_STATUS.FAILED;
			input.log = error.toString();
		}

		return input;
	});
});
