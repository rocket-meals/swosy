import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useSettingsContext } from '../../context/SettingsContext';
import { myContrastColor } from '../../helpers/ColorHelper';
import { borderRadiusContainer, horizontalScreenPadding } from '../../constants/ui';
import { lightTheme } from '../../themes';
import type { Theme } from '../../themes';
import SettingsList from '../SettingsList';
import SettingsListLikeButton from '../SettingsListLikeButton';
import { useMyScrollViewModal } from '../GlobalModal/useMyScrollViewModal';

export interface FeatureWishItem {
	id: string;
	title: string;
	description: string;
	likeCount: number;
	approved: boolean;
	liked?: boolean;
}

export interface FeatureWishesScreenTexts {
	introText?: string;
	filterPendingLabel?: string;
	filterAllLabel?: string;
	approveLabel?: string;
	approvedLabel?: string;
	closeLabel?: string;
}

export interface FeatureWishesScreenProps {
	isAdmin?: boolean;
	primaryColor?: string;
	texts?: FeatureWishesScreenTexts;
}

const DEFAULT_ITEMS: FeatureWishItem[] = [
	{
		id: '1',
		title: 'Dark Mode',
		description: 'Add a dark mode for the entire app to reduce eye strain and save battery life.',
		likeCount: 42,
		approved: true,
	},
	{
		id: '2',
		title: 'Weekly Plan Widget',
		description: 'Show the weekly meal plan as a home screen widget so users can see what is available at a glance.',
		likeCount: 31,
		approved: true,
	},
	{
		id: '3',
		title: 'Calorie Counter',
		description: 'Add a feature to track daily calorie intake based on the meals consumed in the canteen.',
		likeCount: 28,
		approved: false,
	},
	{
		id: '4',
		title: 'Favorites List',
		description: 'Allow users to mark dishes as favorites and create a personal list of favorite meals.',
		likeCount: 19,
		approved: false,
	},
	{
		id: '5',
		title: 'Push Notifications for Favorite Meals',
		description: 'Receive notifications when a specific favorite dish is available on the menu.',
		likeCount: 15,
		approved: true,
	},
];

const FeatureWishesScreen: React.FC<FeatureWishesScreenProps> = ({
	isAdmin = false,
	primaryColor,
	texts,
}) => {
	const { theme, isDark } = useTheme();
	const settingsCtx = useSettingsContext();
	const resolvedPrimaryColor = primaryColor ?? settingsCtx?.primaryColor ?? lightTheme.primary;
	const contrastColor = myContrastColor(resolvedPrimaryColor, theme, isDark);

	const [items, setItems] = useState<FeatureWishItem[]>(DEFAULT_ITEMS);
	const [showPendingOnly, setShowPendingOnly] = useState(false);

	const { show, close } = useMyScrollViewModal();

	const introText =
		texts?.introText ??
		'Here you can wish for features. Like suggestions you find good!';
	const filterPendingLabel = texts?.filterPendingLabel ?? 'Neue Anfragen';
	const filterAllLabel = texts?.filterAllLabel ?? 'Alle';
	const approveLabel = texts?.approveLabel ?? 'Genehmigen';
	const approvedLabel = texts?.approvedLabel ?? 'Genehmigt';

	const visibleItems = useMemo(() => {
		const filtered = isAdmin && showPendingOnly ? items.filter((i) => !i.approved) : items;
		return [...filtered].sort((a, b) => b.likeCount - a.likeCount);
	}, [items, isAdmin, showPendingOnly]);

	const handleLike = useCallback(
		(id: string) => {
			setItems((prev) =>
				prev.map((item) => {
					if (item.id !== id) return item;
					const nowLiked = !item.liked;
					return {
						...item,
						liked: nowLiked,
						likeCount: item.likeCount + (nowLiked ? 1 : -1),
					};
				})
			);
		},
		[]
	);

	const handleApprove = useCallback(
		(id: string) => {
			setItems((prev) =>
				prev.map((item) => (item.id === id ? { ...item, approved: true } : item))
			);
			close();
		},
		[close]
	);

	const openDetail = useCallback(
		(item: FeatureWishItem) => {
			show({
				title: item.title,
				children: (
					<DetailContent
						item={item}
						isAdmin={isAdmin}
						approveLabel={approveLabel}
						approvedLabel={approvedLabel}
						primaryColor={resolvedPrimaryColor}
						onApprove={() => handleApprove(item.id)}
						theme={theme}
					/>
				),
			});
		},
		[show, close, isAdmin, approveLabel, approvedLabel, resolvedPrimaryColor, handleApprove, theme]
	);

	const renderItem = useCallback(
		({ item, index }: { item: FeatureWishItem; index: number }) => {
			const total = visibleItems.length;
			const groupPosition =
				total === 1 ? 'single' : index === 0 ? 'top' : index === total - 1 ? 'bottom' : 'middle';

			return (
				<SettingsList
					key={item.id}
					title={item.title}
					iconBgColor={resolvedPrimaryColor}
					leftIcon={
						<MaterialCommunityIcons name="lightbulb-outline" size={22} color={contrastColor} />
					}
					rightElement={
						<SettingsListLikeButton
							liked={item.liked}
							likeCount={item.likeCount}
							onPressLike={() => handleLike(item.id)}
							primaryColor={resolvedPrimaryColor}
						/>
					}
					groupPosition={groupPosition}
					showSeparator={groupPosition !== 'bottom' && groupPosition !== 'single'}
					onPress={() => openDetail(item)}
				/>
			);
		},
		[visibleItems.length, resolvedPrimaryColor, contrastColor, handleLike, openDetail]
	);

	const keyExtractor = useCallback((item: FeatureWishItem) => item.id, []);

	const filterButtonStyle = (active: boolean) => [
		styles.filterButton,
		{
			backgroundColor: active ? resolvedPrimaryColor : theme.screen.iconBg,
			borderColor: resolvedPrimaryColor,
		},
	];

	const filterTextStyle = (active: boolean) => ({
		color: active ? myContrastColor(resolvedPrimaryColor, theme, isDark) : theme.screen.text,
		fontSize: 13,
		fontWeight: '600' as const,
	});

	return (
		<View style={[styles.container, { backgroundColor: theme.screen.background }]}>
			<View style={styles.header}>
				<Text style={[styles.introText, { color: theme.screen.text }]}>{introText}</Text>
				{isAdmin && (
					<View style={styles.filterRow}>
						<Pressable
							style={filterButtonStyle(!showPendingOnly)}
							onPress={() => setShowPendingOnly(false)}
						>
							<Text style={filterTextStyle(!showPendingOnly)}>{filterAllLabel}</Text>
						</Pressable>
						<Pressable
							style={filterButtonStyle(showPendingOnly)}
							onPress={() => setShowPendingOnly(true)}
						>
							<Text style={filterTextStyle(showPendingOnly)}>{filterPendingLabel}</Text>
						</Pressable>
					</View>
				)}
			</View>
			<FlatList
				data={visibleItems}
				renderItem={renderItem}
				keyExtractor={keyExtractor}
				contentContainerStyle={styles.listContent}
				showsVerticalScrollIndicator={false}
			/>
		</View>
	);
};

interface DetailContentProps {
	item: FeatureWishItem;
	isAdmin: boolean;
	approveLabel: string;
	approvedLabel: string;
	primaryColor: string;
	onApprove: () => void;
	theme: Theme;
}

const DetailContent: React.FC<DetailContentProps> = ({
	item,
	isAdmin,
	approveLabel,
	approvedLabel,
	primaryColor,
	onApprove,
	theme,
}) => {
	const { isDark } = useTheme();
	const contrastOnPrimary = myContrastColor(primaryColor, theme, isDark);

	return (
		<View style={detailStyles.container}>
			<Text style={[detailStyles.description, { color: theme.screen.text }]}>
				{item.description}
			</Text>
			{isAdmin && !item.approved && (
				<Pressable
					style={[detailStyles.approveButton, { backgroundColor: primaryColor }]}
					onPress={onApprove}
				>
					<MaterialCommunityIcons name="check-circle-outline" size={20} color={contrastOnPrimary} />
					<Text style={[detailStyles.approveButtonText, { color: contrastOnPrimary }]}>
						{approveLabel}
					</Text>
				</Pressable>
			)}
			{isAdmin && item.approved && (
				<View style={[detailStyles.approvedBadge, { borderColor: primaryColor }]}>
					<MaterialCommunityIcons name="check-circle" size={16} color={primaryColor} />
					<Text style={[detailStyles.approvedText, { color: primaryColor }]}>
						{approvedLabel}
					</Text>
				</View>
			)}
		</View>
	);
};

export default FeatureWishesScreen;

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	header: {
		paddingHorizontal: horizontalScreenPadding,
		paddingVertical: 12,
		gap: 10,
	},
	introText: {
		fontSize: 14,
		lineHeight: 20,
	},
	filterRow: {
		flexDirection: 'row',
		gap: 8,
	},
	filterButton: {
		paddingHorizontal: 14,
		paddingVertical: 6,
		borderRadius: borderRadiusContainer,
		borderWidth: 1,
	},
	listContent: {
		paddingBottom: 24,
	},
});

const detailStyles = StyleSheet.create({
	container: {
		paddingHorizontal: horizontalScreenPadding,
		paddingTop: 8,
		paddingBottom: 20,
		gap: 16,
	},
	description: {
		fontSize: 15,
		lineHeight: 22,
	},
	approveButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 12,
		paddingHorizontal: 20,
		borderRadius: borderRadiusContainer,
		gap: 8,
	},
	approveButtonText: {
		fontSize: 15,
		fontWeight: '600',
	},
	approvedBadge: {
		flexDirection: 'row',
		alignItems: 'center',
		alignSelf: 'flex-start',
		paddingVertical: 6,
		paddingHorizontal: 12,
		borderRadius: borderRadiusContainer,
		borderWidth: 1,
		gap: 6,
	},
	approvedText: {
		fontSize: 13,
		fontWeight: '600',
	},
});
