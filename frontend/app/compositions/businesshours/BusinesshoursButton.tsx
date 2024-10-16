import React, {FunctionComponent} from 'react';
import {IconNames} from '@/constants/IconNames';
import {MyButton} from '@/components/buttons/MyButton';
import {Businesshours} from '@/helper/database/databaseTypes/types';
import {TranslationKeys, useTranslation} from '@/helper/translations/Translation';
import {MyScrollView} from "@/components/scrollview/MyScrollView";
import {BusinesshoursTable} from "@/compositions/businesshours/BusinesshoursTable";
import {useModalGlobalContext} from "@/components/rootLayout/RootThemeProvider";
import {Heading, View} from "@/components/Themed";

interface AppState {
	businesshours?: Businesshours[] | undefined,
	foodservicehours?: Businesshours[] | undefined,
	foodservicehoursDuringSemesterBreak?: Businesshours[] | undefined,
}
export const BusinesshoursButton: FunctionComponent<AppState> = ({businesshours, foodservicehours, foodservicehoursDuringSemesterBreak, ...props}) => {
	const translation_businesshours = useTranslation(TranslationKeys.businesshours)
	const translation_foodservicehours = useTranslation(TranslationKeys.foodservicehours)
	const translation_foodservicehoursDuringSemesterBreak = useTranslation(TranslationKeys.foodservicehoursDuringSemesterBreak)

	const [modalConfig, setModalConfig] = useModalGlobalContext();

	const accessibilityLabel = translation_businesshours;
	const tooltip = accessibilityLabel
	const title = translation_businesshours;

	let businesshoursInformation: any = undefined
	if(businesshours && businesshours.length > 0){
		businesshoursInformation = <>
			<View style={{width: '100%', paddingLeft: 20, paddingRight: 20}}>
				<Heading>{translation_businesshours}</Heading>
			</View>
			<BusinesshoursTable businesshours={businesshours} />
		</>
	}

	let foodservicehoursInformation: any = undefined
	if(foodservicehours && foodservicehours.length > 0){
		foodservicehoursInformation = <>
			<View style={{width: '100%', paddingLeft: 20, paddingRight: 20}}>
				<Heading>{translation_foodservicehours}</Heading>
			</View>
			<BusinesshoursTable businesshours={foodservicehours} />
		</>
	}

	let foodservicehoursDuringSemesterBreakInformation: any = undefined
	if(foodservicehoursDuringSemesterBreak && foodservicehoursDuringSemesterBreak.length > 0){
		foodservicehoursDuringSemesterBreakInformation = <>
			<View style={{width: '100%', paddingLeft: 20, paddingRight: 20}}>
				<Heading>{translation_foodservicehoursDuringSemesterBreak}</Heading>
			</View>
			<BusinesshoursTable businesshours={foodservicehoursDuringSemesterBreak} />
		</>
	}

	const onPress = () => {
		setModalConfig({
			title: title,
			accessibilityLabel: accessibilityLabel,
			label: translation_businesshours,
			key: 'businesshours',
			renderAsContentInsteadItems: (key: string, hide: () => void) => {
				return(
					<MyScrollView>
						{businesshoursInformation}
						<View style={{height: 20}} />
						{foodservicehoursInformation}
						<View style={{height: 20}} />
						{foodservicehoursDuringSemesterBreakInformation}
					</MyScrollView>
				)
			}
		})
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
