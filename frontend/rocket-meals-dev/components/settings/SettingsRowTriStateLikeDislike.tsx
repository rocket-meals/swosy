import React, {FunctionComponent, useState} from 'react';
import {SettingsRow, SettingsRowProps} from './SettingsRow';
import {TranslationKeys, useTranslation} from '@/helper/translations/Translation';
import { View} from '@/components/Themed';
import {MyButton} from '@/components/buttons/MyButton';

interface AppState {
    value: boolean | undefined | null,
    accessibilityLabel: string,
    labelLeft: string,
    onPress?: (nextValue: boolean | undefined) => void,
    onTrackColor?: string,
    debug?: boolean,
    disabled?: boolean

}
export const SettingsRowTriStateLikeDislike: FunctionComponent<AppState & SettingsRowProps> = ({accessibilityLabel, labelLeft,...props}) => {
	const debug = props?.debug

	const [isCheckedRaw, setIsChecked] = useState(props?.value)

	const isLikeButtonActive = isCheckedRaw===true;
	const isDislikeButtonActive = isCheckedRaw===false;
	const isStatusUndefined = isCheckedRaw===undefined;

	let isChecked: boolean | undefined = false;
	if (isCheckedRaw===true) {
		isChecked = true
	} else if (isCheckedRaw===false) {
		isChecked = false;
	} else {
		isChecked = undefined
	}

	const translationSwitch = useTranslation(TranslationKeys.switch);
	const translationDisabled = useTranslation(TranslationKeys.button_disabled);

	let accessibilityLabelWithFunction = accessibilityLabel ? accessibilityLabel+': '+translationSwitch : translationSwitch
	if (props?.disabled) {
		accessibilityLabelWithFunction += ' ('+translationDisabled+')';
	}

	function onPress(likeButton: boolean) {
		let nextValue: boolean | undefined = !isChecked;

		if (likeButton) {
			if (isLikeButtonActive) {
				nextValue = undefined;
			} else {
				nextValue = true;
			}
		} else {
			if (isDislikeButtonActive) {
				nextValue = undefined
			} else {
				nextValue = false
			}
		}

		setIsChecked(nextValue)
		if (props.onPress) {
			props.onPress(nextValue);
		}
	}

	const rightContent: any = (
		<View style={{
			paddingRight: 0,
			justifyContent: 'center',
			alignItems: 'center',
			flexDirection: 'row'
		}}
		>
			<MyButton leftIcon={'thumb-up'}
				isActive={isLikeButtonActive}
				useOnlyNecessarySpace={true}
				useTransparentBorderColor={true}
				accessibilityLabel={'like'}
				onPress={() => {
					onPress(true)
				}}
			/>
			<MyButton leftIcon={'thumb-down'}
				isActive={isDislikeButtonActive}
				useOnlyNecessarySpace={true}
				useTransparentBorderColor={true}
				accessibilityLabel={'like'}
				onPress={() => {
					onPress(false)
				}}
			/>
		</View>
	)

	return (
		<SettingsRow padding={2} labelLeft={labelLeft} accessibilityLabel={accessibilityLabelWithFunction} accessibilityRole={'switch'} {...props} rightContent={rightContent} onPress={onPress} />
	)
}
