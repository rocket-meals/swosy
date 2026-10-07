import React, { useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMyScrollViewModal } from '@/components/GlobalModal/useMyScrollViewModal';
import SettingsList from '@/components/SettingsList';
import ProjectButton from '@/components/ProjectButton';
import { useLanguage } from '@/hooks/useLanguage';
import { useTheme } from '@/hooks/useTheme';
import useDebugMode from '@/hooks/useDebugMode';
import { TranslationKeys } from '@/locales/keys';

type CourseTimetableOptionsParams = {
	/** False while no import source exists: the action then only explains that, without asking to overwrite. */
	reimportAvailable: boolean;
	onReimport: () => void;
	onReset: () => void;
	onLoadDemo: () => void;
	onFirstDayOfWeek: () => void;
	onSettings: () => void;
};

type OptionItem = {
	key: string;
	title: string;
	icon: React.ReactNode;
	onPress: () => void;
};

/**
 * The timetable's "more options" menu (header button), modelled on the food offers options.
 * Destructive actions ask for confirmation in a stacked modal.
 */
export const useMyScrollviewModalCourseTimetableOptions = (params: CourseTimetableOptionsParams) => {
	const { show, close, closeAll } = useMyScrollViewModal();
	const { translate } = useLanguage();
	const { theme } = useTheme();
	const debugMode = useDebugMode();

	const confirm = useCallback(
		(title: string, message: string, onConfirm: () => void) => {
			show({
				title,
				children: (
					<View style={styles.confirm}>
						<Text style={[styles.confirmText, { color: theme.screen.text }]}>{message}</Text>
						<ProjectButton
							text={translate(TranslationKeys.confirm)}
							onPress={() => {
								onConfirm();
								closeAll();
							}}
							style={styles.confirmButton}
						/>
						<TouchableOpacity onPress={close} style={styles.cancel} accessibilityRole="button">
							<Text style={{ color: theme.screen.text }}>{translate(TranslationKeys.cancel)}</Text>
						</TouchableOpacity>
					</View>
				),
			});
		},
		[close, closeAll, show, theme.screen.text, translate]
	);

	const openCourseTimetableOptionsModal = useCallback(() => {
		const options: OptionItem[] = [
			{
				key: 'reimport',
				title: translate(TranslationKeys.course_timetable_reimport),
				icon: <MaterialCommunityIcons name="cloud-download-outline" size={20} />,
				onPress: () => {
					if (!params.reimportAvailable) {
						params.onReimport();
						return;
					}
					confirm(translate(TranslationKeys.course_timetable_reimport), translate(TranslationKeys.course_timetable_reimport_confirm), params.onReimport);
				},
			},
			{
				key: 'reset',
				title: translate(TranslationKeys.course_timetable_reset),
				icon: <MaterialCommunityIcons name="delete-sweep-outline" size={20} />,
				onPress: () => confirm(translate(TranslationKeys.course_timetable_reset), translate(TranslationKeys.course_timetable_reset_confirm), params.onReset),
			},
			{
				key: 'firstDayOfWeek',
				title: translate(TranslationKeys.first_day_of_week),
				icon: <MaterialCommunityIcons name="calendar-start" size={20} />,
				onPress: params.onFirstDayOfWeek,
			},
		];
		if (debugMode) {
			// Lets developers try the screen with a full week before the Stud.IP import exists.
			options.push({
				key: 'demo',
				title: translate(TranslationKeys.course_timetable_load_demo),
				icon: <MaterialCommunityIcons name="bug-outline" size={20} />,
				onPress: () => {
					params.onLoadDemo();
					close();
				},
			});
		}
		options.push({
			key: 'settings',
			title: translate(TranslationKeys.further_settings),
			icon: <MaterialCommunityIcons name="cog-outline" size={20} />,
			onPress: () => {
				close();
				params.onSettings();
			},
		});

		show({
			title: translate(TranslationKeys.options_and_information),
			children: (
				<View style={styles.list}>
					{options.map((option, index) => (
						<SettingsList key={option.key} title={option.title} leftIcon={option.icon} onPress={option.onPress} groupPosition={options.length === 1 ? 'single' : index === 0 ? 'top' : index === options.length - 1 ? 'bottom' : 'middle'} showSeparator={index !== options.length - 1} />
					))}
				</View>
			),
		});
	}, [close, confirm, debugMode, params, show, translate]);

	return { openCourseTimetableOptionsModal };
};

export default useMyScrollviewModalCourseTimetableOptions;

const styles = StyleSheet.create({
	list: {
		width: '100%',
	},
	confirm: {
		gap: 12,
	},
	confirmText: {
		fontSize: 15,
		fontFamily: 'Poppins_400Regular',
	},
	confirmButton: {
		marginVertical: 0,
	},
	cancel: {
		alignSelf: 'center',
		paddingVertical: 8,
	},
});
