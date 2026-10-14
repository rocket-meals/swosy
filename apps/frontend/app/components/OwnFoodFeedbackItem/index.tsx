import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { DatabaseTypes, FoodFeedbackReactionHelper } from 'repo-depkit-common';
import SettingsList from '@/components/SettingsList';
import MyImage from '@/components/MyImage';
import { getFoodName } from '@/helper/resourceHelper';
import { useTheme } from '@/hooks/useTheme';
import { useAppSelector } from '@/redux/hooks';

/** Comments are cut to this length below the food name. */
const COMMENT_EXCERPT_LENGTH = 120;

export type OwnFoodFeedbackItemProps = {
	/** An own food feedback with `food` loaded (id, alias, image, image_remote_url, translations). */
	feedback: DatabaseTypes.FoodsFeedbacks;
	language: string;
	groupPosition?: 'top' | 'middle' | 'bottom' | 'single';
	onPress?: () => void;
	/** Shows the bell as a button to switch the notification on or off; without it, only an active bell is shown. */
	onToggleNotify?: () => void;
	toggleNotifyLabel?: string;
};

function excerptOf(text: string | null | undefined): string | undefined {
	const trimmed = text?.trim();
	if (!trimmed) {
		return undefined;
	}
	const cut = trimmed.length > COMMENT_EXCERPT_LENGTH ? `${trimmed.slice(0, COMMENT_EXCERPT_LENGTH).trimEnd()}…` : trimmed;
	return `„${cut}“`;
}

/**
 * One own food feedback as a row: picture and name of the food, the own comment below, and on the
 * right what belongs to it: the own rating, the reaction of the canteen and the notification bell.
 * Used by the screen of the own ratings and notifications and by the hint above the food offers.
 */
const OwnFoodFeedbackItem: React.FC<OwnFoodFeedbackItemProps> = ({ feedback, language, groupPosition = 'single', onPress, onToggleNotify, toggleNotifyLabel }) => {
	const { theme } = useTheme();
	const { primaryColor } = useAppSelector(state => state.settings);
	const food = typeof feedback.food === 'object' && feedback.food !== null ? (feedback.food as DatabaseTypes.Foods) : null;
	const imageUrl = food?.image_remote_url || undefined;
	const hasReaction = FoodFeedbackReactionHelper.hasReaction(feedback);

	const right = (
		<View style={styles.right}>
			{typeof feedback.rating === 'number' && (
				<View style={styles.rating}>
					<MaterialCommunityIcons name="star" size={16} color={primaryColor} />
					<Text style={[styles.ratingText, { color: theme.screen.text }]}>{feedback.rating}</Text>
				</View>
			)}
			{hasReaction && (
				<Text style={styles.reaction} accessibilityElementsHidden importantForAccessibility="no">
					{feedback.support_reaction}
				</Text>
			)}
			{onToggleNotify ? (
				<TouchableOpacity
					onPress={onToggleNotify}
					style={[styles.bell, feedback.notify ? { backgroundColor: primaryColor, borderColor: primaryColor } : { borderColor: primaryColor }]}
					accessibilityRole="switch"
					accessibilityState={{ checked: !!feedback.notify }}
					accessibilityLabel={toggleNotifyLabel}
					hitSlop={6}
				>
					<MaterialIcons name={feedback.notify ? 'notifications-active' : 'notifications-none'} size={20} color={feedback.notify ? theme.light : theme.screen.icon} />
				</TouchableOpacity>
			) : (
				feedback.notify && <MaterialIcons name="notifications-active" size={20} color={primaryColor} />
			)}
		</View>
	);

	return (
		<SettingsList
			leftIconComponent={
				<MyImage
					remote_image_url={imageUrl}
					directus_asset_id={!imageUrl && food?.image ? String(typeof food.image === 'object' ? (food.image as { id: string }).id : food.image) : undefined}
					style={styles.image}
					contentFit="cover"
				/>
			}
			title={getFoodName(food, language) ?? ''}
			titleNumberOfLines={2}
			value={excerptOf(feedback.comment)}
			stackedValue
			valueColor={theme.screen.placeholder}
			rightElement={right}
			onPress={onPress}
			groupPosition={groupPosition}
			showSeparator={groupPosition === 'top' || groupPosition === 'middle'}
		/>
	);
};

const styles = StyleSheet.create({
	image: {
		width: 44,
		height: 44,
		borderRadius: 8,
		marginRight: 10,
	},
	right: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
		marginLeft: 8,
	},
	rating: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 2,
	},
	ratingText: {
		fontSize: 14,
		fontWeight: '600',
	},
	reaction: {
		fontSize: 22,
	},
	bell: {
		borderWidth: 1,
		borderRadius: 16,
		padding: 6,
	},
});

export default OwnFoodFeedbackItem;
