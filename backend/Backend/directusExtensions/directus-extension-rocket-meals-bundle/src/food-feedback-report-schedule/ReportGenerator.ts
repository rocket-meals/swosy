import {CollectionNames} from "../helpers/CollectionNames";

export class ReportGenerator {
    private itemServiceCreator: any;

    constructor(itemServiceCreator) {
        this.itemServiceCreator = itemServiceCreator;
    }

    /**
     *
     * @param generateReportForDate
     * @param report_feedback_period_days
     * @param canteenEntry
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
    async generateReportJSON(generateReportForDate: Date, report_feedback_period_days, canteenEntry){
        //console.log("generateReportJSON");

        let date = generateReportForDate;
        let dateHumanReadable = date.getDate()+"."+date.getMonth();

        let report = {
            canteen: canteenEntry?.alias || canteenEntry.id,
            report_feedback_period_days: report_feedback_period_days,
            dateHumanReadable: dateHumanReadable,
            foods: {}
        }

        let foods_feedbacks_labels = await this.itemServiceCreator.getItemsService(CollectionNames.FOODS_FEEDBACK_LABELS).readByQuery({fields: ['*'], limit: -1});
        //console.log("Found amount of foods_feedbacks_labels: "+foods_feedbacks_labels.length)
        let foods_feedbacks_labels_dict = this.convertFeedbacksLabelsToDict(foods_feedbacks_labels);

        let foods = [];
        let foodOffersWithFood = await this.getFoodOffersWithFoodAtDateInCanteen(generateReportForDate, canteenEntry?.id);
        for(let foodOfferWithFood of foodOffersWithFood){
            let food = foodOfferWithFood?.food;
            //console.log("Get summary for food_id: "+food?.id);

            let feedbacksWithLabels = await this.getAllFoodFeedbacksWithLabelsForFood(food?.id, report_feedback_period_days);
            //console.log("Found amount of feedbacks: "+feedbacksWithLabels.length)
            let labels_counted_as_list = this.countLabelsAsList(feedbacksWithLabels, foods_feedbacks_labels_dict);

            let comments = this.getFoodFeedbackComments(feedbacksWithLabels);
            //console.log("Found amount of comments: "+comments.length)

            let image_url = null;
            if(food?.image){
                let file_id = food?.image;
                let publicUrl = process.env.PUBLIC_URL;
                if(publicUrl){
                    image_url = publicUrl+'/assets/'+file_id
                }
            }
            if(food?.image_remote_url){
                image_url = food?.image_remote_url;
            }

            let foodSummary = {
                id: food.id,
                alias: food.alias,
                image_url: image_url,
                rating_average: food?.rating_average,
                rating_amount: food?.rating_amount,
                comments: comments,
                labels: labels_counted_as_list
            };

            foods.push(foodSummary)
        }

        report.foods = foods;
        return report
    }

    getFoodFeedbackComments(feedbacks){
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



    convertFeedbacksLabelsToDict(foods_feedbacks_labels){
        let labels_dict = {};
        for(let label of foods_feedbacks_labels){
            labels_dict[label?.id] = label;
        }
        return labels_dict;
    }

    countLabelsAsList(feedbacks, foods_feedbacks_labels_dict){
        let labels_counted_dict = {};
        for(let feedback of feedbacks){
            let labels_relations = feedback?.labels;
            for(let label_relation of labels_relations){
                let label_id = label_relation?.foods_feedbacks_labels_id;
                let foods_feedbacks_labels_obj = foods_feedbacks_labels_dict[label_id];
                let alias = foods_feedbacks_labels_obj?.alias;
                let labels_counted_obj = labels_counted_dict[label_id];
                if(!labels_counted_obj){
                    labels_counted_obj = {
                        id: label_id,
                        alias: alias,
                        count: 0
                    }
                }
                labels_counted_obj.count++;
                labels_counted_dict[label_id] = labels_counted_obj;
            }
        }

        let labels_counted_as_list = [];
        for(let label_id in labels_counted_dict){
            let label_counted_obj = labels_counted_dict[label_id];
            labels_counted_as_list.push(label_counted_obj);
        }

        return labels_counted_as_list;
    }

    async getAllFoodFeedbacksWithLabelsForFood(food_id, report_feedback_period_days){
        let itemService = this.itemServiceCreator.getItemsService(CollectionNames.FOODS_FEEDBACKS)
        let end = new Date();
        let start = new Date(end);
        // subtract report_feedback_period_days amount days from start
        start.setDate(start.getDate() - report_feedback_period_days);

        let food_feedbacks = await itemService.readByQuery({filter: {
                _and: [
                    {
                        food: {
                            _eq: food_id
                        }
                    },
                    {
                        date_updated: {
                            _between: [start.toISOString(), end.toISOString()]
                        }
                    }
                ]
            },
            fields: ['*', "labels.*"],
            limit: -1
        });
        return food_feedbacks;
    }

    async getFoodOffersWithFoodAtDateInCanteen(date, canteen_id){
        let startOfTheDay = new Date(date); // copy the date
        let endOfTheDay = new Date(date); // copy the date
        startOfTheDay.setHours(0,0,0,0); // so set the start at the beginning of the day
        endOfTheDay.setHours(23,59,59,999); //set to end of day

        let itemService = this.itemServiceCreator.getItemsService(CollectionNames.FOODOFFERS)
        let foodOffers = await itemService.readByQuery({filter: {
                    _and: [
                        {
                            date: {
                                _between: [startOfTheDay.toISOString(), endOfTheDay.toISOString()]
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
        return foodOffers;
    }

}
