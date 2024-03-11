import React, {FunctionComponent} from 'react';
import {useSettingTranslationCourseTimetable} from './useSettingTranslationCourseTimetable';
import {useIsCourseTimetableEnabled} from '@/states/SynchedAppSettings';
import {SettingsRowActionsheet} from '@/components/settings/SettingsRowActionsheet';
import {MyGlobalActionSheetConfig} from '@/components/actionsheet/MyGlobalActionSheet';
import {MySafeAreaView} from '@/components/MySafeAreaView';
import {MyScrollView} from '@/components/scrollview/MyScrollView';
import {Text, View} from '@/components/Themed';
import {IconNames} from '@/constants/IconNames';

export const SettingsRowCourseTimetable: FunctionComponent = (props) => {
	const courseTimetableVisiblity = useIsCourseTimetableEnabled();
	const translation = useSettingTranslationCourseTimetable();

	const config: MyGlobalActionSheetConfig = {
		onCancel: undefined,
		visible: true,
		title: translation,
		renderCustomContent: (backgroundColor: string | undefined, backgroundColorOnHover: string, textColor: string, lighterOrDarkerTextColor: string, hide: () => void) => {
			return (
				<MySafeAreaView>
					<MyScrollView>
						<View style={{
							width: '100%',
							padding: 20,
						}}
						>
							<Text>
								{'This is the course timetable settings'}
							</Text>
						</View>
					</MyScrollView>
				</MySafeAreaView>
			);
		}
	}

	if (!courseTimetableVisiblity) {
		return null;
	} else {
		return <SettingsRowActionsheet accessibilityLabel={translation} labelLeft={translation} config={config} leftIcon={IconNames.course_timetable_icon} />
	}
}
