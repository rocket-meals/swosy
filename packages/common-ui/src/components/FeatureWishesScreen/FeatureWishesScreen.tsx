import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DatabaseTypes } from 'repo-depkit-common';
import { useTheme } from '../../context/ThemeContext';
import { useSettingsContext } from '../../context/SettingsContext';
import { myContrastColor } from '../../helpers/ColorHelper';
import { borderRadiusContainer, horizontalScreenPadding } from '../../constants/ui';
import { lightTheme } from '../../themes';
import type { Theme } from '../../themes';
import SettingsList from '../SettingsList';
import SettingsListLikeButton from '../SettingsListLikeButton';
import { useMyScrollViewModal } from '../GlobalModal/useMyScrollViewModal';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKeys } from '@/locales/keys';

export type FeatureWishItem = Partial<DatabaseTypes.FeatureWhishes>;

export interface FeatureWishesScreenTexts {
	introText?: string;
	filterPublishedLabel?: string;
	filterDraftLabel?: string;
	approveLabel?: string;
	approvedLabel?: string;
	searchPlaceholder?: string;
	createButtonLabel?: string;
	createModalDescriptionPlaceholder?: string;
	createModalConfirmLabel?: string;
	pendingReviewTitle?: string;
	pendingReviewMessage?: string;
	closeLabel?: string;
}

export interface FeatureWishesScreenProps {
	isAdmin?: boolean;
	primaryColor?: string;
	isArabic?: boolean;
	texts?: FeatureWishesScreenTexts;
}

const STATUS_PUBLISHED = 'published';
const STATUS_DRAFT = 'draft';

const getDefaultItems = (translate: (key: TranslationKeys) => string): FeatureWishItem[] => [
	{
		id: '1',
		title: translate(TranslationKeys.featureWishSampleDarkModeTitle),
		description: translate(TranslationKeys.featureWishSampleDarkModeDescription),
		likes: 42,
		status: STATUS_PUBLISHED,
	},
	{
		id: '2',
		title: translate(TranslationKeys.featureWishSampleWeeklyPlanWidgetTitle),
		description: translate(TranslationKeys.featureWishSampleWeeklyPlanWidgetDescription),
		likes: 31,
		status: STATUS_PUBLISHED,
	},
	{
		id: '3',
		title: translate(TranslationKeys.featureWishSampleCalorieCounterTitle),
		description: translate(TranslationKeys.featureWishSampleCalorieCounterDescription),
		likes: 28,
		status: STATUS_DRAFT,
	},
	{
		id: '4',
		title: translate(TranslationKeys.featureWishSampleFavoritesListTitle),
		description: translate(TranslationKeys.featureWishSampleFavoritesListDescription),
		likes: 19,
		status: STATUS_DRAFT,
	},
	{
		id: '5',
		title: translate(TranslationKeys.featureWishSamplePushNotificationsTitle),
		description: translate(TranslationKeys.featureWishSamplePushNotificationsDescription),
		likes: 15,
		status: STATUS_PUBLISHED,
	},
];

const FeatureWishesScreen: React.FC<FeatureWishesScreenProps> = ({
	isAdmin = false,
	primaryColor,
	isArabic = false,
	texts,
}) => {
	const { theme, isDark } = useTheme();
	const { translate } = useLanguage();
	const settingsCtx = useSettingsContext();
	const resolvedPrimaryColor = primaryColor ?? settingsCtx?.primaryColor ?? lightTheme.primary;
	const contrastColor = myContrastColor(resolvedPrimaryColor, theme, isDark);

	const [items, setItems] = useState<FeatureWishItem[]>(() => getDefaultItems(translate));
	const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
	const [activeFilter, setActiveFilter] = useState<string>(STATUS_PUBLISHED);
	const [searchText, setSearchText] = useState('');

	const { show, showAndDiscardOthers } = useMyScrollViewModal();

	const introText = texts?.introText ?? translate(TranslationKeys.feature_wishes_intro);
	const filterPublishedLabel =
		texts?.filterPublishedLabel ?? translate(TranslationKeys.feature_wishes_filter_published);
	const filterDraftLabel =
		texts?.filterDraftLabel ?? translate(TranslationKeys.feature_wishes_filter_draft);
	const approveLabel = texts?.approveLabel ?? translate(TranslationKeys.feature_wishes_approve);
	const approvedLabel = texts?.approvedLabel ?? translate(TranslationKeys.feature_wishes_approved);
	const searchPlaceholder =
		texts?.searchPlaceholder ?? translate(TranslationKeys.feature_wishes_search_placeholder);
	const createButtonLabel =
		texts?.createButtonLabel ?? translate(TranslationKeys.feature_wishes_create_button);
	const createModalDescriptionPlaceholder =
		texts?.createModalDescriptionPlaceholder ??
		translate(TranslationKeys.feature_wishes_create_description_placeholder);
	const createModalConfirmLabel =
		texts?.createModalConfirmLabel ?? translate(TranslationKeys.feature_wishes_create_confirm);
	const pendingReviewTitle =
		texts?.pendingReviewTitle ?? translate(TranslationKeys.feature_wishes_pending_review_title);
	const pendingReviewMessage =
		texts?.pendingReviewMessage ?? translate(TranslationKeys.feature_wishes_pending_review_message);

	const visibleItems = useMemo(() => {
		let filtered = items.filter((i) => i.status === activeFilter);
		const query = searchText.trim().toLowerCase();
		if (query) {
			filtered = filtered.filter(
				(i) =>
					i.title?.toLowerCase().includes(query) ||
					i.description?.toLowerCase().includes(query)
			);
		}
		return [...filtered].sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0));
	}, [items, activeFilter, searchText]);

	const handleLike = useCallback((id: string) => {
		setLikedIds((prev) => {
			const wasLiked = prev.has(id);
			const next = new Set(prev);
			if (wasLiked) {
				next.delete(id);
			} else {
				next.add(id);
			}
			setItems((prevItems) =>
				prevItems.map((item) => {
					if (item.id !== id) return item;
					return { ...item, likes: (item.likes ?? 0) + (wasLiked ? -1 : 1) };
				})
			);
			return next;
		});
	}, []);

	const handleApprove = useCallback(
		(id: string) => {
			setItems((prev) =>
				prev.map((item) => (item.id === id ? { ...item, status: STATUS_PUBLISHED } : item))
			);
			showAndDiscardOthers({
				title: approvedLabel,
				children: (
					<PendingReviewContent
						message={approveLabel + ' ✓'}
						theme={theme}
					/>
				),
			});
		},
		[showAndDiscardOthers, approveLabel, approvedLabel, theme]
	);

	const handleCreate = useCallback(
		(title: string, description: string) => {
			const newItem: FeatureWishItem = {
				id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
				title,
				description,
				likes: 0,
				status: STATUS_DRAFT,
				date_created: new Date().toISOString(),
			};
			setItems((prev) => [newItem, ...prev]);
			setSearchText('');
			showAndDiscardOthers({
				title: pendingReviewTitle,
				children: (
					<PendingReviewContent
						message={pendingReviewMessage}
						theme={theme}
					/>
				),
			});
		},
		[showAndDiscardOthers, pendingReviewTitle, pendingReviewMessage, theme]
	);

	const openDetail = useCallback(
		(item: FeatureWishItem) => {
			show({
				title: item.title ?? '',
				children: (
					<DetailContent
						item={item}
						isAdmin={isAdmin}
						approveLabel={approveLabel}
						approvedLabel={approvedLabel}
						primaryColor={resolvedPrimaryColor}
						onApprove={() => handleApprove(item.id ?? '')}
						theme={theme}
					/>
				),
			});
		},
		[show, isAdmin, approveLabel, approvedLabel, resolvedPrimaryColor, handleApprove, theme]
	);

	const showCreateModal = useCallback(() => {
		const title = searchText.trim();
		if (!title) return;
		show({
			title,
			children: (
				<CreateWishContent
					descriptionPlaceholder={createModalDescriptionPlaceholder}
					createConfirmLabel={createModalConfirmLabel}
					primaryColor={resolvedPrimaryColor}
					contrastColor={contrastColor}
					theme={theme}
					onConfirm={(description) => handleCreate(title, description)}
				/>
			),
		});
	}, [
		show,
		searchText,
		createModalDescriptionPlaceholder,
		createModalConfirmLabel,
		resolvedPrimaryColor,
		contrastColor,
		theme,
		handleCreate,
	]);

	const renderItem = useCallback(
		({ item, index }: { item: FeatureWishItem; index: number }) => {
			const total = visibleItems.length;
			const groupPosition =
				total === 1 ? 'single' : index === 0 ? 'top' : index === total - 1 ? 'bottom' : 'middle';
			const isLiked = likedIds.has(item.id ?? '');

			return (
				<SettingsList
					key={item.id}
					title={item.title ?? ''}
					iconBgColor={resolvedPrimaryColor}
					leftIcon={
						<MaterialCommunityIcons name="lightbulb-outline" size={22} color={contrastColor} />
					}
					rightElement={
						<SettingsListLikeButton
							liked={isLiked}
							likeCount={item.likes ?? 0}
							onPressLike={() => handleLike(item.id ?? '')}
							primaryColor={resolvedPrimaryColor}
							isArabic={isArabic}
						/>
					}
					groupPosition={groupPosition}
					showSeparator={groupPosition !== 'bottom' && groupPosition !== 'single'}
					onPress={() => openDetail(item)}
					reverseLayout={isArabic}
					titleTextAlign={isArabic ? 'right' : 'left'}
				/>
			);
		},
		[visibleItems.length, resolvedPrimaryColor, contrastColor, likedIds, handleLike, openDetail, isArabic]
	);

	const keyExtractor = useCallback((item: FeatureWishItem) => item.id ?? '', []);

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

	const showCreateButton = searchText.trim().length > 0;

	return (
		<View style={[styles.container, { backgroundColor: theme.screen.background }]}>
			<View style={styles.header}>
				<Text style={[styles.introText, { color: theme.screen.text, textAlign: isArabic ? 'right' : 'left' }]}>{introText}</Text>
				<View
					style={[
						styles.searchInputContainer,
						{ backgroundColor: theme.screen.iconBg, flexDirection: isArabic ? 'row-reverse' : 'row' },
					]}
				>
					<MaterialCommunityIcons
						name="magnify"
						size={20}
						color={theme.screen.icon}
						style={isArabic ? { marginLeft: 6 } : styles.searchIcon}
					/>
					<TextInput
						style={[styles.searchInput, { color: theme.screen.text, textAlign: isArabic ? 'right' : 'left' }]}
						value={searchText}
						onChangeText={setSearchText}
						placeholder={searchPlaceholder}
						placeholderTextColor={theme.screen.placeholder}
						returnKeyType="search"
					/>
					{showCreateButton && (
						<Pressable onPress={() => setSearchText('')} style={isArabic ? { paddingRight: 6 } : styles.clearButton}>
							<MaterialCommunityIcons name="close-circle" size={18} color={theme.screen.icon} />
						</Pressable>
					)}
				</View>
				{showCreateButton && (
					<Pressable
						style={[styles.createButton, { backgroundColor: resolvedPrimaryColor, flexDirection: isArabic ? 'row-reverse' : 'row' }]}
						onPress={showCreateModal}
					>
						<MaterialCommunityIcons name="plus-circle-outline" size={18} color={contrastColor} />
						<Text style={[styles.createButtonText, { color: contrastColor }]}>
							{createButtonLabel}
						</Text>
					</Pressable>
				)}
				<View style={[styles.filterRow, isArabic ? { flexDirection: 'row-reverse' } : null]}>
					<Pressable
						style={filterButtonStyle(activeFilter === STATUS_PUBLISHED)}
						onPress={() => setActiveFilter(STATUS_PUBLISHED)}
					>
						<Text style={filterTextStyle(activeFilter === STATUS_PUBLISHED)}>
							{filterPublishedLabel}
						</Text>
					</Pressable>
					<Pressable
						style={filterButtonStyle(activeFilter === STATUS_DRAFT)}
						onPress={() => setActiveFilter(STATUS_DRAFT)}
					>
						<Text style={filterTextStyle(activeFilter === STATUS_DRAFT)}>
							{filterDraftLabel}
						</Text>
					</Pressable>
				</View>
			</View>
			<FlatList
				data={visibleItems}
				renderItem={renderItem}
				keyExtractor={keyExtractor}
				contentContainerStyle={styles.listContent}
				showsVerticalScrollIndicator={false}
				keyboardShouldPersistTaps="handled"
			/>
		</View>
	);
};

interface CreateWishContentProps {
	descriptionPlaceholder: string;
	createConfirmLabel: string;
	primaryColor: string;
	contrastColor: string;
	theme: Theme;
	onConfirm: (description: string) => void;
}

const CreateWishContent: React.FC<CreateWishContentProps> = ({
	descriptionPlaceholder,
	createConfirmLabel,
	primaryColor,
	contrastColor,
	theme,
	onConfirm,
}) => {
	const [description, setDescription] = useState('');
	const isDisabled = description.trim().length === 0;

	return (
		<View style={createStyles.container}>
			<TextInput
				style={[
					createStyles.descriptionInput,
					{
						color: theme.screen.text,
						backgroundColor: theme.screen.iconBg,
						borderColor: theme.screen.iconBg,
					},
				]}
				value={description}
				onChangeText={setDescription}
				placeholder={descriptionPlaceholder}
				placeholderTextColor={theme.screen.placeholder}
				multiline
				numberOfLines={4}
				textAlignVertical="top"
			/>
			<Pressable
				style={[
					createStyles.confirmButton,
					{ backgroundColor: isDisabled ? theme.screen.iconBg : primaryColor },
				]}
				onPress={() => !isDisabled && onConfirm(description)}
				disabled={isDisabled}
			>
				<Text
					style={[
						createStyles.confirmButtonText,
						{ color: isDisabled ? theme.screen.placeholder : contrastColor },
					]}
				>
					{createConfirmLabel}
				</Text>
			</Pressable>
		</View>
	);
};

interface PendingReviewContentProps {
	message: string;
	theme: Theme;
}

const PendingReviewContent: React.FC<PendingReviewContentProps> = ({ message, theme }) => (
	<View style={reviewStyles.container}>
		<MaterialCommunityIcons name="clock-check-outline" size={48} color={theme.screen.text} />
		<Text style={[reviewStyles.message, { color: theme.screen.text }]}>{message}</Text>
	</View>
);

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
	const {language} = useLanguage();
	const contrastOnPrimary = myContrastColor(primaryColor, theme, isDark);
	const isDraft = item.status === STATUS_DRAFT;

	return (
		<View style={detailStyles.container}>
			<Text style={[detailStyles.description, { color: theme.screen.text }]}>
				{item.description}
			</Text>
			{isAdmin && isDraft && (
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
			{isAdmin && !isDraft && (
				<View
					style={[
						detailStyles.approvedBadge,
						{
							borderColor: primaryColor,
							alignSelf: language === 'ar' ? 'flex-end' : 'flex-start',
						},
					]}
				>
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
	searchInputContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		borderRadius: borderRadiusContainer,
		paddingHorizontal: 10,
		minHeight: 44,
	},
	searchIcon: {
		marginRight: 6,
	},
	searchInput: {
		flex: 1,
		fontSize: 15,
		paddingVertical: 8,
	},
	clearButton: {
		paddingLeft: 6,
	},
	createButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 11,
		paddingHorizontal: 16,
		borderRadius: borderRadiusContainer,
		gap: 8,
	},
	createButtonText: {
		fontSize: 14,
		fontWeight: '600',
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

const createStyles = StyleSheet.create({
	container: {
		paddingHorizontal: horizontalScreenPadding,
		paddingTop: 8,
		paddingBottom: 20,
		gap: 16,
	},
	descriptionInput: {
		borderRadius: borderRadiusContainer,
		borderWidth: 1,
		padding: 12,
		fontSize: 15,
		minHeight: 100,
	},
	confirmButton: {
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 13,
		paddingHorizontal: 20,
		borderRadius: borderRadiusContainer,
	},
	confirmButtonText: {
		fontSize: 15,
		fontWeight: '600',
	},
});

const reviewStyles = StyleSheet.create({
	container: {
		paddingHorizontal: horizontalScreenPadding,
		paddingTop: 16,
		paddingBottom: 28,
		alignItems: 'center',
		gap: 16,
	},
	message: {
		fontSize: 15,
		lineHeight: 22,
		textAlign: 'center',
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
