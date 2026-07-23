import React, { useRef, useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import { TranslationKeys } from '@/locales/keys';
import { useLanguage } from '@/hooks/useLanguage';
import styles from './styles';

interface UrlField {
	id: number;
	value: string;
}

const RssFeedConfig = () => {
	useSetPageTitle(TranslationKeys.rss_feed);
	const { theme } = useTheme();
	const { translate } = useLanguage();
	const nextUrlFieldIdRef = useRef(0);
	const [urls, setUrls] = useState<UrlField[]>(() => [{ id: nextUrlFieldIdRef.current++, value: '' }]);
	const [interval, setInterval] = useState('10');

	const addUrlField = () => {
		setUrls(prev => [...prev, { id: nextUrlFieldIdRef.current++, value: '' }]);
	};

	const updateUrl = (id: number, value: string) => {
		setUrls(prev => prev.map(field => (field.id === id ? { ...field, value } : field)));
	};

	return (
		<ScrollView style={[styles.container, { backgroundColor: theme.screen.background }]}>
			<View style={styles.field}>
				<Text style={[styles.label, { color: theme.screen.text }]}>RSS Feed URLs</Text>
				{urls.map(field => (
					<TextInput
						key={field.id}
						style={[
							styles.input,
							{
								color: theme.screen.text,
								borderColor: theme.screen.icon,
								marginBottom: 8,
							},
						]}
						value={field.value}
						onChangeText={text => updateUrl(field.id, text)}
						placeholder="https://example.com/feed"
						placeholderTextColor={theme.screen.icon}
					/>
				))}
				<Text style={[styles.example, { color: theme.screen.text }]}>Beispiel: https://www.tagesschau.de/infoservices/alle-meldungen-100~rss2.xml</Text>
				<TouchableOpacity style={[styles.addButton, { backgroundColor: theme.screen.iconBg }]} onPress={addUrlField}>
					<Text style={[styles.addButtonText, { color: theme.screen.text }]}>Add URL</Text>
				</TouchableOpacity>
			</View>
			<View style={styles.field}>
				<Text style={[styles.label, { color: theme.screen.text }]}>Switch Interval (seconds)</Text>
				<TextInput style={[styles.input, { color: theme.screen.text, borderColor: theme.screen.icon }]} value={interval} onChangeText={setInterval} keyboardType="number-pad" placeholder="10" placeholderTextColor={theme.screen.icon} />
			</View>
			<TouchableOpacity
				style={[styles.button, { backgroundColor: theme.screen.iconBg }]}
				onPress={() => {
					router.push({
						pathname: '/rss-feed',
						params: {
							urls: urls.map(field => field.value).filter(u => u.trim()).join(','),
							switchIntervalInSeconds: interval,
						},
					});
				}}
			>
				<Text style={[styles.buttonText, { color: theme.screen.text }]}>{translate(TranslationKeys.rss_feed)}</Text>
			</TouchableOpacity>
		</ScrollView>
	);
};

export default RssFeedConfig;
