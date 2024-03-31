import React, {FunctionComponent} from 'react';
import {TranslationKeys, useTranslation} from '@/helper/translations/Translation';
import {IconNames} from '@/constants/IconNames';
import {Weekday} from '@/helper/date/DateHelper';
import {PriceGroups, useAccountBalance, useProfilePriceGroup} from '@/states/SynchedProfile';
import {View} from '@/components/Themed';
import {AnimationPriceGroup} from "@/compositions/animations/AnimationPriceGroup";
import {SettingsRow} from "@/components/settings/SettingsRow";
import {MyModalActionSheetItem} from "@/components/modal/MyModalActionSheet";
import {useModalGlobalContext} from "@/components/rootLayout/RootThemeProvider";
import {useIsAccountBalanceEnabled} from "@/states/SynchedAppSettings";
import {formatPrice} from "@/components/pricing/PricingBadge";
import {useRouter} from "expo-router";


interface AppState {

}
export const SettingsRowDataAccess: FunctionComponent<AppState> = ({...props}) => {
	const isAccountBalanceEnabled = useIsAccountBalanceEnabled()
	const translation_dataAccess = useTranslation(TranslationKeys.dataAccess);
	const [accountBalance, setAccountBalance] = useAccountBalance();
	const router = useRouter()

	if(!isAccountBalanceEnabled) {
		return null
	}

	let label = translation_dataAccess
	let accessibilityLabel = translation_dataAccess
	let usedIconName = IconNames.data_access_icon

	const onPress = () => {
		router.push('/(app)/data-access/');
	}


	return (
		<>
			<SettingsRow labelLeft={label} onPress={onPress} accessibilityLabel={accessibilityLabel} leftContent={label} leftIcon={usedIconName} {...props}  />
		</>

	)
}
