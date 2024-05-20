import React, {FunctionComponent} from 'react';
import {SettingsRow, SettingsRowProps} from "@/components/settings/SettingsRow";
import {TranslationKey, TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {MyAccessibilityRoles} from "@/helper/accessibility/MyAccessibilityRoles";
import {AllRoutes, router} from "expo-router";

export type SettingsRowNavigateSimpleProps = {
	// translation_key is a static field from the class TranslationKeys
	translation_key: TranslationKey;
	iconLeft: string;
	route: AllRoutes
}
export const SettingsRowNavigateSimple = (props: SettingsRowNavigateSimpleProps) => {
	const translation_title = useTranslation(props.translation_key);
	const accessibilityLabel = translation_title;

	const onPress = () => {
		router.push(props.route);
	}

	return <SettingsRowNavigate accessibilityLabel={accessibilityLabel} labelLeft={translation_title} onPress={onPress} leftIcon={props.iconLeft} />
}

export const SettingsRowNavigate: FunctionComponent<SettingsRowProps> = ({accessibilityLabel, accessibilityRole, ...props}) => {
	const translation_navigate_to = useTranslation(TranslationKeys.navigate_to)
	let usedAccessibilityLabel = translation_navigate_to + ': ' + accessibilityLabel;

	return <SettingsRow accessibilityRole={accessibilityRole || MyAccessibilityRoles.Link} accessibilityLabel={usedAccessibilityLabel} {...props} />
}
