import {
    CanteenFoodFeedbackReportSchedules,
    Canteens,
    CanteensFeedbacksLabels,
    Foods,
    FoodsFeedbacksLabels
} from "../databaseTypes/types";
import {DateHelper} from "../helpers/DateHelper";
import {ApiContext} from "../helpers/ApiContext";
import {FieldFilter, Filter} from "@directus/types/dist/filter";
import {AssetHelperDirectusBackend, AssetHelperTransformOptions} from "../helpers/AssetHelperDirectusBackend";
import {MyDatabaseHelper} from "../helpers/MyDatabaseHelper";
import {DictHelper} from "../helpers/DictHelper";
import {ItemsServiceHelper} from "../helpers/ItemsServiceHelper";
import {FoodRatingCalculator} from "../food-feedback-rating-calculate-hook/FoodRatingCalculator";

enum ReportStatusTrafficLightEnum {
    RED = "🔴",
    YELLOW = "🟡",
    GREEN = "🟢",
}

// NA = Not Available
const VALUE_NOT_AVAILABLE = "N/A";

export type ReportStatusTrafficLightType = ReportStatusTrafficLightEnum;

export type ReportFoodEntryLabelType = {
    id: string,
    alias: string,
    amount_positive_new: string,
    amount_negative_new: string,
    amount_positive: number,
    amount_negative: number,
    amount_total: number,
    status_total: ReportStatusTrafficLightType,
    status_new: ReportStatusTrafficLightType
}

export type ReportFoodEntryType = {
    id: string,
    alias: string | null | undefined,
    image_url: string | null | undefined,
    rating_average: string | null | undefined,
    rating_amount: string | null | undefined,
    comments: string[],
    labels: ReportFoodEntryLabelType[],
    status_rating: ReportStatusTrafficLightType
}

export type ReportCanteenEntryType = {
    id: string,
    canteen_alias: string | null | undefined,
    label_alias: string | null | undefined,
    amount_positive_new: string,
    amount_negative_new: string,
    amount_positive: number,
    amount_negative: number,
    amount_total: number,
    status_total: ReportStatusTrafficLightType,
    status_new: ReportStatusTrafficLightType
}

export type ReportType = {
    canteen_alias: string,
    dateHumanReadable: string,
    show_images: boolean,
    show_food: boolean,
    show_food_feedback_labels: boolean,
    show_food_comments: boolean,
    show_canteen_feedbacks: boolean,
    status_explanation: string,
    food_rating_average: string,
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

    async getAverageRatingForAllFoods(){
        return await this.myDatabaseHelper.getFoodsHelper().calculateAverage("rating_average");
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

        const foodAverageRating = await this.getAverageRatingForAllFoods();
        const foodAverageRatingString = foodAverageRating ? foodAverageRating.toFixed(2) : VALUE_NOT_AVAILABLE;

        let report: ReportType = {
            canteen_alias: canteen_alias,
            dateHumanReadable: dateHumanReadable,
            status_explanation: "Der Status zeigt "+ReportStatusTrafficLightEnum.GREEN+" (Positiv), "+ReportStatusTrafficLightEnum.RED+" (Negativ) und "+ReportStatusTrafficLightEnum.YELLOW+" (Neutral) an. Der Status ändert bei einer Abweichung von mehr als "+(ReportGenerator.THRESHOLD_PERCENTAGE*100)+"%. Bei den Rückmeldungen mit Labels zeigt der Status in Klammern die Änderung in diesem Zeitraum an. Bei den Bewertungen der Speisen werden diese Verglichen mit der Durchschnittlichen Bewertung von "+foodAverageRatingString+".",
            show_images: show_images,
            show_food: show_food,
            show_food_feedback_labels: show_food_feedback_labels,
            show_food_comments: show_food_comments,
            show_canteen_feedbacks: show_canteen_feedbacks,
            food_rating_average: foodAverageRatingString,
            foods: [],
            canteen_labels: []
        }

        if(show_food){
            report.foods = await this.getReportForFoodFeedbacks(reportSchedule, startDate, endDate, canteenEntries, show_food_feedback_labels, show_food_comments, foodAverageRating);
        }
        if(show_canteen_feedbacks){
            report.canteen_labels = await this.getReportForCanteenFeedbacks(reportSchedule, startDate, endDate, canteenEntries);
        }


        return report
    }

    formatAmountNewToReportString(amount: number): string {
        return "+"+amount;
    }

    static THRESHOLD_PERCENTAGE = 0.1;

    calculateTrafficLightStatus(amount_positive: number, amount_negative: number): ReportStatusTrafficLightEnum {
        // if there are no feedbacks, the status is orange
        let threshold_percentage = ReportGenerator.THRESHOLD_PERCENTAGE;
        // if the amount of positive is more than 10% of the amount of negative feedbacks, the status is green
        // if the amount of negative is more than 10% of the amount of positive feedbacks, the status is red
        // otherwise, the status is yellow, as the amount of positive and negative feedbacks are almost equal
        if(amount_positive === 0 && amount_negative === 0){
            return ReportStatusTrafficLightEnum.YELLOW;
        }
        let percentage_positive = amount_positive / (amount_positive + amount_negative);
        let percentage_negative = amount_negative / (amount_positive + amount_negative);
        if(percentage_positive > threshold_percentage){
            return ReportStatusTrafficLightEnum.GREEN;
        }
        if(percentage_negative > threshold_percentage){
            return ReportStatusTrafficLightEnum.RED;
        }
        return ReportStatusTrafficLightEnum.YELLOW;
    }

    async getReportForCanteenFeedbacks(reportSchedule: CanteenFoodFeedbackReportSchedules, startDate: Date, endDate: Date, canteenEntries: Canteens[]) {
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
        });

        const filterLikes = {
            dislike: {
                _eq: false
            }
        };

        const filterDislikes = {
            dislike: {
                _eq: true
            }
        };

        const filterDateUpdatedFeedbackLabelEntries: Filter[] = this.getFilterDateUpdatedForReportFeedbackPeriodDays(startDate, endDate);

        for (let canteenFeedbackLabelsWithTranslation of canteenFeedbackLabelsWithTranslations) {
            let alias = this.getTranslationOfFeedbackLabel(canteenFeedbackLabelsWithTranslation);

            const filterLabel = {
                label: {
                    _eq: canteenFeedbackLabelsWithTranslation.id
                }
            };

            // Get the counts for all canteens
            const countsAllCanteens = await this.getCanteenFeedbackCounts(
                filterLabel,
                filterLikes,
                filterDislikes,
                filterDateUpdatedFeedbackLabelEntries,
                null
            );



            let allCanteensSummary: ReportCanteenEntryType = {
                id: canteenFeedbackLabelsWithTranslation?.id,
                label_alias: alias,
                canteen_alias: "Alle",
                amount_positive_new: this.formatAmountNewToReportString(countsAllCanteens.amount_positive_new),
                amount_negative_new: this.formatAmountNewToReportString(countsAllCanteens.amount_negative_new),
                amount_positive: countsAllCanteens.amount_positive,
                amount_negative: countsAllCanteens.amount_negative,
                amount_total: countsAllCanteens.amount_total,
                status_total: this.calculateTrafficLightStatus(countsAllCanteens.amount_positive, countsAllCanteens.amount_negative),
                status_new: this.calculateTrafficLightStatus(countsAllCanteens.amount_positive_new, countsAllCanteens.amount_negative_new)
            };

            canteens.push(allCanteensSummary);

            // If per-canteen feedbacks are to be shown
            if (reportSchedule.show_canteen_feedbacks_also_per_canteen) {
                for (let canteen of canteenEntries) {
                    const countsForCanteen = await this.getCanteenFeedbackCounts(
                        filterLabel,
                        filterLikes,
                        filterDislikes,
                        filterDateUpdatedFeedbackLabelEntries,
                        canteen
                    );

                    let canteenSummary: ReportCanteenEntryType = {
                        id: canteenFeedbackLabelsWithTranslation?.id,
                        label_alias: "↳ davon", // indicates that the label is the same as the one above
                        canteen_alias: canteen.alias,
                        amount_positive_new: this.formatAmountNewToReportString(countsForCanteen.amount_positive_new),
                        amount_negative_new: this.formatAmountNewToReportString(countsForCanteen.amount_negative_new),
                        amount_positive: countsForCanteen.amount_positive,
                        amount_negative: countsForCanteen.amount_negative,
                        amount_total: countsForCanteen.amount_total,
                        status_total: this.calculateTrafficLightStatus(countsForCanteen.amount_positive, countsForCanteen.amount_negative),
                        status_new: this.calculateTrafficLightStatus(countsForCanteen.amount_positive_new, countsForCanteen.amount_negative_new)
                    };

                    canteens.push(canteenSummary);
                }
            }
        }

        return canteens;
    }

    async getCanteenFeedbackCounts(filterLabel: FieldFilter, filterLikes: FieldFilter, filterDislikes: FieldFilter, filterDateUpdatedFeedbackLabelEntries: Filter[], canteen: Canteens | null = null) {
        const canteenFilter: FieldFilter = canteen ? { canteen: { _eq: canteen.id } } : {};

        const amount_positive_new = await this.myDatabaseHelper.getCanteenFeedbackLabelsEntriesHelper().countItems({
            filter: {
                _and: [
                    filterLabel,
                    filterLikes,
                    ...filterDateUpdatedFeedbackLabelEntries,
                    canteenFilter,
                ]
            }
        });

        const amount_negative_new = await this.myDatabaseHelper.getCanteenFeedbackLabelsEntriesHelper().countItems({
            filter: {
                _and: [
                    filterLabel,
                    filterDislikes,
                    ...filterDateUpdatedFeedbackLabelEntries,
                    canteenFilter,
                ]
            }
        });

        const amount_positive = await this.myDatabaseHelper.getCanteenFeedbackLabelsEntriesHelper().countItems({
            filter: {
                _and: [
                    filterLabel,
                    filterLikes,
                    canteenFilter,
                ]
            }
        });

        const amount_negative = await this.myDatabaseHelper.getCanteenFeedbackLabelsEntriesHelper().countItems({
            filter: {
                _and: [
                    filterLabel,
                    filterDislikes,
                    canteenFilter,
                ]
            }
        });

        const amount_total = amount_positive + amount_negative;

        return {
            amount_positive_new: amount_positive_new,
            amount_negative_new: amount_negative_new,
            amount_positive: amount_positive,
            amount_negative: amount_negative,
            amount_total: amount_total,
        };
    }

    async getReportForFoodFeedbacks(reportSchedule: CanteenFoodFeedbackReportSchedules, startDate: Date, endDate: Date, canteenEntries: Canteens[], show_food_feedback_labels: boolean, show_food_comments: boolean, foodAverageRating: number | undefined){
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

            let comments: string[] = [];
            if(show_food_comments){
                comments = await this.getAllFoodFeedbacksWithCommentsForFood(food_id, startDate, endDate);
            }


            let labels: ReportFoodEntryLabelType[] = [];
            if(show_food_feedback_labels){
                labels = await this.getReportFeedbackLabelsList(food_id, dictFeedbackLabelsWithTranslation, startDate, endDate);
            }

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

            let usedRatingAverage = VALUE_NOT_AVAILABLE;
            if(food?.rating_average){
                // to fixed 2 decimal places
                usedRatingAverage = food?.rating_average.toFixed(2);
            }

            let usedRatingAmount = "0";
            if(food?.rating_amount){
                usedRatingAmount = food?.rating_amount+"";
            }

            let status_rating = ReportStatusTrafficLightEnum.YELLOW;
            if(food?.rating_average && foodAverageRating){
                const epsilon = FoodRatingCalculator.MAX_RATING_VALUE*ReportGenerator.THRESHOLD_PERCENTAGE;
                if(food.rating_average > foodAverageRating + epsilon){
                    status_rating = ReportStatusTrafficLightEnum.GREEN;
                } else if(food.rating_average < foodAverageRating - epsilon) {
                    status_rating = ReportStatusTrafficLightEnum.RED;
                }
            }

            let foodSummary: ReportFoodEntryType = {
                id: food.id,
                alias: food.alias,
                image_url: image_url,
                rating_average: usedRatingAverage,
                rating_amount: usedRatingAmount,
                comments: comments,
                labels: labels,
                status_rating: status_rating
            };

            foods.push(foodSummary)
        }
        return foods;
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



        let filterDateUpdatedFeedbackLabelEntries: Filter[] = this.getFilterDateUpdatedForReportFeedbackPeriodDays(startDate, endDate);

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
                            ...filterDateUpdatedFeedbackLabelEntries,
                            filterLikes
                        ]
                    }
                });
                let amount_negative_new = await foodFeedbackLabelEntriesService.countItems({
                    filter: {
                        _and: [
                            filterFeedbackLabelEntriesFoodEquals,
                            filterFeedbackLabelEntriesFeedbackLabelEquals,
                            ...filterDateUpdatedFeedbackLabelEntries,
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
                    amount_positive_new: this.formatAmountNewToReportString(amount_positive_new),
                    amount_negative_new: this.formatAmountNewToReportString(amount_negative_new),
                    amount_positive: amount_positive,
                    amount_negative: amount_negative,
                    amount_total: amount_total,
                    status_total: this.calculateTrafficLightStatus(amount_positive, amount_negative),
                    status_new: this.calculateTrafficLightStatus(amount_positive_new, amount_negative_new)
                }

                labels_counted_as_list.push(labelEntry);

            }
        }

        return labels_counted_as_list;
    }

    private getFilterDateUpdatedForReportFeedbackPeriodDays(startDate: Date, endDate: Date): Filter[] {

        let endDatePlusOneDay = new Date(endDate);
        endDatePlusOneDay.setDate(endDatePlusOneDay.getDate() + 1);


        return [
            {
                date_updated: {
                    _gte: DateHelper.foodofferDateTypeToString(DateHelper.getFoodofferDateTypeFromDate(startDate))
                }
            },
            {
                date_updated: {
                    _lt: DateHelper.foodofferDateTypeToString(DateHelper.getFoodofferDateTypeFromDate(endDatePlusOneDay))
                }
            }
        ];
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
                    _nnull: true
                }
            }
        ]

        let filterDateUpdated = this.getFilterDateUpdatedForReportFeedbackPeriodDays(startDate, endDate);
        if(filterDateUpdated){
            filter.push(...filterDateUpdated);
        }

        let feedbacksWithComments = await itemService.readByQuery({
            filter: {
                _and: filter
            },
            fields: ['*'],
            limit: -1
        });

        let comments = [];
        for(let feedback of feedbacksWithComments){
            let comment = feedback?.comment;
            if(comment){
                // we should sanitize the comment here just to be sure that we don't have any html tags in the comment
                let sanitized_comment = comment.replace(/<[^>]*>?/gm, '');
                comments.push(sanitized_comment);
            }
        }
        return comments;
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
