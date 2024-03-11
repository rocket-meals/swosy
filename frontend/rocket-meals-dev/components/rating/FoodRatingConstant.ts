export class FoodRatingConstant {
	static maxRatingValue = 5;
	static minRatingValue = 1;
	static middleRatingValue = (FoodRatingConstant.maxRatingValue + FoodRatingConstant.minRatingValue) / 2;

	static isRatingBelowAvg(ratingValue: number) {
		if (ratingValue !== null && ratingValue !== undefined) {
			return ratingValue<FoodRatingConstant.middleRatingValue;
		} else {
			return false;
		}
	}

	static isRatingAboveAvg(ratingValue: number) {
		if (ratingValue !== null && ratingValue !== undefined) {
			return ratingValue >= FoodRatingConstant.middleRatingValue;
		} else {
			return false;
		}
	}

	static isLikeRating(rating: number) {
		return rating >= FoodRatingConstant.middleRatingValue;
	}

	static isDislikeRating(rating: number) {
		if (rating) {
			return rating < FoodRatingConstant.middleRatingValue;
		}
		return false;
	}
}