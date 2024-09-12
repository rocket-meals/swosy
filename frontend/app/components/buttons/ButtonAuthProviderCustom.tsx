import React from 'react';
import {MyButton} from '@/components/buttons/MyButton';
import {TouchableOpacityIgnoreChildEvents} from "@/components/buttons/DisabledTouchableOpacity";
import {View, Text} from "@/components/Themed";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {useTermsAndPrivacyConsentAcceptedDate} from "@/states/ConsentStatus";

// Define the type for Single Sign-On (SSO) providers
type ButtonAuthProviderCustomProps = {
    onPress?: (() => void | Promise<void>) | undefined,
	onPressWhenPrivacyPolicyIsNotAccepted?: (() => void | Promise<void>) | undefined,
	privacyPolicyAccepted?: boolean,
    accessibilityLabel: string,
    text: string,
    icon_name: string,
    disabled?: boolean
	leftIconColoredBox?: boolean
}

// The component to handle SSO login links
export const ButtonAuthProviderCustom = ({ leftIconColoredBox, privacyPolicyAccepted, text, accessibilityLabel, onPressWhenPrivacyPolicyIsNotAccepted, onPress, icon_name, disabled }: ButtonAuthProviderCustomProps) => {

	let usedLeftIconColoredBox = leftIconColoredBox === undefined ? true : leftIconColoredBox;
	const [termsAndPrivacyConsentAcceptedDate, setTermsAndPrivacyConsentAcceptedDate] = useTermsAndPrivacyConsentAcceptedDate()

	const translation_to_proceed_you_have_to_accept_privacy_policy_and_terms_of_service = useTranslation(TranslationKeys.to_proceed_you_have_to_accept_privacy_policy_and_terms_of_service);

	const button = (
		<View>
			<MyButton text={text}
					  onPress={() => {
						  setTermsAndPrivacyConsentAcceptedDate(new Date())
						  if(onPress){
							  onPress()
						  }
					  }}
					  disabled={disabled}
					  accessibilityLabel={accessibilityLabel}
					  leftIcon={icon_name}
					  leftIconColoredBox={usedLeftIconColoredBox}
			/>
		</View>
	)

	if(privacyPolicyAccepted){
		return (
			<>
				{button}
			</>
		)
	} else {
		return (
			<TouchableOpacityIgnoreChildEvents accessibilityLabel={translation_to_proceed_you_have_to_accept_privacy_policy_and_terms_of_service}
											   tooltip={translation_to_proceed_you_have_to_accept_privacy_policy_and_terms_of_service}
											   style={{}}
											   useDefaultOpacity={true}
											   onPress={onPressWhenPrivacyPolicyIsNotAccepted}>
				{button}
			</TouchableOpacityIgnoreChildEvents>
		)
	}
};