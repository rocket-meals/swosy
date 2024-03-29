import React, {FunctionComponent} from 'react';
import {IconNames} from '@/constants/IconNames';
import {MyButton} from '@/components/buttons/MyButton';
import {Businesshours} from '@/helper/database/databaseTypes/types';
import {TranslationKeys, useTranslation} from '@/helper/translations/Translation';
import {MyScrollView} from "@/components/scrollview/MyScrollView";
import {BusinesshoursTable} from "@/compositions/businesshours/BusinesshoursTable";
import {useModalGlobalContext} from "@/components/rootLayout/RootThemeProvider";

interface AppState {
	businesshours: Businesshours[] | undefined
}
export const BusinesshoursButton: FunctionComponent<AppState> = ({businesshours, ...props}) => {
	const translation_businesshours = useTranslation(TranslationKeys.businesshours)
	const [modalConfig, setModalConfig] = useModalGlobalContext();

	const accessibilityLabel = translation_businesshours;
	const tooltip = accessibilityLabel
	const title = translation_businesshours;

	const onPress = () => {
		setModalConfig({
			title: title,
			accessibilityLabel: accessibilityLabel,
			label: translation_businesshours,
			key: 'businesshours',
			renderAsContentInsteadItems: (key: string, hide: () => void) => {
				return(
					<MyScrollView>
						<BusinesshoursTable businesshours={businesshours} />
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
