import { Text, View } from 'react-native';
import React, { useMemo } from 'react';
import { styles } from './styles';
import { useTheme } from '@/hooks/useTheme';
import { router } from 'expo-router';
import { useAppSelector } from '@/redux/hooks';
import { getTitleFromTranslation } from '@/helper/resourceHelper';
import AppButton from '@/components/AppButton';

const Footer = () => {
	const { theme } = useTheme();
	const { wikisDict, language } = useAppSelector(state => state.settings);
	const wikis = useMemo(() => Object.values(wikisDict || {}), [wikisDict]);

	return (
		<View style={styles.footer}>
			{wikis &&
				wikis?.map((wiki: any, index: number) => {
					if (wiki?.custom_id && !wiki?.url && wiki?.show_in_drawer_as_bottom_item) {
						return (
							<React.Fragment key={index}>
								<AppButton
									variant="ghost"
									usePlainText
									text={getTitleFromTranslation(wiki?.translations, language)}
									onPress={() =>
										router.push({
											pathname: '/wikis',
											params: { custom_id: wiki?.custom_id },
										})
									}
									style={{ marginVertical: 0 }}
									textStyle={{ ...styles.link, color: theme.screen.text }}
								/>
								<Text style={{ ...styles.divider, color: theme.screen.text }}>|</Text>
							</React.Fragment>
						);
					}
				})}
		</View>
	);
};

export default Footer;
