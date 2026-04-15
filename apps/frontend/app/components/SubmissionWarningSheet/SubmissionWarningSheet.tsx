import { Text, View } from 'react-native';
import React, { useState } from 'react';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import styles from './styles';
import { useTheme } from '@/hooks/useTheme';
import { isWeb } from '@/constants/Constants';
import { sheetProps } from './types';
import { useAppSelector } from '@/redux/hooks';
import { useLanguage } from '@/hooks/useLanguage';
import { router } from 'expo-router';
import { FormsSubmissionsHelper } from '@/redux/actions/Forms/FormSubmitions';
import { DatabaseTypes } from 'repo-depkit-common';
import { TranslationKeys } from '@/locales/keys';
import AppButton from '@/components/AppButton';

const SubmissionWarningSheet: React.FC<sheetProps> = ({ id, closeSheet }) => {
	const { theme } = useTheme();
	const { translate } = useLanguage();
	const formsSubmissionsHelper = new FormsSubmissionsHelper();
	const [loading, setLoading] = useState(false);
	const { primaryColor } = useAppSelector(state => state.settings);
	const { user } = useAppSelector(state => state.authReducer);

	const handleProceed = async () => {
		setLoading(true);
		const update = (await formsSubmissionsHelper.updateFormSubmissionById(String(id), {
			user_locked_by: String(user?.id),
			date_started: new Date().toISOString(),
		})) as DatabaseTypes.FormSubmissions;
		if (update) {
			closeSheet();
			setLoading(false);
		}
	};
	return (
		<BottomSheetScrollView style={{ ...styles.sheetView, backgroundColor: theme.sheet.sheetBg }} contentContainerStyle={styles.contentContainer}>
			<View
				style={{
					...styles.sheetHeader,
					paddingRight: isWeb ? 10 : 0,
					paddingTop: isWeb ? 10 : 0,
				}}
			>
				<View style={{ width: 50 }} />
				<Text
					style={{
						...styles.sheetHeading,
						fontSize: 30,
						color: theme.sheet.text,
					}}
				>
					{translate(TranslationKeys.warning)}
				</Text>
			</View>
			<Text
				style={{
					...styles.modalSubHeading,
					color: theme.modal.text,
				}}
			>
				{translate(TranslationKeys.formEditedByAnotherUserWarning)}
			</Text>
			<View style={styles.actionContainer}>
				<AppButton
					text={translate(TranslationKeys.proceed)}
					onPress={handleProceed}
					loading={loading}
					loadingIndicatorColor={theme.background}
					loadingIndicatorSize={22}
					style={{
						...styles.loginButton,
						backgroundColor: primaryColor,
						width: '100%',
					}}
					textStyle={{ ...styles.loginLabel, color: theme.activeText }}
				/>
				<AppButton
					text={translate(TranslationKeys.cancel)}
					onPress={() => router.navigate('/form-submissions')}
					variant="outline"
					style={{
						...styles.loginButton,
						backgroundColor: theme.screen.iconBg,
						borderWidth: 1,
						borderColor: primaryColor,
						width: '100%',
					}}
					textStyle={{ ...styles.loginLabel, color: theme.screen.text }}
				/>
			</View>
		</BottomSheetScrollView>
	);
};

export default SubmissionWarningSheet;
