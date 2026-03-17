/**
 * Eating Habits Performance Variant: SettingsListFlash (FlashList instead of ScrollView)
 *
 * Uses FlashList (@shopify/flash-list) instead of FlatList/ScrollView for each
 * marking – functionally identical to the settings-list-fast variant (icon,
 * name, like/dislike with dispatch, no gluestack tooltips) but backed by
 * FlashList which uses a recycling strategy for improved native performance.
 *
 * Purpose: compare FlashList vs FlatList vs ScrollView render times.
 */
import { SafeAreaView } from 'react-native';
import React, { useCallback, useMemo, useRef } from 'react';
import { FlashList } from '@shopify/flash-list';
import { useTheme } from '@/hooks/useTheme';
import { useAppSelector } from '@/redux/hooks';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKeys } from '@/locales/keys';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import { DatabaseTypes } from 'repo-depkit-common';
import DebugView from '@/components/DebugView';
import SettingsListMarkingLabelFast from '@/components/SettingsListMarkingLabelFast';
import { SettingsListProps } from '@/components/SettingsList/types';

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------
const EatingHabitsSettingsListFlash = () => {
	useSetPageTitle(TranslationKeys.eating_habits_performance_settings_list_flash);
	const { theme } = useTheme();
	const { translate } = useLanguage();
	const { markings } = useAppSelector((state) => state.food);

	const mountTimeRef = useRef<number>(performance.now());
	const renderMs = useMemo(() => Math.round(performance.now() - mountTimeRef.current), [markings]);

	const totalMarkingsCount = useMemo(() => markings?.length ?? 0, [markings]);

	const debugLogs = useMemo(
		() => [
			`${translate(TranslationKeys.eating_habits_debug_markings_count)}: ${totalMarkingsCount}`,
			`Render time (useMemo): ${renderMs}ms`,
		],
		[totalMarkingsCount, renderMs, translate]
	);

	const markingIds = useMemo(() => (markings ?? []).map((m: DatabaseTypes.Markings) => m.id), [markings]);

	const renderItem = useCallback(({ item, index }: { item: string; index: number }) => {
		const total = markingIds.length;
		const groupPosition: SettingsListProps['groupPosition'] =
			total === 1 ? 'single' : index === 0 ? 'top' : index === total - 1 ? 'bottom' : 'middle';
		return <SettingsListMarkingLabelFast markingId={item} groupPosition={groupPosition} />;
	}, [markingIds.length]);

	const keyExtractor = useCallback((id: string) => id, []);

	const ListHeaderComponent = useMemo(
		() => <DebugView title="SettingsListFlash: Image, Name & Like/Dislike (FlashList)" logs={debugLogs} isVisible />,
		[debugLogs]
	);

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: theme.screen.background }}>
			<FlashList
				data={markingIds}
				renderItem={renderItem}
				keyExtractor={keyExtractor}
				ListHeaderComponent={ListHeaderComponent}
				estimatedItemSize={60}
				contentContainerStyle={{ padding: 16, backgroundColor: theme.screen.background }}
			/>
		</SafeAreaView>
	);
};

export default EatingHabitsSettingsListFlash;

