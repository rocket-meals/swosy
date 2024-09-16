import {defineHook} from '@directus/extensions-sdk';
import {DatabaseInitializedCheck} from "../helpers/DatabaseInitializedCheck";
import {CollectionNames} from "../helpers/CollectionNames";
import {MyDatabaseHelper} from "../helpers/MyDatabaseHelper";
import {DateHelper} from "../helpers/DateHelper";

const SCHEDULE_NAME = "activity_auto_cleanup";


type AppFeedbackMailTemplateVariablesType = {
    subject: string,
    feedbacks: {
        id: string,
        positive: boolean | undefined | null,
        title: string,
        content: string,
        contract_email: string,
        date_created: string,
        device: {
            device_platform: string | undefined | null,
            device_brand: string | undefined | null,
            device_system_version: string | undefined | null,
            display_height: number | undefined | null,
            display_width: number | undefined | null,
            display_fontscale: number | undefined | null,
            display_pixelratio: number | undefined | null,
            display_scale: number | undefined | null,
        }
    }[]
}

export default defineHook(async ({schedule, action}, apiContext) => {
    let allTablesExist = await DatabaseInitializedCheck.checkAllTablesExistWithApiContext(SCHEDULE_NAME,apiContext);
    if (!allTablesExist) {
        return;
    }

    const myDatabaseHelper = new MyDatabaseHelper(apiContext);
    const appFeedbacksHelper = myDatabaseHelper.getAppFeedbacksHelper();

    // TODO: Create a table for app-feedbacks-settings
    // There we can store to which emails we should send the feedbacks and at which time or on a daily basis

    const toMail = "info@baumgartner-software.de";

    action(CollectionNames.APP_FEEDBACKS+".items.create", async (meta) => {
        let app_feedback_id = meta.key;

        let app_feedback = await appFeedbacksHelper.readOne(app_feedback_id);
        if (!app_feedback) {
            return;
        }

        const server_info = await myDatabaseHelper.getServerInfo();
        const project_name = server_info.project.project_name || "Rocket Meals";

        const now = new Date();
        const humanReadableDate = DateHelper.getHumanReadableDateAndTime(now);
        const subject = project_name+" - App Feedbacks - "+humanReadableDate;

        const dateCreated = new Date(app_feedback.date_created || new Date());
        const dateHumanReadable = DateHelper.getHumanReadableDateAndTime(dateCreated);

        const app_feedback_device = {
            device_platform: app_feedback.device_platform,
            device_brand: app_feedback.device_brand,
            device_system_version: app_feedback.device_system_version,
            display_height: app_feedback.display_height,
            display_width: app_feedback.display_width,
            display_fontscale: app_feedback.display_fontscale,
            display_pixelratio: app_feedback.display_pixelratio,
            display_scale: app_feedback.display_scale,
        }

        const data: AppFeedbackMailTemplateVariablesType = {
            subject: subject,
            feedbacks: [
                {
                    id: app_feedback.id,
                    positive: app_feedback.positive,
                    title: app_feedback.title || "Kein Titel",
                    content: app_feedback.content || "Kein Inhalt",
                    contract_email: app_feedback.contact_email || "Keine Email",
                    date_created: dateHumanReadable,
                    device: app_feedback_device
                }
            ]
        }

        await myDatabaseHelper.sendMail({
            to: toMail,
            subject: subject,
            template: {
                name: "app-feedbacks",
                data: data // See --> ReportGenerator.js
            },
        })

    });
});
