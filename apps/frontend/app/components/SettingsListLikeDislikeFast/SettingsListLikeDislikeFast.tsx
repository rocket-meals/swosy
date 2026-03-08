import React, { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useAppSelector } from '@/redux/hooks';
import { myContrastColor } from '@/helper/ColorHelper';
import { isWeb } from '@/constants/Constants';
import { SettingsListLikeDislikeProps } from '@/components/SettingsListLikeDislike/types';

/**
 * SettingsListLikeDislikeFast – tooltip-free variant of SettingsListLikeDislike.
 *
 * Identical in functionality but omits the gluestack CustomTooltip wrappers
 * which are a known rendering bottleneck on web.
 */
const SettingsListLikeDislikeFast: React.FC<SettingsListLikeDislikeProps> = ({
	like,
	onPressLike,
	onPressDislike,
	likeLoading = false,
	dislikeLoading = false,
	likeCount,
	dislikeCount,
}) => {
	const { theme } = useTheme();
	const { primaryColor, appSettings, selectedTheme: mode } = useAppSelector((state) => state.settings);
	const foods_area_color = appSettings?.foods_area_color ? appSettings?.foods_area_color : primaryColor;
	const contrastColor = myContrastColor(foods_area_color, theme, mode === 'dark');
	const iconSize = isWeb ? 24 : 22;

	const likeButtonStyle = useMemo(
		() => [styles.likeButton, like ? { backgroundColor: foods_area_color } : undefined],
		[like, foods_area_color]
	);

	const dislikeButtonStyle = useMemo(
		() => [styles.dislikeButton, like === false ? { backgroundColor: foods_area_color } : undefined],
		[like, foods_area_color]
	);

	return (
		<View style={styles.row}>
			<Pressable
				style={likeButtonStyle}
				onPress={onPressLike}
			>
				{likeLoading ? (
					<ActivityIndicator size={iconSize} color={foods_area_color} />
				) : (
					<MaterialCommunityIcons
						name={like ? 'thumb-up' : 'thumb-up-outline'}
						size={iconSize}
						color={like ? contrastColor : theme.screen.icon}
					/>
				)}
				{likeCount != null && likeCount > 0 && (
					<Text style={[styles.count, { color: like ? contrastColor : theme.screen.text }]}>{likeCount}</Text>
				)}
			</Pressable>

			<Pressable
				style={dislikeButtonStyle}
				onPress={onPressDislike}
			>
				{dislikeLoading ? (
					<ActivityIndicator size={iconSize} color={foods_area_color} />
				) : (
					<MaterialCommunityIcons
						name={like === false ? 'thumb-down' : 'thumb-down-outline'}
						size={iconSize}
						color={like === false ? contrastColor : theme.screen.icon}
					/>
				)}
				{dislikeCount != null && dislikeCount > 0 && (
					<Text style={[styles.count, { color: like === false ? contrastColor : theme.screen.text }]}>{dislikeCount}</Text>
				)}
			</Pressable>
		</View>
	);
};

export default React.memo(SettingsListLikeDislikeFast);

const styles = StyleSheet.create({
	row: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	likeButton: {
		padding: 8,
		borderTopWidth: 1,
		borderBottomWidth: 1,
		borderLeftWidth: 1,
		borderRightWidth: 0,
		borderTopLeftRadius: 5,
		borderBottomLeftRadius: 5,
		borderColor: '#2E2E2E',
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
	},
	dislikeButton: {
		padding: 8,
		borderTopWidth: 1,
		borderBottomWidth: 1,
		borderRightWidth: 1,
		borderLeftWidth: 1,
		borderTopRightRadius: 5,
		borderBottomRightRadius: 5,
		borderColor: '#2E2E2E',
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
	},
	count: {
		fontSize: 14,
		fontFamily: 'Poppins_400Regular',
		marginLeft: 6,
	},
});
