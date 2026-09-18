import React, { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useTheme } from '@/hooks/useTheme';
import { useLanguage } from '@/hooks/useLanguage';
import { useAppSelector } from '@/redux/hooks';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import SettingsList from '@/components/SettingsList';
import { useOcr } from '@/hooks/useOcr';
import { ENGINE_NAME } from '@/helper/TextRecognitionShared';
import { TranslationKeys } from '@/locales/keys';
import styles from '../styles';

/**
 * Text recognition with nothing to look for.
 *
 * The giro card screen next door asks the same engine for one specific thing
 * and stops the moment it has it. This one asks for nothing and shows
 * everything, which is what you want when the question is "what does the engine
 * actually see here" — a card, a receipt, a sign, whatever is at hand, from the
 * camera or from a photo already on the device.
 *
 * Because there is nothing to find, `useOcr` leaves out the automatic camera:
 * a scan that cannot recognize its own success would never end on its own.
 */
const TextRecognitionTestScreen = () => {
	useSetPageTitle(TranslationKeys.text_recognition_test);
	const { theme } = useTheme();
	const { translate } = useLanguage();
	const { primaryColor } = useAppSelector((state) => state.settings);
	const { openOcr } = useOcr();

	const [recognizedLines, setRecognizedLines] = useState<string[]>([]);

	const startRecognition = useCallback(() => {
		openOcr({
			title: translate(TranslationKeys.text_recognition_test),
			hint: translate(TranslationKeys.text_recognition_test_hint),
			onLinesRecognized: setRecognizedLines,
			onRecognized: ({ lines }) => setRecognizedLines(lines),
		});
	}, [openOcr, translate]);

	return (
		<ScrollView style={{ ...styles.container, backgroundColor: theme.screen.background }} contentContainerStyle={{ ...styles.contentContainer, backgroundColor: theme.screen.background }}>
			<View style={styles.content}>
				<Text style={{ ...styles.heading, color: theme.screen.text }}>{translate(TranslationKeys.text_recognition_test)}</Text>
				<Text style={{ ...styles.body, color: theme.screen.text }}>{translate(TranslationKeys.text_recognition_test_description)}</Text>

				<View style={styles.section}>
					<SettingsList iconBgColor={primaryColor} leftIcon={<MaterialCommunityIcons name="text-recognition" size={24} color={theme.screen.icon} />} label={translate(TranslationKeys.text_recognition_test_start)} rightIcon={<MaterialCommunityIcons name="chevron-right" size={24} color={theme.screen.icon} />} handleFunction={startRecognition} groupPosition="top" />
					<SettingsList iconBgColor={primaryColor} leftIcon={<MaterialCommunityIcons name="chip" size={24} color={theme.screen.icon} />} label={translate(TranslationKeys.giro_card_scan_engine)} value={ENGINE_NAME} groupPosition="bottom" />
				</View>

				<View style={styles.section}>
					<Text style={{ ...styles.heading, color: theme.screen.text }}>{translate(TranslationKeys.text_recognition_test_result)}</Text>
					<View style={{ ...styles.logsContainer, backgroundColor: theme.screen.iconBg }}>
						{recognizedLines.length === 0 ? (
							<Text style={{ ...styles.body, color: theme.screen.text }}>{translate(TranslationKeys.text_recognition_test_no_result)}</Text>
						) : (
							recognizedLines.map((line, index) => (
								<Text key={`${index}-${line}`} selectable style={{ ...styles.body, color: theme.screen.text }}>
									{line}
								</Text>
							))
						)}
					</View>
				</View>
			</View>
		</ScrollView>
	);
};

export default TextRecognitionTestScreen;
