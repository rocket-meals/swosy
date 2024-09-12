import React, {FunctionComponent} from 'react';
import {IconNames} from '@/constants/IconNames';
import {SettingsRow} from "@/components/settings/SettingsRow";
import {useTermsAndPrivacyConsentAcceptedDate} from "@/states/ConsentStatus";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {DateHelper} from "@/helper/date/DateHelper";


interface AppState {

}
export const SettingsRowConsentDateTermsAndPrivacy: FunctionComponent<AppState> = ({...props}) => {
	const [termsAndPrivacyConsentAcceptedDate, setTermsAndPrivacyConsentAcceptedDate] = useTermsAndPrivacyConsentAcceptedDate()

	const translation_terms_and_conditions_accepted_and_privacy_policy_read_at_date = useTranslation(TranslationKeys.terms_and_conditions_accepted_and_privacy_policy_read_at_date);

	const humanReadableDate = termsAndPrivacyConsentAcceptedDate ? DateHelper.formatOfferDateToReadable(termsAndPrivacyConsentAcceptedDate, true, true, true) : ""
	let label = translation_terms_and_conditions_accepted_and_privacy_policy_read_at_date
	let accessibilityLabel = translation_terms_and_conditions_accepted_and_privacy_policy_read_at_date+": "+humanReadableDate
	let usedIconName = IconNames.privacy_policy_icon


	return (
		<>
			<SettingsRow labelLeft={label} accessibilityLabel={accessibilityLabel} leftIcon={usedIconName} labelRight={humanReadableDate} {...props}  />
		</>

	)
}
