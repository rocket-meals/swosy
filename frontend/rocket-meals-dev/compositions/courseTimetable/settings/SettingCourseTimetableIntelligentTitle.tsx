import React, {FunctionComponent} from 'react';
import {useAppTranslation} from '../../translations/AppTranslation';
import {
	usePersonalCourseTimetableTitleIntelligent
} from '../CourseTimetableHelper';
import {SettingsRowBooleanSwitch} from '../../settings/SettingsRowBooleanSwitch';
import {TitleIcon} from '../../icons/TitleIcon';

interface AppState {
}
export const SettingCourseTimetableIntelligentTitle: FunctionComponent<AppState> = (props) => {
	const translationTitle = useAppTranslation('title');
	const translationIntelligent = useAppTranslation('intelligent');

	const [titleIntelligent, setTitleIntelligent] = usePersonalCourseTimetableTitleIntelligent();

	const content = translationTitle + ': ' + translationIntelligent;

	function onPress(nextValue) {
		setTitleIntelligent(nextValue);
	}

	return (
		<SettingsRowBooleanSwitch key={'state:'+titleIntelligent} onPress={onPress} accessibilityLabel={content} value={titleIntelligent} leftContent={content} leftIcon={<TitleIcon />} />
	)
}
