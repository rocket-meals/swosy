import React, { useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { FeedbackLabelProps } from './types';
import { isWeb } from '@/constants/Constants';
import { getIconComponent, getTextFromTranslation } from '@/helper/resourceHelper';
import { DatabaseTypes } from 'repo-depkit-common';
import { FoodFeedbackLabelEntryHelper } from '@/redux/actions/FoodFeeedbackLabelEntries/FoodFeedbackLabelEntries';
import { useDispatch } from 'react-redux';
import { useAppSelector } from '@/redux/hooks';
import useSelectedCanteen from '@/hooks/useSelectedCanteen';
import { DELETE_OWN_FOOD_FEEDBACK_LABEL_ENTRIES_LOCAL, UPDATE_OWN_FOOD_FEEDBACK_LABEL_ENTRIES_LOCAL } from '@/redux/Types/types';
import { myContrastColor } from '@/helper/ColorHelper';
import { Tooltip, TooltipContent, TooltipText } from '@gluestack-ui/themed';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKeys } from '@/locales/keys';
import useRatingPermissionModal from '@/hooks/useRatingPermissionModal';
import SettingsList from '@/components/SettingsList';

const FeedbackLabel: React.FC<FeedbackLabelProps> = ({ label, icon, imageUrl, labelEntries, foodId, offerId, groupPosition }) => {
	const { theme } = useTheme();
	const dispatch = useDispatch();
	const { translate } = useLanguage();
	const { primaryColor, language, appSettings, selectedTheme: mode } = useAppSelector((state) => state.settings);
	const [showTooltip, setShowTooltip] = useState(false);
	const { user, profile } = useAppSelector((state) => state.authReducer);
	const selectedCanteen = useSelectedCanteen();
	const { openRatingPermissionModal } = useRatingPermissionModal();
	const foodFeedbackLabelEntryHelper = new FoodFeedbackLabelEntryHelper();
	const foods_area_color = appSettings?.foods_area_color ? appSettings?.foods_area_color : primaryColor;
	const contrastColor = myContrastColor(foods_area_color, theme, mode === 'dark');

	// Use useMemo to optimize the filtering process
	const labelData = useMemo(() => {
		return labelEntries?.find((entry: DatabaseTypes.FoodsFeedbacksLabelsEntries) => entry.label === label[0]?.foods_feedbacks_labels_id && entry.food === foodId) || ({} as DatabaseTypes.FoodsFeedbacksLabelsEntries);
	}, [label, labelEntries]);

	// Function to handle updating the entry
	const handleUpdateEntry = async (isLike: boolean | null) => {
		if (!user?.id) {
			openRatingPermissionModal();
			return;
		}
		let likeStats = null;
		if (isLike === true && like === true) {
			likeStats = null;
		} else if (isLike === false && like === false) {
			likeStats = null;
		} else {
			likeStats = isLike;
		}
		// Update the entry
		const result = (await foodFeedbackLabelEntryHelper.updateFoodFeedbackLabelEntry(foodId, profile.id, labelEntries, String(label[0]?.foods_feedbacks_labels_id), likeStats, selectedCanteen?.id, offerId)) as DatabaseTypes.FoodsFeedbacksLabelsEntries;
		dispatch({
			type: result ? UPDATE_OWN_FOOD_FEEDBACK_LABEL_ENTRIES_LOCAL : DELETE_OWN_FOOD_FEEDBACK_LABEL_ENTRIES_LOCAL,
			payload: result ? result : labelData.id,
		});
	};

	const { like } = labelData;
	const labelText = getTextFromTranslation(label, language);
	const iconSize = isWeb ? 24 : 22;

	const leftIconComponent = (
		<View style={styles.leftIconWrapper}>
			<Tooltip
				placement="top"
				isOpen={showTooltip}
				trigger={triggerProps => (
					<Pressable {...triggerProps} onHoverIn={() => setShowTooltip(true)} onHoverOut={() => setShowTooltip(false)} style={{ cursor: 'default' } as any}>
						{imageUrl && <Image source={{ uri: imageUrl }} style={styles.icon} />}
						{icon && getIconComponent(icon, theme.screen.icon)}
					</Pressable>
				)}
			>
				<TooltipContent
					bg={theme.tooltip.background}
					py="$1"
					px="$2"
				>
					<TooltipText fontSize="$sm" color={theme.tooltip.text}>
						{labelText}
					</TooltipText>
				</TooltipContent>
			</Tooltip>
		</View>
	);

	const rightElement = (
		<View style={styles.rightRow}>
			<Tooltip
				placement="top"
				trigger={triggerProps => (
					<Pressable
						style={{
							...styles.likeButton,
							backgroundColor: like ? foods_area_color : undefined,
						}}
						{...triggerProps}
						onPress={() => handleUpdateEntry(true)}
						onHoverIn={() => setShowTooltip(true)}
						onHoverOut={() => setShowTooltip(false)}
					>
						<MaterialCommunityIcons name={like ? 'thumb-up' : 'thumb-up-outline'} size={iconSize} color={like ? contrastColor : theme.screen.icon} />
					</Pressable>
				)}
			>
				<TooltipContent bg={theme.tooltip.background} py="$1" px="$2">
					<TooltipText fontSize="$sm" color={theme.tooltip.text}>
						{`${translate(TranslationKeys.i_like_that)}: ${translate(like ? TranslationKeys.active : TranslationKeys.inactive)}: ${labelText}`}
					</TooltipText>
				</TooltipContent>
			</Tooltip>
			<Tooltip
				placement="top"
				trigger={triggerProps => (
					<Pressable
						style={{
							...styles.dislikeButton,
							backgroundColor: like === false ? foods_area_color : undefined,
						}}
						{...triggerProps}
						onHoverIn={() => setShowTooltip(true)}
						onHoverOut={() => setShowTooltip(false)}
						onPress={() => handleUpdateEntry(false)}
					>
						<MaterialCommunityIcons name={like === false ? 'thumb-down' : 'thumb-down-outline'} size={iconSize} color={like === false ? contrastColor : theme.screen.icon} />
					</Pressable>
				)}
			>
				<TooltipContent bg={theme.tooltip.background} py="$1" px="$2">
					<TooltipText fontSize="$sm" color={theme.tooltip.text}>
						{`${translate(TranslationKeys.i_dislike_that)}: ${translate(like === false ? TranslationKeys.active : TranslationKeys.inactive)}: ${labelText}`}
					</TooltipText>
				</TooltipContent>
			</Tooltip>
		</View>
	);

	return (
		<SettingsList
			leftIconComponent={leftIconComponent}
			title={labelText || ''}
			rightElement={rightElement}
			groupPosition={groupPosition}
		/>
	);
};

export default FeedbackLabel;

const styles = StyleSheet.create({
	leftIconWrapper: {
		marginRight: 10,
	},
	icon: {
		width: 30,
		height: 30,
		resizeMode: 'cover',
		borderRadius: 25,
	},
	rightRow: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	likeButton: {
		padding: 8,
		borderWidth: 1,
		borderTopLeftRadius: 5,
		borderBottomLeftRadius: 5,
		borderColor: '#2E2E2E',
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
	},
	dislikeButton: {
		padding: 8,
		borderWidth: 1,
		borderTopRightRadius: 5,
		borderBottomRightRadius: 5,
		borderColor: '#2E2E2E',
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
	},
});
