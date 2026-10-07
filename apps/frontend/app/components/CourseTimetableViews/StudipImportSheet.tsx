import React, { useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SettingsListGroupTitle, SettingsListSelectOptionSingle } from 'repo-depkit-common-ui';
import { SettingsListTextInputField } from '@/components/SettingsListTextInput';
import { useMyScrollViewModal } from '@/components/GlobalModal/useMyScrollViewModal';
import useCourseTimetable from '@/hooks/useCourseTimetable';
import useToast from '@/hooks/useToast';
import { useTheme } from '@/hooks/useTheme';
import { useLanguage } from '@/hooks/useLanguage';
import { useAppSelector } from '@/redux/hooks';
import { TranslationKeys } from '@/locales/keys';
import { darkTheme } from '@/styles/themes';
import { myContrastColor } from '@/helper/ColorHelper';
import { mergeImportedEvents } from '@/helper/courseTimetable/CourseTimetableModel';
import { STUDIP_INSTANCES, StudipImportError, fetchStudipSchedule } from '@/helper/courseTimetable/StudipImporter';

const ERROR_KEYS: Record<string, TranslationKeys> = {
	unauthorized: TranslationKeys.course_timetable_import_error_credentials,
	network: TranslationKeys.course_timetable_import_error_network,
	unexpected: TranslationKeys.course_timetable_import_error_unexpected,
};

/**
 * Import of the timetable from Stud.IP: choose the university, enter the Stud.IP login and
 * replace the timetable with the current semester's schedule. The login goes straight to
 * Stud.IP (see `StudipImporter`) and is kept only in this sheet's state.
 */
const StudipImportSheet: React.FC = () => {
	const { theme } = useTheme();
	const isDark = theme === darkTheme;
	const { translate } = useLanguage();
	const toast = useToast();
	const { closeAll } = useMyScrollViewModal();
	const { events, saveEvents } = useCourseTimetable();
	const { primaryColor, appSettings } = useAppSelector(state => state.settings);
	const accentColor = appSettings?.course_timetable_area_color || primaryColor;
	const accentText = myContrastColor(accentColor, theme, isDark);

	const [instanceId, setInstanceId] = useState(STUDIP_INSTANCES[0]?.id ?? '');
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [loading, setLoading] = useState(false);
	const [errorText, setErrorText] = useState<string | null>(null);

	const instance = STUDIP_INSTANCES.find(entry => entry.id === instanceId);
	const canSubmit = !!instance && username.trim().length > 0 && password.length > 0 && !loading;

	const startImport = async () => {
		if (!instance || !canSubmit) return;
		setLoading(true);
		setErrorText(null);
		try {
			const imported = await fetchStudipSchedule(instance, username, password);
			if (imported.length === 0) {
				// Nothing to import: keep the current timetable instead of wiping it.
				setErrorText(translate(TranslationKeys.course_timetable_import_empty));
				return;
			}
			await saveEvents(mergeImportedEvents(events, imported, true));
			setPassword('');
			toast(`${translate(TranslationKeys.course_timetable_import_success)} (${imported.length})`, 'success');
			closeAll();
		} catch (error) {
			const code = error instanceof StudipImportError ? error.code : 'unexpected';
			console.warn('Stud.IP import failed:', code, error instanceof Error ? error.message : '');
			setErrorText(translate(ERROR_KEYS[code] ?? TranslationKeys.course_timetable_import_error_unexpected));
		} finally {
			setLoading(false);
		}
	};

	return (
		<View style={styles.container}>
			<View style={[styles.hint, { backgroundColor: theme.screen.iconBg }]}>
				<MaterialCommunityIcons name="shield-lock-outline" size={20} color={theme.screen.text} />
				<Text style={[styles.hintText, { color: theme.screen.text }]}>{translate(TranslationKeys.course_timetable_import_privacy_hint)}</Text>
			</View>

			<SettingsListGroupTitle title={translate(TranslationKeys.course_timetable_import_university)} />
			{STUDIP_INSTANCES.map((entry, index) => (
				<SettingsListSelectOptionSingle key={entry.id} label={entry.name} isSelected={entry.id === instanceId} selectionColor={accentColor} onPress={() => setInstanceId(entry.id)} groupPosition={STUDIP_INSTANCES.length === 1 ? 'single' : index === 0 ? 'top' : index === STUDIP_INSTANCES.length - 1 ? 'bottom' : 'middle'} showSeparator={index !== STUDIP_INSTANCES.length - 1} />
			))}

			<SettingsListGroupTitle title={translate(TranslationKeys.course_timetable_import_login)} />
			<SettingsListTextInputField placeholder={translate(TranslationKeys.course_timetable_import_username)} value={username} onChangeText={setUsername} autoCapitalize="none" autoCorrect={false} textContentType="username" returnKeyType="next" />
			<SettingsListTextInputField placeholder={translate(TranslationKeys.password)} value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" autoCorrect={false} textContentType="password" returnKeyType="done" onSubmitEditing={startImport} />

			<Text style={[styles.replaceHint, { color: theme.screen.placeholder }]}>{translate(TranslationKeys.course_timetable_import_replace_hint)}</Text>
			{Platform.OS === 'web' ? <Text style={[styles.replaceHint, { color: theme.screen.placeholder }]}>{translate(TranslationKeys.course_timetable_import_web_hint)}</Text> : null}
			{errorText ? <Text style={[styles.error, { color: theme.sheet.inputBorderInvalid }]}>{errorText}</Text> : null}

			<TouchableOpacity onPress={startImport} disabled={!canSubmit} style={[styles.button, { backgroundColor: accentColor, opacity: canSubmit ? 1 : 0.5 }]} accessibilityRole="button" accessibilityState={{ disabled: !canSubmit, busy: loading }}>
				{loading ? <ActivityIndicator color={accentText} /> : <MaterialCommunityIcons name="cloud-download-outline" size={20} color={accentText} />}
				<Text style={[styles.buttonText, { color: accentText }]}>{translate(TranslationKeys.course_timetable_import_start)}</Text>
			</TouchableOpacity>
		</View>
	);
};

export default StudipImportSheet;

const styles = StyleSheet.create({
	container: {
		width: '100%',
		gap: 8,
		paddingBottom: 24,
	},
	hint: {
		flexDirection: 'row',
		gap: 10,
		padding: 12,
		borderRadius: 14,
	},
	hintText: {
		flex: 1,
		fontSize: 13,
		lineHeight: 19,
		fontFamily: 'Poppins_400Regular',
	},
	replaceHint: {
		fontSize: 13,
		fontFamily: 'Poppins_400Regular',
		marginTop: 4,
	},
	error: {
		fontSize: 14,
		fontFamily: 'Poppins_600SemiBold',
	},
	button: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
		height: 50,
		borderRadius: 12,
		marginTop: 12,
	},
	buttonText: {
		fontSize: 16,
		fontFamily: 'Poppins_700Bold',
	},
});
