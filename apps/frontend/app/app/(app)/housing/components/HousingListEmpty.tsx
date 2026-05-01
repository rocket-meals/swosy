import React, { memo } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKeys } from '@/locales/keys';

interface HousingListEmptyProps {
	loading: boolean;
	theme: any;
}

const HousingListEmpty: React.FC<HousingListEmptyProps> = ({ loading, theme }) => {
	const { translate } = useLanguage();
	if (loading) {
		return (
			<View style={styles.container}>
				<ActivityIndicator size={30} color={theme.screen.text} />
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<Text
				style={{
					fontSize: 16,
					fontFamily: 'Poppins_400Regular',
					color: theme.screen.text,
				}}
			>
				{translate(TranslationKeys.noApartmentFound)}
			</Text>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		height: 200,
		width: '100%',
		justifyContent: 'center',
		alignItems: 'center',
	},
});

export default memo(HousingListEmpty);
