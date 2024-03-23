import React, {FunctionComponent} from 'react';
import {IconNames} from '@/constants/IconNames';
import {MyButton} from '@/components/buttons/MyButton';
import {Businesshours} from '@/helper/database/databaseTypes/types';
import {TranslationKeys, useTranslation} from '@/helper/translations/Translation';
import {useMyGlobalActionSheet} from "@/components/actionsheet/MyGlobalActionSheet";
import {View, Text} from "@/components/Themed";
import {MyScrollView} from "@/components/scrollview/MyScrollView";
import {UtilizationForecast} from "@/compositions/utilizationForecast/UtilizationForecast";
import {MySafeAreaView} from "@/components/MySafeAreaView";
import {BusinesshoursTable} from "@/compositions/businesshours/BusinesshoursTable";

export const useTranslationUtilizationForecast = () => {
	const translation_forecast = useTranslation(TranslationKeys.forecast)
	const translation_utilization = useTranslation(TranslationKeys.utilization)
	return translation_forecast + ': ' + translation_utilization;
}

interface AppState {
	businesshours: Businesshours[] | undefined
}
export const BusinesshoursButton: FunctionComponent<AppState> = ({businesshours, ...props}) => {
	const translation_businesshours = useTranslation(TranslationKeys.businesshours)

	const accessibilityLabel = translation_businesshours;
	const tooltip = accessibilityLabel
	const title = translation_businesshours;

	const config = {
		onCancel: async () => {
			return true;
		},
		visible: true,
		title: title,
		renderCustomContent: (backgroundColor: string | undefined, backgroundColorOnHover: string, textColor: string, lighterOrDarkerTextColor: string, hide: () => void) => {
			return <MySafeAreaView>
				<MyScrollView>
					<BusinesshoursTable businesshours={businesshours} />
				</MyScrollView>
			</MySafeAreaView>
		}
	}

	const [show, hide, showActionsheetConfig] = useMyGlobalActionSheet()

	const onPress = () => {
		show(config)
	}


	return (
		<MyButton
				  useOnlyNecessarySpace={true}
				  tooltip={tooltip}
				  accessibilityLabel={accessibilityLabel}
				  useTransparentBackgroundColor={true}
				  useTransparentBorderColor={true}
				  leftIcon={IconNames.businesshours_icon}
				  {...props}
				  onPress={onPress}
		/>
	)
}
