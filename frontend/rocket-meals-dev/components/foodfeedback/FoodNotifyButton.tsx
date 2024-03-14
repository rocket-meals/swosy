import React, {FunctionComponent} from 'react';
import {TouchableOpacity, View} from 'react-native';
import {Icon, Text} from '@/components/Themed';
import {FoodRatingConstant} from '@/components/foodfeedback/FoodRatingConstant';
import {Foods} from "@/helper/database/databaseTypes/types";
import {useSynchedProfileFoodFeedback} from "@/states/SynchedProfile";
import {MyButton} from "@/components/buttons/MyButton";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {useFoodTranslation} from "@/helper/food/FoodTranslation";
import {IconNames} from "@/constants/IconNames";
import {useIsCurrentUserAnonymous, useLogoutCallback} from "@/states/User";
import {MyGlobalActionSheetConfig, useMyGlobalActionSheet} from "@/components/actionsheet/MyGlobalActionSheet";
import {NotAllowed} from "@/compositions/animations/NotAllowed";
import {Tooltip, TooltipContent, TooltipText} from "@gluestack-ui/themed";
import {AccountRequiredTouchableOpacity} from "@/components/buttons/AccountRequiredTouchableOpacity";

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

	const translation_notify = useTranslation(TranslationKeys.notification);
	const translation_active = useTranslation(TranslationKeys.active);
	const translation_activate = useTranslation(TranslationKeys.activate);
	const translation_inactive = useTranslation(TranslationKeys.inactive);
	const translation_deactivate = useTranslation(TranslationKeys.deactivate);

	let accessibilityLabel = translation_notify;
	if (active) {
		accessibilityLabel += ': ' + translation_active;
	} else {
		accessibilityLabel += ': ' + translation_inactive;
	}
	accessibilityLabel += ': ' + food_name;

	let tooltip = translation_notify;
	if(active) {
		tooltip += ': ' + translation_deactivate;
	} else {
		tooltip += ': ' + translation_activate;
	}

	const icon = active ? IconNames.notification_active : IconNames.notification_inactive;

	return(
		<MyButton useOnlyNecessarySpace={true}
				  useTransparentBackgroundColor={true}
				  useTransparentBorderColor={true}
				  accessibilityLabel={accessibilityLabel}
				  tooltip={tooltip}
				  icon={icon}
				  onPress={() => {
					  setNotify(!foodFeedback?.notify);
				  }}
		/>
	)
}