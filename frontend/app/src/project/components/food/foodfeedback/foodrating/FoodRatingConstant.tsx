export class FoodRatingConstant{
	static maxRatingValue = 5;
	static minRatingValue = 1;
	static middleRatingValue = (FoodRatingConstant.maxRatingValue+FoodRatingConstant.minRatingValue)/2;


	static isRatingBelowAvg(ratingValue) {
		if(ratingValue!==null && ratingValue !== undefined){
			return ratingValue<FoodRatingConstant.middleRatingValue;
		} else {
			return false;
		}
	}

	static isRatingAbouveAvg(ratingValue) {
		if(ratingValue!==null && ratingValue !== undefined){
			return ratingValue>=FoodRatingConstant.middleRatingValue;
		} else {
			return false;
		}
	}

	static isLikeRating(rating){
		return rating>=FoodRatingConstant.middleRatingValue;
	}

	static isDislikeRating(rating){
		if(!!rating){
			return rating<FoodRatingConstant.middleRatingValue;
		}
		return false;
	}
}
