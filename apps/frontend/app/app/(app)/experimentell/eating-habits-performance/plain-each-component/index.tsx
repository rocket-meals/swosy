/**
 * Eating Habits Performance Variant: Plain – Each Marking as Own Component
 *
 * Same content as plain-text (translated name + description) but each marking
 * is rendered by its own plain React component instead of being inlined in the
 * parent map(). The component itself is minimal – no Redux, no hooks – it only
 * receives plain props.
 *
 * Purpose: measure whether splitting into individual components (and the extra
 * React reconciler work that comes with it) has a measurable rendering cost
 * compared to the flat plain-text variant.
 */
import { SafeAreaView, ScrollView, Text, View } from 'react-native';
import React, { useEffect, useMemo, useRef } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { useAppSelector } from '@/redux/hooks';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKeys } from '@/locales/keys';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import { DatabaseTypes } from 'repo-depkit-common';
import { getTextFromTranslation, getDescriptionFromTranslation } from '@/helper/resourceHelper';
import DebugView from '@/components/DebugView';
import { PlainMarkingBaseProps } from '..';
import { useNavigation } from 'expo-router';
import CustomStackHeader from '@/components/CustomStackHeader/CustomStackHeader';
import useIsLtrLanguage from '@/hooks/useIsLtrLanguage';

// ---------------------------------------------------------------------------
// Minimal plain component – receives resolved strings, no hooks/Redux inside
// ---------------------------------------------------------------------------
type PlainMarkingRowProps = PlainMarkingBaseProps;

const PlainMarkingRow: React.FC<PlainMarkingRowProps & { isArabic: boolean }> = ({ id, name, description, borderColor, textColor, isArabic }) => (
	<View
		style={{
			marginBottom: 12,
			borderBottomWidth: 1,
			borderBottomColor: borderColor,
			paddingBottom: 8,
		}}
	>
		<Text
			style={{
				color: textColor,
				fontWeight: 'bold',
				fontSize: 14,
				...(isArabic ? { textAlign: 'right', writingDirection: 'rtl', alignSelf: 'flex-end' } : {}),
			}}
		>
			{name}
		</Text>
		{!!description && (
			<Text
				style={{
					color: textColor,
					fontSize: 12,
					marginTop: 2,
					opacity: 0.7,
					...(isArabic ? { textAlign: 'right', writingDirection: 'rtl', alignSelf: 'flex-end' } : {}),
				}}
			>
				{description}
			</Text>
		)}
		<Text
			style={{
				color: textColor,
				fontSize: 10,
				marginTop: 2,
				opacity: 0.4,
				...(isArabic ? { textAlign: 'right', writingDirection: 'ltr', alignSelf: 'flex-end' } : {}),
			}}
		>
			{`id: ${id}`}
		</Text>
	</View>
);

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------
const EatingHabitsPlainEachComponent = () => {
	useSetPageTitle(TranslationKeys.eating_habits_performance_plain_each_component);
	const { theme } = useTheme();
	const { translate, language } = useLanguage();
	const { markingsDict } = useAppSelector((state) => state.food);
	const markings = useMemo(() => Object.values(markingsDict || {}), [markingsDict]);
	const isLtrLanguage = useIsLtrLanguage();
	const isArabic = !isLtrLanguage;
	const navigation = useNavigation();

	useEffect(() => {
		navigation.setOptions({
			header: () => <CustomStackHeader label={translate(TranslationKeys.eating_habits_performance_plain_each_component)} />,
		});
	}, [navigation, translate]);

	const mountTimeRef = useRef<number>(performance.now());
	const renderMs = useMemo(() => Math.round(performance.now() - mountTimeRef.current), [markingsDict]);

	const totalMarkingsCount = useMemo(() => markings?.length ?? 0, [markings]);

	const debugLogs = useMemo(() => [
		`${translate(TranslationKeys.eating_habits_debug_markings_count)}: ${totalMarkingsCount}`,
		`Render time (useMemo): ${renderMs}ms`,
	], [totalMarkingsCount, renderMs, translate]);

	const borderColor = theme.screen.text + '22';
	const textColor = theme.screen.text;

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: theme.screen.background }}>
			<ScrollView
				style={{ backgroundColor: theme.screen.background }}
				contentContainerStyle={{ padding: 16 }}
			>
				<DebugView title={translate(TranslationKeys.plainEachMarkingAsOwnComponentDebugTitle)} logs={debugLogs} isVisible />
				<View>
					{(markings ?? []).map((marking: DatabaseTypes.Markings) => {
						const name = getTextFromTranslation(marking.translations, language) || marking.alias || marking.id;
						const description = getDescriptionFromTranslation(marking.translations, language);
						return (
							<PlainMarkingRow
								key={marking.id}
								id={marking.id}
								name={name}
								description={description}
								borderColor={borderColor}
								textColor={textColor}
								isArabic={isArabic}
							/>
						);
					})}
				</View>
			</ScrollView>
		</SafeAreaView>
	);
};

export default EatingHabitsPlainEachComponent;
