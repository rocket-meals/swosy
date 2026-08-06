import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useTheme } from '@/hooks/useTheme';
import { useLanguage } from '@/hooks/useLanguage';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import { TranslationKeys } from '@/locales/keys';
import SettingsList from '@/components/SettingsList';
import useMyScrollviewTextInputModal from '@/hooks/useMyScrollviewTextInputModal';
import { CustomMarkdown } from 'repo-depkit-common-ui';

type MarkdownExample = {
	id: string;
	title: string;
	content: string;
};

const MarkdownTestScreen = () => {
	useSetPageTitle(TranslationKeys.markdown_test);
	const { theme } = useTheme();
	const { translate } = useLanguage();
	const { openTextInputModal } = useMyScrollviewTextInputModal();
	const [customMarkdown, setCustomMarkdown] = useState(String.raw`**Markdown**\n\nMehrzeiliges Beispiel.`);

	const markdownExamples = useMemo<MarkdownExample[]>(
		() => [
			{
				id: 'line-breaks',
				title: translate(TranslationKeys.markdown_example_line_breaks),
				content: String.raw`**Geschichte hinter der Speise:**\n\nDie erste Version der Mensa App SWOSY entstand im Rahmen meiner Masterarbeit.\n\nIch wünsche allen viel Appetit mit diesem Burger.`,
			},
			{
				id: 'list',
				title: translate(TranslationKeys.markdown_example_list),
				content: String.raw`## Zutaten\n- Kartoffeln\n- Gemüse\n- Sauce`,
			},
			{
				id: 'links',
				title: translate(TranslationKeys.markdown_example_links),
				content: String.raw`[Webseite](https://www.swosy.de)\n\n[Mail](mailto:test@swosy.de)\n\n[Telefon](tel:+49123456789)`,
			},
			{
				id: 'geo',
				title: translate(TranslationKeys.markdown_example_geo),
				content: '[Route anzeigen](geo:52.27158519499881, 8.04527493587901)',
			},
		],
		[translate]
	);

	const sectionsMarkdownContent = String.raw`## Abschnitt A\n\nInhalt von A.\n\n### A.1\n\nVerschachtelter Inhalt.\n\n## Abschnitt B\n\nInhalt von B.`;

	const openEditor = () => {
		openTextInputModal({
			title: translate(TranslationKeys.markdown_custom_input),
			placeholder: translate(TranslationKeys.markdown_custom_input_placeholder),
			initialValue: customMarkdown,
			saveLabel: translate(TranslationKeys.save),
			onSave: value => setCustomMarkdown(value),
			multiline: true,
			numberOfLines: 8,
			textAlignVertical: 'top',
			inputStyle: { minHeight: 180 },
		});
	};

	return (
		<ScrollView style={[styles.container, { backgroundColor: theme.screen.background }]} contentContainerStyle={styles.contentContainer}>
			<View style={styles.content}>
				<Text style={[styles.heading, { color: theme.screen.text }]}>{translate(TranslationKeys.markdown_test)}</Text>
				<Text style={[styles.description, { color: theme.screen.text }]}>{translate(TranslationKeys.markdown_test_description)}</Text>

				<SettingsList iconBgColor={theme.screen.iconBg} leftIcon={<MaterialCommunityIcons name="text-box-edit-outline" size={24} color={theme.screen.icon} />} label={translate(TranslationKeys.markdown_custom_input)} value={translate(TranslationKeys.tap_to_edit)} rightIcon={<MaterialCommunityIcons name="pencil" size={20} color={theme.screen.icon} />} handleFunction={openEditor} groupPosition="single" />

				<View style={[styles.section, { backgroundColor: theme.screen.iconBg }]}>
					<Text style={[styles.sectionTitle, { color: theme.screen.text }]}>{translate(TranslationKeys.markdown_custom_output)}</Text>
					<CustomMarkdown content={customMarkdown} textColor={theme.screen.text} />
				</View>

				{markdownExamples.map(example => (
					<View key={example.id} style={[styles.section, { backgroundColor: theme.screen.iconBg }]}>
						<Text style={[styles.sectionTitle, { color: theme.screen.text }]}>{example.title}</Text>
						<CustomMarkdown content={example.content} textColor={theme.screen.text} />
					</View>
				))}

				{/* Building/campus/housing description text (and wiki pages) enable
				    collapsibleSections - shown here so that mode stays covered too. */}
				<View style={[styles.section, { backgroundColor: theme.screen.iconBg }]}>
					<Text style={[styles.sectionTitle, { color: theme.screen.text }]}>{`${translate(TranslationKeys.markdown_example_sections)} (collapsibleSections)`}</Text>
					<CustomMarkdown content={sectionsMarkdownContent} textColor={theme.screen.text} collapsibleSections />
				</View>
			</View>
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	contentContainer: {
		padding: 20,
	},
	content: {
		gap: 14,
	},
	heading: {
		fontFamily: 'Poppins_700Bold',
		fontSize: 24,
	},
	description: {
		fontFamily: 'Poppins_400Regular',
		fontSize: 16,
		lineHeight: 22,
	},
	section: {
		padding: 14,
		borderRadius: 12,
		gap: 10,
	},
	sectionTitle: {
		fontFamily: 'Poppins_600SemiBold',
		fontSize: 15,
	},
});

export default MarkdownTestScreen;
