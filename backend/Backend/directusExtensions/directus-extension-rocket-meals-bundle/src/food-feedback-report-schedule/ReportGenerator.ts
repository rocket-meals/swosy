import {
    CanteenFoodFeedbackReportSchedules,
    Canteens, CanteensFeedbacksLabels,
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
import {ItemsServiceHelper} from "../helpers/ItemsServiceHelper";

export type ReportFoodEntryLabelType = {
    id: string,
    alias: string,
    amount_positive_new: number,
    amount_negative_new: number,
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

export type ReportCanteenEntryType = {
    id: string,
    alias: string | null | undefined,
    amount_positive_new: number,
    amount_negative_new: number,
    amount_positive: number,
    amount_negative: number,
    amount_total: number
}

export type ReportType = {
    canteen_alias: string,
    dateHumanReadable: string,
    show_images: boolean,
    show_food: boolean,
    show_food_feedback_labels: boolean,
    show_food_comments: boolean,
    show_canteen_feedbacks: boolean,
    foods: ReportFoodEntryType[],
    canteen_labels: ReportCanteenEntryType[]
}

export class ReportGenerator {
    private myDatabaseHelper: MyDatabaseHelper;

    constructor(apiContext: ApiContext) {
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
     * @param reportSchedule
     * @param startDate
     * @param endDate
     * @param canteenEntries
     * @return {Promise<{report_feedback_period_days: *, foods: {}}>}
     */
    async generateReportJSON(reportSchedule: CanteenFoodFeedbackReportSchedules, startDate: Date, endDate: Date, canteenEntries: Canteens[]): Promise<ReportType>{

        let dateStartHumanReadable = DateHelper.getHumanReadableDate(startDate, true);
        let dateEndHumanReadable = DateHelper.getHumanReadableDate(endDate, true);
        const dateHumanReadable = "["+dateStartHumanReadable + " - " + dateEndHumanReadable+"]";
        //console.log("Generate report for date: "+dateHumanReadable);

        let canteen_alias_list = ReportGenerator.getCanteenAliasList(canteenEntries);
        const canteen_alias = canteen_alias_list.join(", ");

        let show_images = reportSchedule.show_images;
        if(show_images === null || show_images === undefined){
            show_images = true;
        }
        let show_food_feedback_labels = reportSchedule.show_food_feedback_labels;
        if(show_food_feedback_labels === null || show_food_feedback_labels === undefined){
            show_food_feedback_labels = true;
        }
        let show_food_comments = reportSchedule.show_food_comments;
        if(show_food_comments === null || show_food_comments === undefined){
            show_food_comments = true;
        }
        let show_canteen_feedbacks = reportSchedule.show_canteen_feedbacks;
        if(show_canteen_feedbacks === null || show_canteen_feedbacks === undefined){
            show_canteen_feedbacks = true;
        }
        let show_food = reportSchedule.show_food;
        if(show_food === null || show_food === undefined){
            show_food = true;
        }

        let report: ReportType = {
            canteen_alias: canteen_alias,
            dateHumanReadable: dateHumanReadable,
            show_images: show_images,
            show_food: show_food,
            show_food_feedback_labels: show_food_feedback_labels,
            show_food_comments: show_food_comments,
            show_canteen_feedbacks: show_canteen_feedbacks,
            foods: [],
            canteen_labels: []
        }

        report.foods = await this.getReportForFoodFeedbacks(reportSchedule, startDate, endDate, canteenEntries);
        report.canteen_labels = await this.getReportForCanteenFeedbacks(reportSchedule, startDate, endDate, canteenEntries);


        return report
    }

    async getReportForCanteenFeedbacks(reportSchedule: CanteenFoodFeedbackReportSchedules, startDate: Date, endDate: Date, canteenEntries: Canteens[]){
        let canteens: ReportCanteenEntryType[] = [];

        let canteenFeedbackLabelsWithTranslations = await this.myDatabaseHelper.getCanteenFeedbackLabelsHelper().readByQuery({
            limit: -1,
            filter: {
                _and: [
                    {
                        [ItemsServiceHelper.FIELD_STATUS]: {
                            _eq: ItemsServiceHelper.FIELD_STATUS_PUBLISHED // get only published feedback labels
                        }
                    }
                ]
            },
            fields: ['*', 'translations.*']
        })

        const filterLikes = {
            dislike: {
                _eq: false
            }
        }

        const filterDislikes = {
            dislike: {
                _eq: true
            }
        }

        const canteenIds = canteenEntries.map((canteen) => canteen.id);

        const filterCanteens = {
            canteen: {
                _in: canteenIds
            }
        }

        const filterDateUpdatedFeedbackLabelEntries: Filter = this.getFilterDateUpdatedForReportFeedbackPeriodDays(startDate, endDate);

        for(let canteenFeedbackLabelsWithTranslation of canteenFeedbackLabelsWithTranslations){
            let alias = this.getTranslationOfFeedbackLabel(canteenFeedbackLabelsWithTranslation);

            const filterLabel = {
                label: {
                    _eq: canteenFeedbackLabelsWithTranslation.id
                }
            }

            const amount_positive_new = await this.myDatabaseHelper.getCanteenFeedbackLabelsEntriesHelper().countItems({
                filter: {
                    _and: [
                        filterLabel,
                        filterCanteens,
                        filterLikes,
                        filterDateUpdatedFeedbackLabelEntries,
                    ]
                }
            });
            const amount_negative_new = await this.myDatabaseHelper.getCanteenFeedbackLabelsEntriesHelper().countItems({
                filter: {
                    _and: [
                        filterLabel,
                        filterCanteens,
                        filterDislikes,
                        filterDateUpdatedFeedbackLabelEntries,
                    ]
                }
            });
            const amount_positive = await this.myDatabaseHelper.getCanteenFeedbackLabelsEntriesHelper().countItems({
                filter: {
                    _and: [
                        filterLabel,
                        filterCanteens,
                        filterLikes,
                    ]
                }
            });
            const amount_negative = await this.myDatabaseHelper.getCanteenFeedbackLabelsEntriesHelper().countItems({
                filter: {
                    _and: [
                        filterLabel,
                        filterCanteens,
                        filterDislikes,
                    ]
                }
            });
            const amount_total = amount_positive + amount_negative;

            let canteenSummary: ReportCanteenEntryType = {
                id: canteenFeedbackLabelsWithTranslation?.id,
                alias: alias,
                amount_positive_new: amount_positive_new,
                amount_negative_new: amount_negative_new,
                amount_positive: amount_positive,
                amount_negative: amount_negative,
                amount_total: amount_total
            };

            canteens.push(canteenSummary)
        }



        return canteens;
    }

    async getReportForFoodFeedbacks(reportSchedule: CanteenFoodFeedbackReportSchedules, startDate: Date, endDate: Date, canteenEntries: Canteens[]){
        let foods: ReportFoodEntryType[] = [];

        let foodDict: {[key: string]: Foods} = {};
        for(let canteenEntry of canteenEntries){
            let foodOffersWithFood = await this.getFoodOffersWithFoodAtDateInCanteen(startDate, endDate, canteenEntry?.id);
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
                        [ItemsServiceHelper.FIELD_STATUS]: {
                            _eq: ItemsServiceHelper.FIELD_STATUS_PUBLISHED // get only published feedback labels
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

            let feedbacksWithComments = await this.getAllFoodFeedbacksWithCommentsForFood(food_id, startDate, endDate);
            //console.log("Found amount of feedbacksWithLabels: "+feedbacksWithLabels.length)
            let feedbackLabelEntryListForReport = await this.getReportFeedbackLabelsList(food_id, dictFeedbackLabelsWithTranslation, startDate, endDate);
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
        return foods;
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

    getTranslationOfFeedbackLabel(feedbackLabelWithTranslation: FoodsFeedbacksLabels | CanteensFeedbacksLabels): string {
        // TODO: Read FoodsFeedbacksLabelsTranslations and return the text
        // TODO: Maybe create a translation helper for the backend similar to the one in the frontend
        return feedbackLabelWithTranslation?.alias || feedbackLabelWithTranslation.id;
    }

    async getReportFeedbackLabelsList(food_id: string, dictFeedbackLabelsWithTranslation: Record<string, FoodsFeedbacksLabels>, startDate: Date, endDate: Date): Promise<ReportFoodEntryLabelType[]> {
        const foodFeedbackLabelEntriesService = this.myDatabaseHelper.getFoodFeedbackLabelEntriesHelper();

        const filterLikes = {
            dislike: {
                _eq: false
            }
        }

        const filterDislikes = {
            dislike: {
                _eq: true
            }
        }

        const filterFeedbackLabelEntriesFoodEquals: Filter = {
                food: {
                    _eq: food_id
                }
            }



        let filterDateUpdatedFeedbackLabelEntries: Filter = this.getFilterDateUpdatedForReportFeedbackPeriodDays(startDate, endDate);

        let labels_counted_as_list: ReportFoodEntryLabelType[] = [];

        let feedbackLabelKeys = Object.keys(dictFeedbackLabelsWithTranslation);
        for(let feedbackLabelKey of feedbackLabelKeys){
            let feedbackLabelWithTranslation = dictFeedbackLabelsWithTranslation[feedbackLabelKey];
            if(!!feedbackLabelWithTranslation){
                let feedbackLabelId = feedbackLabelWithTranslation?.id;

                let filterFeedbackLabelEntriesFeedbackLabelEquals: Filter = {
                    label: {
                        _eq: feedbackLabelId
                    }
                }

                let amount_positive_new = await foodFeedbackLabelEntriesService.countItems({
                    filter: {
                        _and: [
                            filterFeedbackLabelEntriesFoodEquals,
                            filterFeedbackLabelEntriesFeedbackLabelEquals,
                            filterDateUpdatedFeedbackLabelEntries,
                            filterLikes
                        ]
                    }
                });
                let amount_negative_new = await foodFeedbackLabelEntriesService.countItems({
                    filter: {
                        _and: [
                            filterFeedbackLabelEntriesFoodEquals,
                            filterFeedbackLabelEntriesFeedbackLabelEquals,
                            filterDateUpdatedFeedbackLabelEntries,
                            filterDislikes
                        ]
                    }
                });

                let amount_positive = await foodFeedbackLabelEntriesService.countItems({
                    filter: {
                        _and: [
                            filterFeedbackLabelEntriesFoodEquals,
                            filterFeedbackLabelEntriesFeedbackLabelEquals,
                            filterLikes
                        ]
                    }
                });

                let amount_negative = await foodFeedbackLabelEntriesService.countItems({
                    filter: {
                        _and: [
                            filterFeedbackLabelEntriesFoodEquals,
                            filterFeedbackLabelEntriesFeedbackLabelEquals,
                            filterDislikes
                        ]
                    }
                });

                let amount_total = amount_positive + amount_negative;

                let alias = this.getTranslationOfFeedbackLabel(feedbackLabelWithTranslation);

                let labelEntry: ReportFoodEntryLabelType = {
                    id: feedbackLabelId,
                    alias: alias,
                    amount_positive_new: amount_positive_new,
                    amount_negative_new: amount_negative_new,
                    amount_positive: amount_positive,
                    amount_negative: amount_negative,
                    amount_total: amount_total
                }

                labels_counted_as_list.push(labelEntry);

            }
        }

        return labels_counted_as_list;
    }

    private getFilterDateUpdatedForReportFeedbackPeriodDays(startDate: Date, endDate: Date): Filter {
        let beginOfTheDayOfStartDate = new Date(startDate); // copy the date
        beginOfTheDayOfStartDate.setHours(0,0,0,0);
        let endOfTheDayOfEndDate = new Date(endDate); // copy the date
        endOfTheDayOfEndDate.setHours(23,59,59,999);

        return {
            date_updated: {
                _between: [beginOfTheDayOfStartDate.toISOString(), endOfTheDayOfEndDate.toISOString()]
            }
        };
    }

    async getAllFoodFeedbacksWithCommentsForFood(food_id: string, startDate: Date, endDate: Date){
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

        let filterDateUpdated = this.getFilterDateUpdatedForReportFeedbackPeriodDays(startDate, endDate);
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

    async getFoodOffersWithFoodAtDateInCanteen(startDate: Date, endDate: Date, canteen_id: string){

        const startFoodofferDateString = DateHelper.foodofferDateTypeToString(DateHelper.getFoodofferDateTypeFromDate(startDate));
        const endFoodofferDateString = DateHelper.foodofferDateTypeToString(DateHelper.getFoodofferDateTypeFromDate(endDate));

        let itemService = this.myDatabaseHelper.getFoodoffersHelper();

        return await itemService.readByQuery({
            filter: {
                _and: [
                    {
                        date: {
                            _between: [startFoodofferDateString, endFoodofferDateString]
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
