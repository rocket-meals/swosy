/**
 * Eating Habits Performance Variant: SettingsListFast (no gluestack tooltips)
 *
 * Uses SettingsListMarkingLabelFast for each marking – functionally identical
 * to the production eating-habits screen (icon, name, like/dislike with
 * dispatch) but without gluestack CustomTooltip wrappers which are the
 * suspected rendering bottleneck on web.
 *
 * Purpose: confirm whether removing tooltips resolves the render delay seen
 * in the "settings-list" variant.
 */
import { FlatList, SafeAreaView } from 'react-native';
import React, { useCallback, useMemo, useRef, useEffect } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { useAppSelector } from '@/redux/hooks';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKeys } from '@/locales/keys';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import { DatabaseTypes } from 'repo-depkit-common';
import DebugView from '@/components/DebugView';
import SettingsListMarkingLabelFast from '@/components/SettingsListMarkingLabelFast';
import { SettingsListProps } from '@/components/SettingsList/types';
import CustomStackHeader from '@/components/CustomStackHeader/CustomStackHeader';
import { useNavigation } from 'expo-router';

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------
const EatingHabitsSettingsListFast = () => {
	useSetPageTitle(TranslationKeys.eating_habits_performance_settings_list_fast);
	const { theme } = useTheme();
	const { translate } = useLanguage();
	const { markingsDict } = useAppSelector((state) => state.food);
	const markings = useMemo(() => Object.values(markingsDict || {}), [markingsDict]);

	const navigation = useNavigation();

	useEffect(() => {
		navigation.setOptions({
			header: () => <CustomStackHeader label={translate(TranslationKeys.eating_habits_performance_settings_list_fast)} />,
		});
	}, [navigation, translate]);

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

	const renderItem = useCallback(({ item, index }: { item: string; index: number }) => {
		const total = markingIds.length;
		const groupPosition: SettingsListProps['groupPosition'] =
			total === 1 ? 'single' : index === 0 ? 'top' : index === total - 1 ? 'bottom' : 'middle';
		return <SettingsListMarkingLabelFast markingId={item} groupPosition={groupPosition} />;
	}, [markingIds.length]);

	const keyExtractor = useCallback((id: string) => id, []);

	const ListHeaderComponent = useMemo(
		() => <DebugView title={translate(TranslationKeys.settingsListFastDebugTitle)} logs={debugLogs} isVisible />,
		[debugLogs, translate]
	);

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: theme.screen.background }}>
			<FlatList
				data={markingIds}
				renderItem={renderItem}
				keyExtractor={keyExtractor}
				ListHeaderComponent={ListHeaderComponent}
				contentContainerStyle={{ padding: 16, backgroundColor: theme.screen.background }}
				style={{ backgroundColor: theme.screen.background }}
			/>
		</SafeAreaView>
	);
};

export default EatingHabitsSettingsListFast;
