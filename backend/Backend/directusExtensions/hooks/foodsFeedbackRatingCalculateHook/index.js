import {ItemsServiceCreator} from "../../helper/ItemsServiceCreator.js"; // in directus we need to add the filetype ... otherwise we get an error

export default async function ({filter, action, init, schedule}, {
    services,
    exceptions,
    database,
    getSchema,
    logger
}) {

    const collection = "foods_feedbacks"

    let schema = await getSchema();
    let itemsServiceCreator = new ItemsServiceCreator(services, database, schema);
    let foodsService = itemsServiceCreator.getItemsService("foods");
    let foodfeedbacksService = itemsServiceCreator.getItemsService(collection);


    async function recalculateFoodFeedbackIdsRatings(food_feedback_ids){
        //console.log("recalculateFoodFeedbackIdsRatings: food_feedback_ids: "+food_feedback_ids.length);
        // so maybe a lot off food_feedback for the same food are deleted.
        // we should therefore just get the unique food_ids which we need to recalculate the rating for
        let food_id_dict = {}

        for(let food_feedback_id of food_feedback_ids){
            //console.log("Get food Feedback for: food_feedback_id: "+food_feedback_id);
            let food_feedback = await foodfeedbacksService.readOne(food_feedback_id);
            let food_id = food_feedback?.food;
            if(!!food_id){
                food_id_dict[food_id] = true;
            }
        }

        let uniqueFoodIds = Object.keys(food_id_dict)
        //console.log("Amount unique food ids: "+uniqueFoodIds.length);

        for(let food_id of uniqueFoodIds){
            await recalculateFoodRating(food_id);
        }
    }

    async function recalculateFoodRating(food_id){
        //console.log("recalculateFoodRating: food_id: "+food_id);

        let food_feedbacks = await foodfeedbacksService.readByQuery({
            filter: {
                food: food_id
            },
            limit: -1
        })

        let sum = 0;
        let rating_amount = 0;
        const MAX_RATING = 5;
        const MIN_RATING = 1;
        for(let food_feedback of food_feedbacks){
            let rating = food_feedback?.rating;
            if(rating!==undefined && rating!==null){ // then must be a number
                if(MIN_RATING <= rating && rating <= MAX_RATING){ // rating is in valid range // Altough we checked that in directus, better safe than sorry
                    sum += rating;
                    rating_amount++;
                }
            }
        }
        if(rating_amount > 0){
            let rating_average = sum / rating_amount;
            await foodsService.updateOne(food_id, {
                rating_average: rating_average,
                rating_amount: rating_amount
            })

        } else {
            // set for food both values to null
            await foodsService.updateOne(food_id, {
                rating_average: null,
                rating_amount: null
            })
        }
    }


    action(
        collection + ".items.update",
        async (meta, context) => {
            // get the collection which was updated
            //console.log("UPDATE FOOD FEEDBACKS");
            //console.log(meta);

            let food_feedbacks_ids = meta.keys;
            await recalculateFoodFeedbackIdsRatings(food_feedbacks_ids);
            // {
            //   event: 'foods_feedbacks.items.update',
            //   payload: { rating: 4 },
            //   keys: [ '73e6dd26-f570-428d-8f8c-0a452beb222e' ],
            //   collection: 'foods_feedbacks'
            // }

        }
    );

    action(
        collection + ".items.create",
        async (meta, context) => {
            // get the collection which was created
            //console.log("CREATE FOOD FEEDBACKS");
            //console.log(meta);
            let food_feedback_id = meta.key;
            let food_feedbacks_ids = [food_feedback_id];
            await recalculateFoodFeedbackIdsRatings(food_feedbacks_ids);
            //{
            //  |   event: 'foods_feedbacks.items.create',
            //  payload: { rating: 4, food: '1090' },
            //  key: '54e58fc8-3a15-42ed-b27b-856adffdd20c',
            //  collection: 'foods_feedbacks'
            //}

        }
    );

    action(
        collection + ".items.delete",
        async (meta, context) => {
            // get the collection which was deleted
            //console.log("DELETE FOOD FEEDBACKS");
            //console.log(meta);

            let food_feedbacks_ids = meta.keys;
            await recalculateFoodFeedbackIdsRatings(food_feedbacks_ids);
            // {
            //   event: 'foods_feedbacks.items.delete',
            //   payload: [ '73e6dd26-f570-428d-8f8c-0a452beb222e' ],
            //   keys: [ '73e6dd26-f570-428d-8f8c-0a452beb222e' ],
            //   collection: 'foods_feedbacks'
            // }
        }
    );
};
