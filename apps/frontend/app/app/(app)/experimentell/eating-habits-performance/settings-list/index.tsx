/**
 * Eating Habits Performance Variant: SettingsList with Image, Name & Like Status
 *
 * Uses the real SettingsList component for each marking, rendering only:
 *   - Left:   MarkingIcon (image)
 *   - Center: translated name
 *   - Right:  like status indicator (display only, no dispatch)
 *
 * Purpose: measure the render cost introduced by the SettingsList component
 * compared to the fully plain variants (plain-component-full etc.).
 */
import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import React, { useMemo, useRef } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { useAppSelector } from '@/redux/hooks';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKeys } from '@/locales/keys';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import { DatabaseTypes } from 'repo-depkit-common';
import { getTextFromTranslation } from '@/helper/resourceHelper';
import DebugView from '@/components/DebugView';
import SettingsList from '@/components/SettingsList';
import { SettingsListProps } from '@/components/SettingsList/types';
import MarkingIcon from '@/components/MarkingIcon';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// ---------------------------------------------------------------------------
// Per-marking component – reads its own like state from Redux
// ---------------------------------------------------------------------------
interface SettingsListMarkingRowProps {
	markingId: string;
	groupPosition?: SettingsListProps['groupPosition'];
}

const SettingsListMarkingRow: React.FC<SettingsListMarkingRowProps> = ({ markingId, groupPosition }) => {
	const { theme } = useTheme();
	const language = useAppSelector((state) => state.settings.language);
	const marking = useAppSelector((state) => (state.food.markingsDict as any)?.[String(markingId)]);
	const ownMarking = useAppSelector((state) =>
		state.authReducer.profile?.markings?.find((m: any) => m.markings_id === markingId)
	);

	if (!marking) return null;

	const name = getTextFromTranslation(marking.translations, language) || marking.alias || marking.id;

	const likeColor = ownMarking?.like === true ? '#4CAF50' : theme.screen.icon;
	const dislikeColor = ownMarking?.like === false ? '#F44336' : theme.screen.icon;

	const leftIconComponent = (
		<View style={styles.leftIconWrapper}>
			<MarkingIcon marking={marking} size={30} />
		</View>
	);

	const rightElement = (
		<View style={styles.likeRow}>
			<MaterialCommunityIcons
				name={ownMarking?.like === true ? 'thumb-up' : 'thumb-up-outline'}
				size={22}
				color={likeColor}
			/>
			<MaterialCommunityIcons
				name={ownMarking?.like === false ? 'thumb-down' : 'thumb-down-outline'}
				size={22}
				color={dislikeColor}
				style={styles.dislikeIcon}
			/>
		</View>
	);

	return (
		<SettingsList
			leftIconComponent={leftIconComponent}
			title={name}
			rightElement={rightElement}
			groupPosition={groupPosition}
		/>
	);
};

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------
const EatingHabitsSettingsList = () => {
	useSetPageTitle(TranslationKeys.eating_habits_performance_settings_list);
	const { theme } = useTheme();
	const { translate } = useLanguage();
	const { markingsDict } = useAppSelector((state) => state.food);
	const markings = useMemo(() => Object.values(markingsDict || {}), [markingsDict]);

	const mountTimeRef = useRef<number>(performance.now());
	const renderMs = useMemo(() => Math.round(performance.now() - mountTimeRef.current), [markingsDict]);

	const totalMarkingsCount = useMemo(() => markings?.length ?? 0, [markings]);

	const debugLogs = useMemo(
		() => [
			`${translate(TranslationKeys.eating_habits_debug_markings_count)}: ${totalMarkingsCount}`,
			`Render time (useMemo): ${renderMs}ms`,
		],
		[totalMarkingsCount, renderMs, translate]
	);

	const markingIds = useMemo(() => (markings ?? []).map((m: DatabaseTypes.Markings) => m.id), [markings]);

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: theme.screen.background }}>
			<ScrollView
				style={{ backgroundColor: theme.screen.background }}
				contentContainerStyle={{ padding: 16 }}
			>
				<DebugView title="SettingsList: Image, Name & Like Status" logs={debugLogs} isVisible />
				<View>
					{markingIds.map((id: string, index: number) => {
						const total = markingIds.length;
						const groupPosition: SettingsListProps['groupPosition'] =
							total === 1 ? 'single' : index === 0 ? 'top' : index === total - 1 ? 'bottom' : 'middle';
						return (
							<SettingsListMarkingRow key={id} markingId={id} groupPosition={groupPosition} />
						);
					})}
				</View>
			</ScrollView>
		</SafeAreaView>
	);
};

export default EatingHabitsSettingsList;

const styles = StyleSheet.create({
	leftIconWrapper: {
		marginRight: 10,
	},
	likeRow: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	dislikeIcon: {
		marginLeft: 8,
	},
});
