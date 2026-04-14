import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKeys } from '@/locales/keys';

const Index = () => {
	const { translate } = useLanguage();
	return (
		<View>
			<Text>{translate(TranslationKeys.faq_living)}</Text>
		</View>
	);
};

export default Index;

const styles = StyleSheet.create({});
