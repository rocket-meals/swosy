import React, {FunctionComponent} from 'react';
import {Foods} from "@/helper/database/databaseTypes/types";
import {useFoodTranslation} from "@/helper/food/FoodTranslation";
import {AccountRequiredTouchableOpacity} from "@/components/buttons/AccountRequiredTouchableOpacity";
import {MyButtonNotify} from "@/components/buttons/MyButtonNotify";
import {useIsNotificationActiveForFood, useSynchedOwnFoodFeedback} from "@/states/SynchedFoodFeedbacks";
import {MyNotificationRemoteButton} from "@/compositions/notification/MyNotificationRemoteButton";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {useFoodsAreaColor} from "@/states/SynchedAppSettings";

export type FoodNotifyButtonProps = {
	food: Foods;
	showOnlyWhenNotificationIsActive?: boolean
}

export const FoodNotifyButton : FunctionComponent<FoodNotifyButtonProps> = (props) => {
	const translation_notify = useTranslation(TranslationKeys.notification);

	const isNotificationForFoodActive = useIsNotificationActiveForFood(props.food.id);

	if(props.showOnlyWhenNotificationIsActive && !isNotificationForFoodActive){
		return null;
	}

	return <AccountRequiredTouchableOpacity translationOfDesiredAction={translation_notify}>
		<FoodNotifyButtonWithPermission food={props.food} />
	</AccountRequiredTouchableOpacity>
}

const FoodNotifyButtonWithPermission : FunctionComponent<FoodNotifyButtonProps> = (props) => {
	const food = props.food;
	const food_id = food.id;

	const food_name = useFoodTranslation(food) || food_id

	return(
		<FoodNotifyButtonWithPermissionWithName food_id={food_id} food_name={food_name} />
	)
}

export type FoodNotifyButtonWithNameProps = {
	food_id: string;
	food_name: string;
}
export const FoodNotifyButtonWithPermissionWithName : FunctionComponent<FoodNotifyButtonWithNameProps> = (props) => {
	const food_id = props.food_id;
	const [foodFeedback, setOwnRating, setOwnComment, setOwnNotify] = useSynchedOwnFoodFeedback(food_id);

	const color = useFoodsAreaColor()

	const food_name = props.food_name;

	const notify = foodFeedback?.notify;
	const active = !!notify;

	return(
		<MyNotificationRemoteButton color={color} allowWebToActivateForSmartPhoneIfEmailDisabled={true} tooltip={food_name} accessibilityLabel={food_name} active={active} onPress={() => {
			setOwnNotify(!foodFeedback?.notify);
		}} />
	)
}