import {CustomDirectusTypes} from "../../../directusTypes/types";
import {ServerAPI} from "../../../../kitcheningredients";
import {Directus} from "@directus/sdk";
import {Profiles} from "../../../directusTypes/types";
import {useJSONState} from "../../../helper/synchedJSONState";
import {SynchedStateKeys} from "../../../helper/synchedVariables/SynchedStateKeys";
import {loadProfileRemote, useSynchedProfile} from "../../profile/ProfileAPI";

export class FoodFeedbackAPI{

	static collection: string = "foods_feedbacks";

	static getOwnFeedbacks(): any {
		const [profile, setProfile] = useSynchedProfile();
		const foods_feedbacks = profile?.foods_feedbacks;
		return foods_feedbacks;
	}

	static getOwnFoodRating(foods_feedbacks, food_id){
		let ownRating = undefined;
		if(!!foods_feedbacks){
			for(let food_feedback of foods_feedbacks){
				if(food_feedback.foods_id === food_id){
					ownRating = food_feedback.rating;
					break;
				}
			}
		}
		return ownRating;
	}

	static getOwnFoodNotify(foods_feedbacks, food_id){
		let ownNotify = false;
		if(!!foods_feedbacks){
			for(let food_feedback of foods_feedbacks){
				let isSame = food_feedback.foods_id+"" === ""+food_id;
				if(isSame){
					ownNotify = food_feedback.notify;
					break;
				}
			}
		}
		return ownNotify;
	}

	static useOwnFoodRating(food_id): [value: number, setValue: (value) => {}] {
		if(!food_id){
			return [null, () => {}];
		}
		const [profile, setProfile] = useSynchedProfile();
		const foods_feedbacks = FoodFeedbackAPI.getOwnFeedbacks();
		let ownRating = FoodFeedbackAPI.getOwnFoodRating(foods_feedbacks, food_id);

		const setValue = async (rating) => {
			await FoodFeedbackAPI.createOrUpdateRating(profile, food_id, rating);
			let reloadedProfile = await loadProfileRemote();
			setProfile(reloadedProfile);
		}

		return [
			ownRating,
			setValue
		]
	}

	static useOwnFoodNotify(food_id): [value: boolean, setValue: (value) => {}] {
		if(!food_id){
			return [null, () => {}];
		}
		const [profile, setProfile] = useSynchedProfile();
		const foods_feedbacks = FoodFeedbackAPI.getOwnFeedbacks();
		let ownNotify = FoodFeedbackAPI.getOwnFoodNotify(foods_feedbacks, food_id);

		const setValue = async (rating) => {
			await FoodFeedbackAPI.createOrUpdateNotify(profile, food_id, rating);
			let reloadedProfile = await loadProfileRemote();
			setProfile(reloadedProfile);
		}

		return [
			ownNotify,
			setValue
		]
	}

	static useSynchedFoodFeedbacks(food_id, initialFeedbacks?): [value: Profiles, setValue: (value) => {}] {
		const [jsonState, setJsonState] = useJSONState(SynchedStateKeys.synchedFoodFeedbacks);

		const setValue = async (feedbacks) => {
			let newJsonState = {...jsonState};
			newJsonState[food_id] = feedbacks;
			await setJsonState(newJsonState);
			return true;
		}

		const foodsFeedbacks = jsonState?.[food_id] || initialFeedbacks || [];

		return [
			foodsFeedbacks,
			setValue
		]
	}

	static async createOrUpdateNotify(profile, foods_id, notify, users_canteenId?){
		let feedback = FoodFeedbackAPI.getFeedbackObj(profile, foods_id, users_canteenId)
		feedback.notify = notify;

		let usersFeedback = await FoodFeedbackAPI.searchUsersFeedback(profile, foods_id);

		await FoodFeedbackAPI.createUpdateOrDeleteFeedback(usersFeedback, feedback)

		return true;
	}

	static async createOrUpdateRating(profile, foods_id, rating, users_canteenId?){
		let feedback = FoodFeedbackAPI.getFeedbackObj(profile, foods_id, users_canteenId)
		feedback.rating = rating;

		let usersFeedback = await FoodFeedbackAPI.searchUsersFeedback(profile, foods_id);

		await FoodFeedbackAPI.createUpdateOrDeleteFeedback(usersFeedback, feedback)

		return true;
	}

	static async createOrUpdateComment(profile, foods_id, comment, users_canteenId?){
		let feedback = FoodFeedbackAPI.getFeedbackObj(profile, foods_id, users_canteenId)
		feedback.comment = comment;

		let usersFeedback = await FoodFeedbackAPI.searchUsersFeedback(profile, foods_id);

		await FoodFeedbackAPI.createUpdateOrDeleteFeedback(usersFeedback, feedback)

		return true;
	}

	private static getFeedbackObj(profile, foods_id, users_canteenId?): any{
		let profiles_id = profile?.id;

		let feedback: any = {
			foods_id: foods_id,
			profiles_id: {id: profiles_id, user: profile.user},
			status: "published"
		}
		if(!!users_canteenId){
			feedback.canteens_id = users_canteenId;
		}

		return feedback;
	}

	static async searchUsersFeedback(profile, foods_id){
		let directus: Directus<CustomDirectusTypes> = ServerAPI.getClient();
		let andFilters = FoodFeedbackAPI.getFilters(profile, foods_id);
		let searchAnswer = await directus.items(FoodFeedbackAPI.collection).readByQuery( {
			limit: -1,
			filter: {
				_and: andFilters
			}
		});

		let foundFeedbacks = searchAnswer?.data;
		let usersFeedback = null;
		if(!!foundFeedbacks && foundFeedbacks.length > 0){ // if there is feedback
			let foundFeedback = foundFeedbacks[0];
			if(foundFeedback.profiles_id === profile?.id){ //if it is the users own feedback
				usersFeedback = foundFeedback;
			}
		}

		return usersFeedback;
	}

	private static getFilters(profile, foods_id){
		let profiles_id = profile?.id;

		let andFilters = [];
		andFilters.push(
			{
				foods_id: {
					_eq: foods_id
				}
			}
		);
		if(!!profiles_id){
			andFilters.push(
				{
					profiles_id: {
						_eq: profiles_id
					}
				}
			)
		}

		return andFilters;
	}

	private static async createUpdateOrDeleteFeedback(usersFeedback, feedbackObj){
		if(!!usersFeedback){
			let updateResult = await FoodFeedbackAPI.updateFeedback(usersFeedback, feedbackObj)

			const shouldDelete = updateResult?.comment===null && updateResult?.rating===null && !updateResult?.notify
			if(shouldDelete){
				let deleteResult = await FoodFeedbackAPI.deleteFeedback(usersFeedback)
			}
		} else {
			let createdFeedback = await FoodFeedbackAPI.createFeedback(feedbackObj)
		}
	}

	private static async createFeedback(feedbackObj){
		let directus: Directus<CustomDirectusTypes> = ServerAPI.getClient();
		return await directus.items(FoodFeedbackAPI.collection).createOne(feedbackObj);
	}

	private static async updateFeedback(usersFeedback, feedbackObj){
		let directus: Directus<CustomDirectusTypes> = ServerAPI.getClient();
		return await directus.items(FoodFeedbackAPI.collection).updateOne(usersFeedback.id, feedbackObj);
	}

	private static async deleteFeedback(usersFeedback){
		let directus: Directus<CustomDirectusTypes> = ServerAPI.getClient();
		return await directus.items(FoodFeedbackAPI.collection).deleteOne(usersFeedback.id);
	}

}
