import React, { useCallback, useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons, Octicons } from '@expo/vector-icons';
import { shallowEqual } from 'react-redux';
import { DatabaseTypes, doesNewsMatchCanteen, getNewsFoodoffersLocation, isNewsShownAt, NewsFoodoffersPosition } from 'repo-depkit-common';
import PopupEventSheet from '@/components/PopupEventSheet/PopupEventSheet';
import MyImage from '@/components/MyImage';
import { useMyScrollViewModal } from '@/components/GlobalModal/useMyScrollViewModal';
import { getImageUrl } from '@/constants/HelperFunctions';
import { getTitleFromTranslation } from '@/helper/resourceHelper';
import { useTheme } from '@/hooks/useTheme';
import { useAppSelector } from '@/redux/hooks';

type FoodoffersNews = DatabaseTypes.News;

type NewsFoodoffersHintProps = {
	canteenId: string;
	position: NewsFoodoffersPosition;
};

/**
 * News with `display_locations` "foodoffers_top" or "foodoffers_bottom", as compact cards above the food
 * offers or below the first day (`position` picks which ones). They come with the popup news
 * (`state.food.popupEvents`, loaded in the app layout). Only the news for the shown canteen (a news
 * without canteens is meant for all of them). A tap opens the full news. The cards cannot be hidden:
 * they stay as long as the news is meant for the food offers (no "x", and the opened news has no
 * "do not show again" button, that one is only for popups and their `isOpen` flag).
 */
const NewsFoodoffersHint: React.FC<NewsFoodoffersHintProps> = ({ canteenId, position }) => {
	const { theme } = useTheme();
	const { show: showModal, close: closeModal } = useMyScrollViewModal();
	const { primaryColor, language } = useAppSelector(state => state.settings);
	const popupEvents = useAppSelector(state => state.food.popupEvents, shallowEqual) as FoodoffersNews[];

	const visibleEvents = useMemo(() => (popupEvents ?? []).filter(event => isNewsShownAt(event, getNewsFoodoffersLocation(position)) && doesNewsMatchCanteen(event, canteenId)), [popupEvents, canteenId, position]);

	const openDetails = useCallback(
		(event: FoodoffersNews) => {
			showModal({
				children: <PopupEventSheet closeSheet={closeModal} eventData={event} showDismissButton={false} />,
			});
		},
		[showModal, closeModal]
	);

	if (visibleEvents.length === 0) {
		return null;
	}

	return (
		<View>
			{visibleEvents.map(event => {
				const title = (event.translations ? getTitleFromTranslation(event.translations, language) : '') || event.alias || '';
				const imageUrl = event.image_remote_url || (event.image ? getImageUrl(String(typeof event.image === 'object' ? event.image.id : event.image)) : null);
				return (
					<TouchableOpacity key={event.id} style={[styles.container, { backgroundColor: theme.screen.iconBg, borderLeftColor: primaryColor }]} onPress={() => openDetails(event)} accessibilityRole="button" accessibilityLabel={title}>
						{imageUrl ? (
							<View style={styles.imageContainer}>
								<MyImage style={styles.image} remote_image_url={imageUrl} />
							</View>
						) : (
							<MaterialCommunityIcons name="bullhorn-outline" size={20} color={theme.screen.icon} />
						)}
						<Text style={[styles.title, { color: theme.screen.text }]} numberOfLines={2}>
							{title}
						</Text>
						<Octicons name="chevron-right" size={18} color={theme.screen.icon} />
					</TouchableOpacity>
				);
			})}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		marginHorizontal: 10,
		marginTop: 12,
		marginBottom: 4,
		paddingVertical: 10,
		paddingHorizontal: 12,
		borderRadius: 12,
		borderLeftWidth: 4,
	},
	imageContainer: {
		width: 40,
		height: 40,
		borderRadius: 8,
		overflow: 'hidden',
	},
	image: {
		width: '100%',
		height: '100%',
	},
	title: {
		flex: 1,
		fontSize: 15,
		fontWeight: '600',
	},
});

export default NewsFoodoffersHint;
