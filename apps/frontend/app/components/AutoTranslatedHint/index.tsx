import React, { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMyScrollViewModal } from '@/components/GlobalModal/useMyScrollViewModal';
import { useLanguage } from '@/hooks/useLanguage';
import { useTheme } from '@/hooks/useTheme';
import { TranslationKeys } from '@/locales/keys';

type AutoTranslatedHintProps = {
	/** Icon size, matched to the text it follows */
	size?: number;
};

/**
 * A small translate icon that marks a machine-translated text. Tapping it opens a modal that tells
 * the text may contain translation errors and the original is binding.
 *
 * Rendered as a `Text` (vector icons are text glyphs), so it can sit inline at the end of a
 * heading and wraps with it.
 */
const AutoTranslatedHint = ({ size = 18 }: AutoTranslatedHintProps) => {
	const { show, close } = useMyScrollViewModal();
	const { translate } = useLanguage();
	const { theme } = useTheme();
	const title = translate(TranslationKeys.auto_translated);

	const openHint = useCallback(() => {
		show({
			title,
			onClose: close,
			children: (
				<View style={styles.modalContent}>
					<MaterialCommunityIcons name="translate" size={40} color={theme.screen.icon} />
					<Text style={[styles.modalText, { color: theme.screen.text }]}>{translate(TranslationKeys.auto_translated_hint)}</Text>
				</View>
			),
		});
	}, [close, show, theme.screen.icon, theme.screen.text, title, translate]);

	return (
		<Text onPress={openHint} accessibilityRole="button" accessibilityLabel={title} suppressHighlighting>
			{' '}
			<MaterialCommunityIcons name="translate" size={size} color={theme.screen.icon} />
		</Text>
	);
};

const styles = StyleSheet.create({
	modalContent: {
		alignItems: 'center',
		gap: 16,
		paddingVertical: 8,
	},
	modalText: {
		fontSize: 16,
		lineHeight: 24,
		textAlign: 'center',
	},
});

export default AutoTranslatedHint;
