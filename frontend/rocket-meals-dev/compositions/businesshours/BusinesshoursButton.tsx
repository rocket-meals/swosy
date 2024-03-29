import React, {FunctionComponent} from 'react';
import {IconNames} from '@/constants/IconNames';
import {MyButton} from '@/components/buttons/MyButton';
import {Businesshours} from '@/helper/database/databaseTypes/types';
import {TranslationKeys, useTranslation} from '@/helper/translations/Translation';
import {MyScrollView} from "@/components/scrollview/MyScrollView";
import {BusinesshoursTable} from "@/compositions/businesshours/BusinesshoursTable";
import {MyModal} from "@/components/modal/MyModal";

interface AppState {
	businesshours: Businesshours[] | undefined
}
export const BusinesshoursButton: FunctionComponent<AppState> = ({businesshours, ...props}) => {
	const translation_businesshours = useTranslation(TranslationKeys.businesshours)

	const accessibilityLabel = translation_businesshours;
	const tooltip = accessibilityLabel
	const title = translation_businesshours;

	const [show, setShow] = React.useState(false)

	const onPress = () => {
		setShow(true)
	}


	return (
		<>
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
			<MyModal visible={show} setVisible={setShow} title={title}>
				<MyScrollView>
					<BusinesshoursTable businesshours={businesshours} />
				</MyScrollView>
			</MyModal>
		</>
	)
}
