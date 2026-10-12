import React, { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { interpolateTranslation } from 'repo-depkit-common';
import { useAppSelector } from '@/redux/hooks';
import { useTheme } from '@/hooks/useTheme';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKeys } from '@/locales/keys';
import { MaintenanceNotice } from '@/helper/maintenanceWindowHelper';
import { useMyScrollViewModal } from '@/components/GlobalModal/useMyScrollViewModal';
import MyMarkdownProjectColored from '@/components/MyMarkdownProjectColored';

type MaintenanceModalContentProps = {
	notice: MaintenanceNotice;
	message?: string | null;
};

const MaintenanceModalContent: React.FC<MaintenanceModalContentProps> = ({ notice, message }) => {
	const { theme } = useTheme();
	const { translate } = useLanguage();
	const primaryColor = useAppSelector(state => state.settings.primaryColor);
	// One line for both phases: the time span, the details come from app_settings.maintenance_message.
	const noticeText = interpolateTranslation(translate(TranslationKeys.maintenance_window_notice), { start: format(notice.start, 'HH:mm'), end: format(notice.end, 'HH:mm') });

	return (
		<View style={styles.content}>
			{/* Side bar in the project color, like the MaintenanceBanner. */}
			<View style={[styles.noticeRow, { borderLeftColor: primaryColor }]}>
				<MaterialCommunityIcons name="wrench-clock" size={28} color={primaryColor} />
				<Text style={[styles.noticeText, { color: theme.screen.text }]}>{noticeText}</Text>
			</View>
			<Text style={[styles.updateText, { color: theme.screen.text }]}>
				<Text style={styles.updateTitle}>{translate(TranslationKeys.maintenance_server_update_title)}: </Text>
				{translate(TranslationKeys.maintenance_server_update_text)}
			</Text>
			{message ? <MyMarkdownProjectColored content={message} /> : null}
		</View>
	);
};

/** Opens the maintenance modal for the current maintenance window, e.g. from the MaintenanceBanner. */
export const useShowMaintenanceModal = () => {
	const { show } = useMyScrollViewModal();
	const { translate } = useLanguage();
	return useCallback(
		(notice: MaintenanceNotice, message?: string | null) => {
			show({
				title: translate(TranslationKeys.maintenance),
				children: <MaintenanceModalContent notice={notice} message={message} />,
			});
		},
		[show, translate]
	);
};

const styles = StyleSheet.create({
	content: {
		gap: 16,
		paddingBottom: 16,
	},
	noticeRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		borderLeftWidth: 4,
		paddingLeft: 12,
	},
	updateText: {
		fontSize: 16,
		fontFamily: 'Poppins_400Regular',
	},
	updateTitle: {
		fontFamily: 'Poppins_700Bold',
	},
	noticeText: {
		flex: 1,
		fontSize: 16,
		fontFamily: 'Poppins_400Regular',
	},
});
