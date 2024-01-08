import React, {useEffect, useState} from "react";
import {FoodCard} from "./FoodCard";
import {GridList} from "../GridList";
import {Text} from "native-base"
import {FoodFeedbackAPI} from "./foodfeedback/FoodFeedbackAPI";
import {FoodRatingConstant} from "./foodfeedback/foodrating/FoodRatingConstant";
import {
	countDislikedMarkings,
	countLikedMarkings,
	useMarkingsFromFoodofferMarkings,
	useSynchedProfileMarkingsDict
} from "../profile/MarkingAPI";
import {useSynchedMarkingsDict} from "../../helper/synchedJSONState";

export const FoodCardListComponent = ({foodoffers, errorComponent, nothingFoundComponent, children, onUpload,...props}: any) => {

	const ownFeedbacks = FoodFeedbackAPI.getOwnFeedbacks();
	const [profilesMarkingsDict, setProfileMarking, removeProfileMarking] = useSynchedProfileMarkingsDict();
	const [allMarkingsDict, setAllMarkingsDict] = useSynchedMarkingsDict();

	// corresponding componentDidMount
	useEffect(() => {

	}, [props])

	let renderedFoodCards = [];

	//console.log("FoodCardListComponent");
	//console.log(foodoffers);

	if(foodoffers===null){
		return errorComponent
	} else if(foodoffers===undefined){
		for(let i=0; i<10; i++){
			renderedFoodCards.push(<FoodCard key={""+i} food={undefined} />)
		}
	} else {
		if(foodoffers.length===0){
			return nothingFoundComponent;
		} else {
			let sortedFoodOffers = sortFoodsOffers(foodoffers);

			for(let i = 0; i<sortedFoodOffers.length; i++){
				let foodoffer = sortedFoodOffers[i];
				renderedFoodCards.push(<FoodCard key={foodoffer.id} foodoffer={foodoffer} food={foodoffer?.food} onUpload={onUpload} />)
			}
		}
	}

	function sortFoodsOffers(foodoffers){
		foodoffers = sortFoodOffersByRating(foodoffers);
		foodoffers = sortFoodOffersByMarkings(foodoffers);
		return foodoffers;
	}

	function sortFoodOffersByMarkings(foodoffers){
		let copyFoodOffers = foodoffers.slice();
		copyFoodOffers.sort((foodoffer_a, foodoffer_b) => {
			//console.log("Sort by markings");

			if(!foodoffer_a && !foodoffer_b){
				//console.log("Both foodoffers are null");
				return 0;
			}
			if(!foodoffer_a){
				//console.log("Foodoffer a is null");
				return -1;
			}
			if(!foodoffer_b){
				//console.log("Foodoffer b is null");
				return 1;
			}
			//console.log("Foodoffer a: " + foodoffer_a.id);
			//console.log(foodoffer_a)
			//console.log("Foodoffer b: " + foodoffer_b.id);
			//console.log(foodoffer_b)

			const food_offer_markings_a = foodoffer_a?.markings;
			const markings_a = useMarkingsFromFoodofferMarkings(food_offer_markings_a, allMarkingsDict);

			const food_offer_markings_b = foodoffer_b?.markings;
			const markings_b = useMarkingsFromFoodofferMarkings(food_offer_markings_b, allMarkingsDict);

			let amount_food_a_disliked_markings = countDislikedMarkings(markings_a, profilesMarkingsDict);
			let amount_food_b_disliked_markings = countDislikedMarkings(markings_b, profilesMarkingsDict);
			//console.log("Amount food a disliked markings: " + amount_food_a_disliked_markings);
			//console.log("Amount food b disliked markings: " + amount_food_b_disliked_markings);

			//console.log("--------")

			if(amount_food_a_disliked_markings === amount_food_b_disliked_markings){
				let amount_food_a_liked_markings = countLikedMarkings(markings_a, profilesMarkingsDict);
				let amount_food_b_liked_markings = countLikedMarkings(markings_b, profilesMarkingsDict);
				return amount_food_b_liked_markings - amount_food_a_liked_markings;
			} else{
				return amount_food_a_disliked_markings-amount_food_b_disliked_markings;
			}
		});
		return copyFoodOffers;
	}

	function sortFoodOffersByRating(foodoffers){
		let copyFoodOffers = foodoffers.slice();
		copyFoodOffers.sort((foodoffer_a, foodoffer_b) => {
			return sortFoodsByRating(foodoffer_a?.food, foodoffer_b?.food);
		});
		return copyFoodOffers;
	}

	function sortFoodsByRating(food_a, food_b){
		let food_a_id = food_a.id;
		const food_a_rating = FoodFeedbackAPI.getOwnFoodRating(ownFeedbacks, food_a_id);
		let food_b_id = food_b.id;
		const food_b_rating = FoodFeedbackAPI.getOwnFoodRating(ownFeedbacks, food_b_id);

		// if both have no rating or are identical, return 0
		if(food_a_rating === food_b_rating){
			return 0;
		}

		if(!food_a_rating){
			if(food_b_rating < FoodRatingConstant.middleRatingValue){
				return -1;
			}
			return 1;
		}
		if(!food_b_rating){
			if(food_a_rating < FoodRatingConstant.middleRatingValue){
				return 1;
			}
			return -1;
		}

		if(food_a_rating>food_b_rating){
			return -1;
		} else {
			return 1;
		}
	}

	return(
		<GridList paddingHorizontal={"2%"} useFlatList={true}>
			{renderedFoodCards}
		</GridList>
	)
}
