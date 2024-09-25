import React, {FunctionComponent} from 'react';
import {Canteens, Foodoffers, Foods} from "@/helper/database/databaseTypes/types";
import {useFoodTranslation} from "@/helper/food/FoodTranslation";
import {AccountRequiredTouchableOpacity} from "@/components/buttons/AccountRequiredTouchableOpacity";
import {useIsNotificationActiveForFood, useSynchedOwnFoodFeedback} from "@/states/SynchedFoodFeedbacks";
import {MyNotificationRemoteButton} from "@/compositions/notification/MyNotificationRemoteButton";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {useFoodsAreaColor} from "@/states/SynchedAppSettings";

export type FoodNotifyButtonProps = {
	food: Foods;
	foodoffer?: Foodoffers | null | undefined;
	showOnlyWhenNotificationIsActive?: boolean
}

export const FoodNotifyButton : FunctionComponent<FoodNotifyButtonProps> = (props) => {
	const translation_notify = useTranslation(TranslationKeys.notification);
	let canteen_id: string | undefined = undefined;
	if(!!props.foodoffer?.canteen){
		if(typeof props.foodoffer?.canteen === 'string'){
			canteen_id = props.foodoffer.canteen
		} else if(typeof props.foodoffer?.canteen === 'object'){
			canteen_id = props.foodoffer.canteen.id
		}
	}

	const isNotificationForFoodActive = useIsNotificationActiveForFood(props.food.id, canteen_id, props.foodoffer?.id);

	if(props.showOnlyWhenNotificationIsActive && !isNotificationForFoodActive){
		return null;
	}

	return <AccountRequiredTouchableOpacity translationOfDesiredAction={translation_notify}>
		<FoodNotifyButtonWithPermission food={props.food} foodoffer={props.foodoffer} />
	</AccountRequiredTouchableOpacity>
}

const FoodNotifyButtonWithPermission : FunctionComponent<FoodNotifyButtonProps> = (props) => {
	const food = props.food;
	const food_id = food.id;
	let canteen_id: string | undefined = undefined;
	if(!!props.foodoffer?.canteen){
		if(typeof props.foodoffer?.canteen === 'string'){
			canteen_id = props.foodoffer.canteen
		} else if(typeof props.foodoffer?.canteen === 'object'){
			canteen_id = props.foodoffer.canteen.id
		}
	}
	const foodoffer_id = props.foodoffer?.id;


	const food_name = useFoodTranslation(food) || food_id

	return(
		<FoodNotifyButtonWithPermissionWithName food_id={food_id} food_name={food_name} canteen_id={canteen_id} foodoffer_id={foodoffer_id} />
	)
}

export type FoodNotifyButtonWithNameProps = {
	food_id: string;
	canteen_id?: string;
	foodoffer_id?: string;
	food_name: string;
}
export const FoodNotifyButtonWithPermissionWithName : FunctionComponent<FoodNotifyButtonWithNameProps> = (props) => {
	const food_id = props.food_id;
	const canteen_id = props.canteen_id;
	const foodoffer_id = props.foodoffer_id
	const [foodFeedback, setOwnRating, setOwnComment, setOwnNotify] = useSynchedOwnFoodFeedback(food_id, canteen_id, foodoffer_id);

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