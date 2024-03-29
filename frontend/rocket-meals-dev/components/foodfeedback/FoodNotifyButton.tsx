import React, {FunctionComponent} from 'react';
import {Foods} from "@/helper/database/databaseTypes/types";
import {useSynchedProfileFoodFeedback} from "@/states/SynchedProfile";
import {useFoodTranslation} from "@/helper/food/FoodTranslation";
import {AccountRequiredTouchableOpacity} from "@/components/buttons/AccountRequiredTouchableOpacity";
import {MyButtonNotify} from "@/components/buttons/MyButtonNotify";

export type FoodNotifyButtonProps = {
	food: Foods;
}

export const FoodNotifyButton : FunctionComponent<FoodNotifyButtonProps> = (props) => {
	return <AccountRequiredTouchableOpacity>
		<FoodNotifyButtonWithPermission food={props.food} />
	</AccountRequiredTouchableOpacity>
}

const FoodNotifyButtonWithPermission : FunctionComponent<FoodNotifyButtonProps> = (props) => {
	const food = props.food;
	const food_id = food.id;
	const [foodFeedback, setRating, setNotify, setComment] = useSynchedProfileFoodFeedback(food_id);

	const food_name = useFoodTranslation(food);

	const notify = foodFeedback?.notify;
	const active = !!notify;

	return(
		<MyButtonNotify tooltip={food_name} accessibilityLabel={food_name} active={active} onPress={() => {
			setNotify(!foodFeedback?.notify);
		}} />
	)
}