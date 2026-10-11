import React, { useCallback, useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { SettingsList, SettingsListGroupTitle } from 'repo-depkit-common-ui';

import ProjectButton from '@/components/ProjectButton';
import { NotificationHelper } from '@/helper/NotificationHelper';
import { getPushNotificationPermissionStep, PUSH_NOTIFICATION_OPT_IN_ASK_COUNTS, PushNotificationOptInCategory, type PushNotificationOptInState, type PushNotificationPermissionStep } from '@/helper/PushNotificationOptInHelper';
import usePushNotificationOptInPrompt, { readStoredPushNotificationOptInState } from '@/hooks/usePushNotificationOptInPrompt';
import { useTheme } from '@/hooks/useTheme';
import { useAppSelector } from '@/redux/hooks';

const CATEGORIES = Object.values(PushNotificationOptInCategory);

/**
 * Playbook page of the push question after an app feedback, a feature wish or a food comment
 * (`usePushNotificationOptInPrompt`). Developer page, so its texts are not translated, like the
 * rest of the playbook.
 *
 * - "Always show" opens the modal as users see it, without looking at profile, permission or counts.
 * - "Ask with logic" runs exactly what happens after a submission: it counts one submission in the
 *   chosen category and asks only when profile, permission and count allow it.
 */
const PushNotificationOptInPlaybook = () => {
	const { theme } = useTheme();
	const profileId = useAppSelector(state => state.authReducer.profile?.id);
	const { askForPushNotifications, showPushNotificationOptInQuestion } = usePushNotificationOptInPrompt();
	const [category, setCategory] = useState<PushNotificationOptInCategory>(PushNotificationOptInCategory.FOOD_COMMENT);
	const [state, setState] = useState<PushNotificationOptInState | undefined>();
	const [permissionStep, setPermissionStep] = useState<PushNotificationPermissionStep | undefined>();
	const [lastResult, setLastResult] = useState<string>('-');

	const refresh = useCallback(async () => {
		setState(await readStoredPushNotificationOptInState(category));
		setPermissionStep(getPushNotificationPermissionStep({ platform: Platform.OS, permission: await NotificationHelper.getDeviceNotificationPermission() }));
	}, [category]);

	useEffect(() => {
		void refresh();
	}, [refresh]);

	const cycleCategory = () => {
		const next = CATEGORIES[(CATEGORIES.indexOf(category) + 1) % CATEGORIES.length];
		if (next) {
			setCategory(next);
		}
	};

	const showAlways = async () => {
		const granted = await showPushNotificationOptInQuestion();
		setLastResult(granted ? 'always shown: granted' : 'always shown: not granted');
		await refresh();
	};

	const askWithLogic = async () => {
		await askForPushNotifications(category);
		setLastResult(`asked with logic (${category})`);
		await refresh();
	};

	const textStyle = { ...styles.body, color: theme.screen.text };

	return (
		<View style={styles.container}>
			<SettingsListGroupTitle title="Modal" />
			<ProjectButton text="Always show" onPress={() => void showAlways()} />
			<ProjectButton text="Ask with logic" onPress={() => void askWithLogic()} />

			<SettingsListGroupTitle title="Logic" />
			<SettingsList title="Category" value={category} handleFunction={cycleCategory} groupPosition="single" />
			<Text style={textStyle}>Asked at counts: {PUSH_NOTIFICATION_OPT_IN_ASK_COUNTS[category].join(', ')}, then doubling</Text>
			<Text style={textStyle}>Profile: {profileId ? 'yes' : 'no (never asked)'}</Text>
			<Text style={textStyle}>Permission: {permissionStep ?? '...'}</Text>
			<Text style={textStyle}>
				Count: {state?.count ?? '...'} · No: {state?.declines ?? '...'} · Next question at: {state?.nextAskAt ?? '...'}
			</Text>
			<Text style={textStyle}>Last: {lastResult}</Text>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		width: '100%',
		gap: 8,
	},
	body: {
		fontSize: 14,
		fontFamily: 'Poppins_400Regular',
	},
});

export default PushNotificationOptInPlaybook;
