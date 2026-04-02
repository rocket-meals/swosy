import React, { useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import { TranslationKeys } from '@/locales/keys';
import { useLanguage } from '@/hooks/useLanguage';
import styles from './styles';
import AppButton from '@/components/AppButton';

const RssFeedConfig = () => {
	useSetPageTitle(TranslationKeys.rss_feed);
	const { theme } = useTheme();
	const { translate, language } = useLanguage();
	const [urls, setUrls] = useState<string[]>(['']);
	const [interval, setInterval] = useState('10');

	const addUrlField = () => {
		setUrls(prev => [...prev, '']);
	};

	const updateUrl = (index: number, value: string) => {
		setUrls(prev => prev.map((u, i) => (i === index ? value : u)));
	};

	return (
		<ScrollView style={[styles.container, { backgroundColor: theme.screen.background }]}>
			<View style={styles.field}>
				<Text style={[styles.label, { color: theme.screen.text }]}>RSS Feed URLs</Text>
				{urls.map((url, index) => (
					<TextInput
						key={index}
						style={[
							styles.input,
							{
								color: theme.screen.text,
								borderColor: theme.screen.icon,
								marginBottom: 8,
							},
							{ textAlign: language === 'ar' ? 'right' : 'left' },
						]}
						value={url}
						onChangeText={text => updateUrl(index, text)}
						placeholder="https://example.com/feed"
						placeholderTextColor={theme.screen.icon}
					/>
				))}
				<Text style={[styles.example, { color: theme.screen.text }]}>Beispiel: https://www.tagesschau.de/infoservices/alle-meldungen-100~rss2.xml</Text>
				<AppButton
					variant="ghost"
					usePlainText
					text="Add URL"
					onPress={addUrlField}
					style={[styles.addButton, { backgroundColor: theme.screen.iconBg, marginVertical: 0 }]}
					textStyle={[styles.addButtonText, { color: theme.screen.text }]}
				/>
			</View>
			<View style={styles.field}>
				<Text style={[styles.label, { color: theme.screen.text }]}>Switch Interval (seconds)</Text>
				<TextInput style={[styles.input, { color: theme.screen.text, borderColor: theme.screen.icon }, { textAlign: language === 'ar' ? 'right' : 'left' }]} value={interval} onChangeText={setInterval} keyboardType="number-pad" placeholder="10" placeholderTextColor={theme.screen.icon} />
			</View>
			<AppButton
				variant="ghost"
				usePlainText
				text={translate(TranslationKeys.rss_feed)}
				onPress={() => {
					router.push({
						pathname: '/rss-feed',
						params: {
							urls: urls.filter(u => u.trim()).join(','),
							switchIntervalInSeconds: interval,
						},
					});
				}}
				style={[styles.button, { backgroundColor: theme.screen.iconBg, marginVertical: 0 }]}
				textStyle={[styles.buttonText, { color: theme.screen.text }]}
			/>
		</ScrollView>
	);
};

export default RssFeedConfig;
