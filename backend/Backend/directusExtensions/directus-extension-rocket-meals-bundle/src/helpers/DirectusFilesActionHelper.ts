import {CollectionNames} from "./CollectionNames";
import {MyDatabaseHelper} from "./MyDatabaseHelper";
import {RegisterFunctions} from "@directus/extensions";

export class DirectusFilesActionHelper {

    public static registerAction<T>(registerFunctions: RegisterFunctions, myDatabaseHelper: MyDatabaseHelper, collectionName: CollectionNames) {
        const {action} = registerFunctions;
        action(collectionName+'.items.create', async (meta, eventContext) => {
            let id = meta.key;
            let collectionHelper = await myDatabaseHelper.getItemsServiceHelper<T>(collectionName);
            let item = await collectionHelper.readOne(id);

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
    }

}

