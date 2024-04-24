import React, {FunctionComponent} from 'react';
import {Foods} from "@/helper/database/databaseTypes/types";
import {useFoodTranslation} from "@/helper/food/FoodTranslation";
import {AccountRequiredTouchableOpacity} from "@/components/buttons/AccountRequiredTouchableOpacity";
import {MyButtonNotify} from "@/components/buttons/MyButtonNotify";
import {useSynchedOwnFoodFeedback} from "@/states/SynchedFoodFeedbacks";
import {MyNotificationRemoteButton} from "@/compositions/notification/MyNotificationRemoteButton";

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
	const [foodFeedback, setOwnRating, setOwnComment, setOwnNotify, setOwnLabels] = useSynchedOwnFoodFeedback(food.id);

	const food_name = useFoodTranslation(food);

	const notify = foodFeedback?.notify;
	const active = !!notify;

	return(
		<MyNotificationRemoteButton tooltip={food_name} accessibilityLabel={food_name} active={active} onPress={() => {
			setOwnNotify(!foodFeedback?.notify);
		}} />
	)
}