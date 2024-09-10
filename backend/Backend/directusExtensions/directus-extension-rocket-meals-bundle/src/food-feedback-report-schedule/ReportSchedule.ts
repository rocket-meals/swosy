import moment from "moment"
import {ReportGenerator, ReportType} from "./ReportGenerator";
import {ItemsServiceCreator} from "../helpers/ItemsServiceCreator";
import {CollectionNames} from "../helpers/CollectionNames";
import {ApiContext} from "../helpers/ApiContext";
import {
    CanteenFoodFeedbackReportSchedules,
    CanteenFoodFeedbackReportSchedulesCanteens,
    CanteenFoodFeedbackReportSchedulesReportRecipients,
    Canteens,
    ReportRecipients
} from "../databaseTypes/types";
import {MyDatabaseHelper} from "../helpers/MyDatabaseHelper";
import {DateHelper} from "../helpers/DateHelper";
import {PrimaryKey} from "@directus/types";

const TABLENAME_RECIPIENTS = CollectionNames.CANTEEN_FOOD_FEEDBACK_REPORT_SCHEDULES


const SCHEDULE_NAME = "CanteenFoodFeedbackReportSchedule";

export class ReportSchedule {
    private apiContext: ApiContext;

    constructor(apiContext: ApiContext) {
        this.apiContext = apiContext
    }

    async isEnabled() {
        const databaseHelper = new MyDatabaseHelper(this.apiContext);
        return await databaseHelper.getAppSettingsHelper().isCanteenReportEnabled();
    }

    async run() {
        //console.log("[Run] " + SCHEDULE_NAME)
        let enabled = await this.isEnabled();
        if (enabled) {
            //console.log("[Start] " + SCHEDULE_NAME);

            let reportGenerator = new ReportGenerator(this.apiContext);

            try {
                // 1. get all recipients entries
                let reportSchedules = await this.getAllReportSchedules();

                // 2. check for every recipient if a report is needed to be sent
                for (let reportSchedule of reportSchedules) {

                    //console.log("reportSchedule.id: "+reportSchedule.id)
                    let generateReportForDate = await this.getDateForWhichTheReportShouldBeSend(reportSchedule);
                    //console.log("generateReportForDate: "+generateReportForDate)
                    if (generateReportForDate) {
                        let recipientEmailList = await this.getRecipientEmailList(reportSchedule);

                        if(recipientEmailList.length>0){
                            let canteenEntries = await this.getCanteenEntries(reportSchedule);
                            if(canteenEntries.length>0){
                                try {
                                    // 3. send report
                                    let report_feedback_period_days = reportSchedule?.report_feedback_period_days
                                    let generated_report_data: ReportType = await reportGenerator.generateReportJSON(reportSchedule, generateReportForDate, report_feedback_period_days, canteenEntries)
                                    if(!!generated_report_data){
                                        for(let toMail of recipientEmailList){
                                            await this.sendReport(generateReportForDate, generated_report_data, reportSchedule, canteenEntries, toMail);
                                        }
                                        await this.setNextReportDate(generateReportForDate, reportSchedule);
                                        await this.updateReportLogSuccess(generateReportForDate, reportSchedule);
                                    } else {
                                        await this.logReportSendError(reportSchedule, "No report could be generated. Please contact admin and tell him: await reportGenerator.generateReportForMail(generateReportForDate)");
                                    }
                                } catch (err) {
                                    // 3.1 if sending the report failed, log the error
                                    await this.logReportSendError(reportSchedule, err);
                                }
                            } else {
                                await this.logReportSendError(reportSchedule, "No canteen set.");
                            }
                        } else {
                            await this.logReportSendError(reportSchedule, "No emails given.");
                        }
                    }
                }

                //console.log("Finished " + SCHEDULE_NAME);
            } catch (err) {
                console.log("Error in " + SCHEDULE_NAME);
                console.log(err);
            }
        }
    }

    async getRecipientEmailList(reportSchedule: CanteenFoodFeedbackReportSchedules): Promise<string[]>{
        const itemsServiceCreator = new ItemsServiceCreator(this.apiContext);

        let report_schedule_report_recipients_service = await itemsServiceCreator.getItemsService<CanteenFoodFeedbackReportSchedulesReportRecipients>(CollectionNames.CANTEEN_FOOD_FEEDBACK_REPORT_SCHEDULES_REPORT_RECIPIENTS)

        let report_schedule_report_recipients = await report_schedule_report_recipients_service.readByQuery({
            filter: {
                canteen_food_feedback_report_schedules_id: {
                    _eq: reportSchedule.id
                }
            },
            limit: -1
        });

        let report_recipients_primary_keys: PrimaryKey[] = []
        for(let report_schedule_report_recipient of report_schedule_report_recipients){
            let recipient_id = report_schedule_report_recipient.report_recipients_id;
            if(!!recipient_id && typeof recipient_id === "string"){
                report_recipients_primary_keys.push(recipient_id as PrimaryKey);
            }
        }

        let report_recipients_service = await itemsServiceCreator.getItemsService<ReportRecipients>(CollectionNames.REPORT_RECIPIENTS)
        let report_recipients = await report_recipients_service.readMany(report_recipients_primary_keys);

        let list: string[] = [];
        for(let report_recipient of report_recipients){
            let email = report_recipient.mail;
            if(!!email){
                list.push(email);
            }
        }

        return list;
    }

    async getCanteenEntries(recipientEntry: CanteenFoodFeedbackReportSchedules): Promise<Canteens[]>{
        const itemsServiceCreator = new ItemsServiceCreator(this.apiContext);
        let itemService = await itemsServiceCreator.getItemsService<CanteenFoodFeedbackReportSchedulesCanteens>(CollectionNames.CANTEEN_FOOD_FEEDBACK_REPORT_SCHEDULES_CANTEENS)
        let scheduleCanteens = await itemService.readByQuery({
            filter: {
                canteen_food_feedback_report_schedules_id: {
                    _eq: recipientEntry.id
                }
            },
            limit: -1
        });

        let canteen_primary_keys: PrimaryKey[] = []
        for(let scheduleCanteen of scheduleCanteens){
            let canteen_id = scheduleCanteen.canteens_id;
            if(!!canteen_id && typeof canteen_id === "string"){
                canteen_primary_keys.push(canteen_id as PrimaryKey);
            }
        }

        if(canteen_primary_keys.length === 0){
            return [];
        }

        let canteenService = await itemsServiceCreator.getItemsService<Canteens>(CollectionNames.CANTEENS)
        return await canteenService.readMany(canteen_primary_keys);
    }


    private getCanteenAliasForMail(canteenEntries: Canteens[]){
        let canteen_alias_list = ReportGenerator.getCanteenAliasList(canteenEntries);
        const previewAmount = 3;
        let canteen_alias = "";
        if(canteen_alias_list.length > previewAmount){
            canteen_alias_list = canteen_alias_list.slice(0, previewAmount);
            canteen_alias += ": " + canteen_alias_list.join(", ") + " ...";
        } else {
            canteen_alias += ": " + canteen_alias_list.join(", ");
        }

        return canteenEntries.length +" Mensen ("+canteen_alias+")";
    }

    async sendReport(generateReportForDate: Date, generated_report_data: ReportType, recipientEntry: CanteenFoodFeedbackReportSchedules, canteenEntries: Canteens[], toMail: string){
        let {MailService} = this.apiContext.services;
        const getSchema = this.apiContext.getSchema;
        const database = this.apiContext.database;
        const schema = await getSchema();

        let canteen_alias = this.getCanteenAliasForMail(canteenEntries);

        let dateHumanReadable = DateHelper.getHumanReadableDate(generateReportForDate, true);

        let subject = "Mensa Report - für: "+dateHumanReadable+" - "+canteen_alias;

        let mailService = new MailService({
            accountability: null, //this makes us admin
            knex: database, //TODO: i think this is not neccessary
            schema: schema,
        });

        await mailService.send({
            to: toMail,
            subject: subject,
            template: {
                name: "canteen-food-feedback-report",
                data: generated_report_data // See --> ReportGenerator.js
            },
        });
    }

    async setNextReportDate(generateReportForDate: Date, recipientEntry: CanteenFoodFeedbackReportSchedules){
        const itemsServiceCreator = new ItemsServiceCreator(this.apiContext);
        // update when the next report is due
        let tablename = TABLENAME_RECIPIENTS;//
        let itemService = await itemsServiceCreator.getItemsService<CanteenFoodFeedbackReportSchedules>(tablename)
        let generateReportForNextDate_moment = moment(generateReportForDate).add(1, 'days').toDate();
        let send_amount_days_before_offer_date = recipientEntry.send_amount_days_before_offer_date;
        let date_when_the_next_report_should_be_generated_iso = moment(generateReportForNextDate_moment).subtract(send_amount_days_before_offer_date, 'days').toISOString();
        await itemService.updateOne(recipientEntry.id, {date_next_report_is_due: date_when_the_next_report_should_be_generated_iso});
    }

    async updateReportLogSuccess(generateReportForDate: Date, recipientEntry: CanteenFoodFeedbackReportSchedules){
        let logMessage = `
            Report was sent successfully for the date: ${generateReportForDate}
            Sent at: ${new Date().toISOString()}
        `
        await this.updateReportLog(recipientEntry, "Report was sent successfully for the date: " + generateReportForDate);
    }

    async logReportSendError(recipientEntry: CanteenFoodFeedbackReportSchedules, err: any){
        //console.log(SCHEDULE_NAME + " logReportSendError:")
        //console.log(err);
        await this.updateReportLog(recipientEntry, "Report sending failed: " + err.toString());
    }

    async updateReportLog(recipientEntry: CanteenFoodFeedbackReportSchedules, log: string){
        const itemsServiceCreator = new ItemsServiceCreator(this.apiContext);

        try{
            let tablename = TABLENAME_RECIPIENTS;
            let itemService = await itemsServiceCreator.getItemsService<CanteenFoodFeedbackReportSchedules>(tablename)
            let updateData = {
                report_status_log: log
            }
            await itemService.updateOne(recipientEntry.id, updateData);
        } catch (err){
            console.log(SCHEDULE_NAME + " updateReportLog failed:")
            console.log(err);
        }
    }


    async getDateForWhichTheReportShouldBeSend(recipientEntry: CanteenFoodFeedbackReportSchedules){
        const itemsServiceCreator = new ItemsServiceCreator(this.apiContext);
        //console.log("Checking if report is due for to_recipient_email: " + recipientEntry.to_recipient_email);
        let tablename = TABLENAME_RECIPIENTS;
        let itemService = await itemsServiceCreator.getItemsService<CanteenFoodFeedbackReportSchedules>(tablename)


        let enabled = recipientEntry.enabled;
        if (!enabled) {
            await this.updateReportLog(recipientEntry, "Recipient is disabled.");
            return null;
        }


        // okay, now we have to calculate the date for which the report should be generated
        let now = new Date();
        let now_moment_date = moment(now);

        let send_once_now_for_date = recipientEntry?.send_once_now_for_date;
        if(send_once_now_for_date){
            await itemService.updateOne(recipientEntry.id, {send_once_now_for_date: null});
            return new Date(send_once_now_for_date);
        }

        let send_report_at_hh_mm = recipientEntry.send_report_at_hh_mm; // format: 12:00:00 or 12:00
        let send_amount_days_before_offer_date = recipientEntry.send_amount_days_before_offer_date; // for example we want to 4 days before the offer date notify the user

        let send_report_at_hh_mm_configured = !!send_report_at_hh_mm;
        // send_amount_days_before_offer_date_configured could be 0, so we have to check if it is not undefined or null
        let send_amount_days_before_offer_date_configured = send_amount_days_before_offer_date !== undefined && send_amount_days_before_offer_date !== null;

        // if the settings are not configured, we do not want to send a report
        if (!send_report_at_hh_mm_configured || !send_amount_days_before_offer_date_configured) {
            await this.updateReportLog(recipientEntry, "Recipient settings are not configured. (send_report_at_hh_mm_configured or send_amount_days_before_offer_date_configured is undefined)");
            return null;
        }


        // So at this point we know:
        // at which o clock the report should be sent
        // how many days before the offer date the report should be sent

        let date_for_which_the_report_should_be_generated_moment_date = moment(now_moment_date).add(send_amount_days_before_offer_date, 'days').format("YYYY-MM-DD") + " " + send_report_at_hh_mm;

        let date_next_report_is_due = recipientEntry.date_next_report_is_due;
        //console.log("date_for_which_the_report_should_be_generated_moment_date: " + date_for_which_the_report_should_be_generated_moment_date);

        let last_saved_send_report_at_hh_mm = recipientEntry.last_saved_send_report_at_hh_mm;
        let last_saved_send_amount_days_before_offer_date = recipientEntry.last_saved_send_amount_days_before_offer_date;

        if(!last_saved_send_report_at_hh_mm){
            last_saved_send_report_at_hh_mm = send_report_at_hh_mm;
            await itemService.updateOne(recipientEntry.id, {last_saved_send_report_at_hh_mm: send_report_at_hh_mm});
        }

        if(!last_saved_send_amount_days_before_offer_date){
            last_saved_send_amount_days_before_offer_date = send_amount_days_before_offer_date;
            await itemService.updateOne(recipientEntry.id, {last_saved_send_amount_days_before_offer_date: send_amount_days_before_offer_date});
        }

        // check if settings have changed
        let send_report_at_hh_mm_changed = last_saved_send_report_at_hh_mm !== send_report_at_hh_mm;
        let send_amount_days_before_offer_date_changed = last_saved_send_amount_days_before_offer_date !== send_amount_days_before_offer_date;

        let settingsChanged = send_report_at_hh_mm_changed || send_amount_days_before_offer_date_changed;
        if(settingsChanged){
            // if settings have changed, we have to reset the last_report_date

            last_saved_send_report_at_hh_mm = send_report_at_hh_mm;
            last_saved_send_amount_days_before_offer_date = send_amount_days_before_offer_date;

            let updateData = {

                last_saved_send_report_at_hh_mm: last_saved_send_report_at_hh_mm,
                last_saved_send_amount_days_before_offer_date: last_saved_send_amount_days_before_offer_date
            }
            await itemService.updateOne(recipientEntry.id, updateData);

            await this.updateReportLog(recipientEntry, "Recipient settings have changed. (send_report_at_hh_mm_changed or send_amount_days_before_offer_date_changed)");
        }

        if(!date_next_report_is_due || settingsChanged){
            // if the date_next_report_is_due is not set, we have to set it
            // date_when_the_next_report_should_be_generated is date_for_which_the_report_should_be_generated_moment_date minus send_amount_days_before_offer_date
            let date_when_the_next_report_should_be_generated = moment(now_moment_date).add(0, 'days').format("YYYY-MM-DD") + " " + send_report_at_hh_mm;
            if(now_moment_date.isAfter(date_when_the_next_report_should_be_generated)){
                // since the date_when_the_next_report_should_be_generated is in the past and we "missed" the report, we have to set the next report date to tomorrow
                date_when_the_next_report_should_be_generated = moment(date_when_the_next_report_should_be_generated).add(1, 'days').format("YYYY-MM-DD") + " " + send_report_at_hh_mm;
            }
            let date_next_report_is_due_iso = moment(date_when_the_next_report_should_be_generated).toISOString();
            await itemService.updateOne(recipientEntry.id, {date_next_report_is_due: date_next_report_is_due_iso});
            await this.updateReportLog(recipientEntry, "Next report date was not set. Set next report due date to: "+date_next_report_is_due_iso);
            return null; // we do not want to send a report now
        } else {
            // if the date_next_report_is_due is set, we have to check if the report is due
            if(now_moment_date.isAfter(date_next_report_is_due)){
                //console.log("Report is due for to_recipient_email: " + recipientEntry.to_recipient_email);
                //console.log("Report is due: "+date_for_which_the_report_should_be_generated_moment_date.toString());
                // date_for_which_the_report_should_be_generated_moment_date; to iso string
                let date_for_which_the_report_should_be_generated_iso = moment(date_for_which_the_report_should_be_generated_moment_date).toISOString();
                return new Date(date_for_which_the_report_should_be_generated_iso);
            } else {
                return null; // we do not want to send a report now
            }
        }
    }

    async getAllReportSchedules(){
        const itemsServiceCreator = new ItemsServiceCreator(this.apiContext);
        let tablename = TABLENAME_RECIPIENTS;
        let itemService = await itemsServiceCreator.getItemsService<CanteenFoodFeedbackReportSchedules>(tablename)
        let list = await itemService.readByQuery({
            limit: -1});
        return list;
    }

}
