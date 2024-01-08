import React, {useEffect, useState} from "react";
import {NoFoodOffersFound} from "./NoFoodOffersFound";
import {NotFound} from "../animations/NotFound";
import {OtherFoodOffersDaysFound} from "./OtherFoodOffersDaysFound";
import {FoodCardListComponent} from "./FoodCardListComponent";

export const FoodOfferListComponent = ({foodoffers, children, onUpload,...props}: any) => {
	return(
		<FoodCardListComponent
			foodoffers={foodoffers}
			onUpload={onUpload}
			errorComponent={ <NotFound />}
			nothingFoundComponent={[<NoFoodOffersFound />, <OtherFoodOffersDaysFound />]}
		/>
	)
}
