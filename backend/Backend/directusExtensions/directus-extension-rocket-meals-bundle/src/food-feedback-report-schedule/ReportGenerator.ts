import {
    CanteenFoodFeedbackReportSchedules,
    Canteens,
    Foods,
    FoodsFeedbacks,
    FoodsFeedbacksLabels
} from "../databaseTypes/types";
import {DateHelper} from "../helpers/DateHelper";
import {ApiContext} from "../helpers/ApiContext";
import {Filter} from "@directus/types/dist/filter";
import {AssetHelperDirectusBackend, AssetHelperTransformOptions} from "../helpers/AssetHelperDirectusBackend";
import {MyDatabaseHelper} from "../helpers/MyDatabaseHelper";
import {DictHelper} from "../helpers/DictHelper";

export type ReportFoodEntryLabelType = {
    id: string,
    alias: string,
    amount_positive: number,
    amount_negative: number,
    amount_total: number
}

export type ReportFoodEntryType = {
    id: string,
    alias: string | null | undefined,
    image_url: string | null | undefined,
    rating_average: string | null | undefined,
    rating_amount: string | null | undefined,
    comments: string[],
    labels: ReportFoodEntryLabelType[]
}

export type ReportType = {
    canteen_alias: string,
    dateHumanReadable: string,
    report_feedback_period_days: number | null | undefined,
    show_images: boolean,
    foods: ReportFoodEntryType[],
}

export class ReportGenerator {
    private apiContext: ApiContext;
    private myDatabaseHelper: MyDatabaseHelper;

    constructor(apiContext: ApiContext) {
        this.apiContext = apiContext;
        this.myDatabaseHelper = new MyDatabaseHelper(apiContext);
    }

    static getCanteenAliasList(canteenEntries: Canteens[]){
        let canteen_alias_list = [];
        for(let canteen of canteenEntries){
            if(canteen.alias){
                canteen_alias_list.push(canteen.alias);
            }
        }
        return canteen_alias_list;
    }

    /**
     *
     * @param generateReportForDate
     * @param report_feedback_period_days
     * @param canteenEntries
     * @return {Promise<{report_feedback_period_days: *, foods: {}}>}
      {
        "report_feedback_period_days": 180,
        "canteen": "Canteen 1",
        "foods": [
          {
            "id": "2351",
            "alias": "Falafel mit Persischem Reis, Pinienkernen und Pfirsich-Tomatenchutney",
            "image_url": "http://127.0.0.1/rocket-meals/api/assets/15a32c55-85ac-497e-9306-3f4b356aa5c0",
            "rating_average": 4,
            "rating_amount": 1,
            "comments": [
              "Total lecker!"
            ],
            "labels": [
              {
                "id": "454beee0-0a2c-4174-b5c2-fd80a95d7cda",
                "alias": "lecker",
                "count": 1
              }
            ]
          }
        ]
      }
     */
    async generateReportJSON(reportSchedule: CanteenFoodFeedbackReportSchedules, generateReportForDate: Date, report_feedback_period_days: number | null |undefined, canteenEntries: Canteens[]): Promise<ReportType>{
        let date = generateReportForDate;
        let dateHumanReadable = DateHelper.getHumanReadableDate(date, true);
        //console.log("Generate report for date: "+dateHumanReadable);

        let canteen_alias_list = ReportGenerator.getCanteenAliasList(canteenEntries);
        const canteen_alias = canteen_alias_list.join(", ");

        let show_images = reportSchedule.show_images;
        if(show_images === null || show_images === undefined){
            show_images = true;
        }

        let report: ReportType = {
            canteen_alias: canteen_alias,
            report_feedback_period_days: report_feedback_period_days,
            dateHumanReadable: dateHumanReadable,
            show_images: show_images,
            foods: []
        }

        let foods: ReportFoodEntryType[] = [];

        let foodDict: {[key: string]: Foods} = {};
        for(let canteenEntry of canteenEntries){
            let foodOffersWithFood = await this.getFoodOffersWithFoodAtDateInCanteen(generateReportForDate, canteenEntry?.id);
            for(let foodOfferWithFood of foodOffersWithFood){
                let food = foodOfferWithFood?.food;
                if(!!food && typeof food !== "string"){
                    foodDict[food.id] = food;
                }
            }
        }

        let feedbackLabelsWithTranslations = await this.myDatabaseHelper.getFoodFeedbackLabelsHelper().readByQuery({
            limit: -1,
            filter: {
                _and: [
                    {
                        visible: {
                            _eq: true // get only visible feedback labels
                        }
                    }
                ]
            },
            fields: ['*', 'translations.*']
        })
        const dictFeedbackLabelsWithTranslation = DictHelper.transformListToDict(feedbackLabelsWithTranslations, (item) => item.id);


        for(let food of Object.values(foodDict)){
            const food_id = food?.id;
            //console.log("Get summary for food_id: "+food?.id);
            //console.log("food")
            //console.log(food)

            let feedbacksWithComments = await this.getAllFoodFeedbacksWithCommentsForFood(food_id, report_feedback_period_days);
            //console.log("Found amount of feedbacksWithLabels: "+feedbacksWithLabels.length)
            let feedbackLabelEntryListForReport = await this.getReportFeedbackLabelsList(food_id, dictFeedbackLabelsWithTranslation, report_feedback_period_days);
            //console.log("Found amount of feedbackLabels: "+feedbackLabelEntryListForReport.length)
            //console.log("feedbackLabelEntryListForReport")
            //console.log(feedbackLabelEntryListForReport)

            // TODO: fix this as we now seperate the foodfeedback labels and the foodfeedbacks

            let comments = this.getFoodFeedbackComments(feedbacksWithComments);
            //console.log("Found amount of comments: "+comments.length)

            let image_url = null;
            if(food?.image){
                let file_id = food?.image;
                let publicUrl = process.env.PUBLIC_URL;
                if(publicUrl){
                    //image_url = publicUrl+'/assets/'+file_id
                    image_url = AssetHelperDirectusBackend.getAssetImageURL(file_id, AssetHelperTransformOptions.SMALL_IMAGE_TRANSFORM);
                }
            }
            if(food?.image_remote_url){
                image_url = food?.image_remote_url;
            }

            let usedRatingAverage = "N/A";
            if(food?.rating_average){
                // to fixed 2 decimal places
                usedRatingAverage = food?.rating_average.toFixed(2);
            }

            let usedRatingAmount = "0";
            if(food?.rating_amount){
                usedRatingAmount = food?.rating_amount+"";
            }

            let foodSummary: ReportFoodEntryType = {
                id: food.id,
                alias: food.alias,
                image_url: image_url,
                rating_average: usedRatingAverage,
                rating_amount: usedRatingAmount,
                comments: comments,
                labels: feedbackLabelEntryListForReport
            };

            foods.push(foodSummary)
        }

        report.foods = foods;
        return report
    }

    getFoodFeedbackComments(feedbacks: FoodsFeedbacks[]){
        let comments = [];
        for(let feedback of feedbacks){
            let comment = feedback?.comment;
            if(comment){
                // we should sanitize the comment here just to be sure that we don't have any html tags in the comment
                let sanitized_comment = comment.replace(/<[^>]*>?/gm, '');
                comments.push(sanitized_comment);
            }
        }
        return comments;
    }

    getTranslationOfFeedbackLabel(feedbackLabelWithTranslation: FoodsFeedbacksLabels): string {
        // TODO: Read FoodsFeedbacksLabelsTranslations and return the text
        // TODO: Maybe create a translation helper for the backend similar to the one in the frontend
        return feedbackLabelWithTranslation?.alias || feedbackLabelWithTranslation.id;
    }

    async getReportFeedbackLabelsList(food_id: string, dictFeedbackLabelsWithTranslation: Record<string, FoodsFeedbacksLabels>, report_feedback_period_days: number | null | undefined): Promise<ReportFoodEntryLabelType[]> {
        const foodFeedbackLabelEntriesService = this.myDatabaseHelper.getFoodFeedbackLabelEntriesHelper();

        const filter: Filter[] = [
            {
                food: {
                    _eq: food_id
                }
            },
        ]

        let filterDateUpdated = this.getFilterDateUpdatedForReportFeedbackPeriodDays(report_feedback_period_days);
        if(filterDateUpdated){
            filter.push(filterDateUpdated);
        }

        const labelFeedbacks = await foodFeedbackLabelEntriesService.readByQuery({filter: {
                _and: filter
            },
            limit: -1,
        });

        let labels_counted_dict: {[key: string]: ReportFoodEntryLabelType} = {};
        for(let labelFeedback of labelFeedbacks){
            let label_id = labelFeedback?.label;
            if(!!label_id && typeof label_id === "string"){
                let feedbackLabelWithTranslation = dictFeedbackLabelsWithTranslation[label_id];
                if(!!feedbackLabelWithTranslation){
                    let alias = this.getTranslationOfFeedbackLabel(feedbackLabelWithTranslation);
                    let labels_counted_obj: ReportFoodEntryLabelType | undefined = labels_counted_dict[label_id];
                    if(!labels_counted_obj){
                        labels_counted_obj = {
                            id: label_id,
                            alias: alias,
                            amount_negative: 0,
                            amount_positive: 0,
                            amount_total: 0
                        }
                    }
                    if(!!labels_counted_obj){
                        if(labelFeedback?.dislike){
                            labels_counted_obj.amount_negative += 1;
                        } else {
                            labels_counted_obj.amount_positive += 1;
                        }
                        labels_counted_obj.amount_total += 1;
                        labels_counted_dict[label_id] = labels_counted_obj;
                    }
                }
            }
        }

        let labels_counted_as_list: ReportFoodEntryLabelType[] = [];
        for(let label_id in labels_counted_dict){
            let label_counted_obj = labels_counted_dict[label_id];
            if(!!label_counted_obj){
                labels_counted_as_list.push(label_counted_obj);
            }
        }

        return labels_counted_as_list;
    }

    private getFilterDateUpdatedForReportFeedbackPeriodDays(report_feedback_period_days: number | null | undefined){
        let filter: Filter | undefined = undefined
        if(report_feedback_period_days !== null && report_feedback_period_days !== undefined){
            let end = new Date();
            let start = new Date(end);
            // subtract report_feedback_period_days amount days from start
            start.setDate(start.getDate() - report_feedback_period_days);
            filter =
                {
                    date_updated: {
                        _between: [start.toISOString(), end.toISOString()]
                    }
                }
        }
        return filter;
    }

    async getAllFoodFeedbacksWithCommentsForFood(food_id: string, report_feedback_period_days: number | null | undefined){
        let itemService = this.myDatabaseHelper.getFoodFeedbacksHelper();

        const filter: Filter[] = [
            {
                food: {
                    _eq: food_id
                }
            },
            {
                comment: {
                    _null: false
                }
            }
        ]

        let filterDateUpdated = this.getFilterDateUpdatedForReportFeedbackPeriodDays(report_feedback_period_days);
        if(filterDateUpdated){
            filter.push(filterDateUpdated);
        }

        return await itemService.readByQuery({
            filter: {
                _and: filter
            },
            fields: ['*'],
            limit: -1
        });
    }

    async getFoodOffersWithFoodAtDateInCanteen(date: Date, canteen_id: string){

        let startOfTheDay = new Date(date); // copy the date
        const foodofferDate = DateHelper.getFoodofferDateTypeFromDate(startOfTheDay);
        const foodofferDateString = DateHelper.foodofferDateTypeToString(foodofferDate);

        let itemService = this.myDatabaseHelper.getFoodOffersHelper();

        return await itemService.readByQuery({
            filter: {
                _and: [
                    {
                        date: {
                            _eq: foodofferDateString
                        }
                    },
                    {
                        canteen: {
                            _eq: canteen_id
                        }
                    }
                ]
            },
            fields: ['*', "food.*"],
            limit: -1
        });
    }

}
