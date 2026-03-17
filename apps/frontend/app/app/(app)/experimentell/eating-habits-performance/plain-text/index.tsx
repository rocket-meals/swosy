/**
 * Eating Habits Performance Variant: Plain Text
 *
 * The simplest possible rendering of markings: a plain View with each
 * marking's text and its translations shown as plain <Text> elements.
 * No icons, no images, no interactive components – just raw text.
 *
 * Purpose: establish a baseline render time for the raw marking data.
 */
import { SafeAreaView, ScrollView, Text, View } from 'react-native';
import React, { useMemo, useRef } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { useAppSelector } from '@/redux/hooks';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKeys } from '@/locales/keys';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import { DatabaseTypes } from 'repo-depkit-common';
import { getTextFromTranslation, getDescriptionFromTranslation } from '@/helper/resourceHelper';
import DebugView from '@/components/DebugView';

const EatingHabitsPlainText = () => {
	useSetPageTitle(TranslationKeys.eating_habits_performance_plain_text);
	const { theme } = useTheme();
	const { translate, language } = useLanguage();
	const { markings } = useAppSelector((state) => state.food);

	const mountTimeRef = useRef<number>(performance.now());
	const renderMs = useMemo(() => Math.round(performance.now() - mountTimeRef.current), [markings]);

	const totalMarkingsCount = useMemo(() => markings?.length ?? 0, [markings]);

	const debugLogs = useMemo(() => [
		`${translate(TranslationKeys.eating_habits_debug_markings_count)}: ${totalMarkingsCount}`,
		`Render time (useMemo): ${renderMs}ms`,
	], [totalMarkingsCount, renderMs, translate]);

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: theme.screen.background }}>
			<ScrollView
				style={{ backgroundColor: theme.screen.background }}
				contentContainerStyle={{ padding: 16 }}
			>
				<DebugView title="Plain: Text & Translations Only" logs={debugLogs} isVisible />
				<View>
					{(markings ?? []).map((marking: DatabaseTypes.Markings) => {
						const name = getTextFromTranslation(marking.translations, language);
						const description = getDescriptionFromTranslation(marking.translations, language);
						return (
							<View
								key={marking.id}
								style={{ marginBottom: 12, borderBottomWidth: 1, borderBottomColor: theme.screen.text + '22', paddingBottom: 8 }}
							>
								<Text style={{ color: theme.screen.text, fontWeight: 'bold', fontSize: 14 }}>
									{name || marking.alias || marking.id}
								</Text>
								{!!description && (
									<Text style={{ color: theme.screen.text, fontSize: 12, marginTop: 2, opacity: 0.7 }}>
										{description}
									</Text>
								)}
								<Text style={{ color: theme.screen.text, fontSize: 10, marginTop: 2, opacity: 0.4 }}>
									{`id: ${marking.id}`}
								</Text>
							</View>
						);
					})}
				</View>
			</ScrollView>
		</SafeAreaView>
	);
};

export default EatingHabitsPlainText;
