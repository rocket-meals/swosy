import React, { useCallback, useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons, Octicons } from '@expo/vector-icons';
import { shallowEqual } from 'react-redux';
import { DatabaseTypes, doesPopupEventMatchCanteen, isPopupEventShownInFoodoffers } from 'repo-depkit-common';
import PopupEventSheet from '@/components/PopupEventSheet/PopupEventSheet';
import MyImage from '@/components/MyImage';
import { useMyScrollViewModal } from '@/components/GlobalModal/useMyScrollViewModal';
import { getImageUrl } from '@/constants/HelperFunctions';
import { getTitleFromTranslation } from '@/helper/resourceHelper';
import { useTheme } from '@/hooks/useTheme';
import { useLanguage } from '@/hooks/useLanguage';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { SET_POPUP_EVENTS } from '@/redux/Types/types';
import { TranslationKeys } from '@/locales/keys';

type FoodoffersPopupEvent = DatabaseTypes.PopupEvents & { isOpen?: boolean };

type PopupEventFoodoffersHintProps = {
	canteenId: string;
};

/**
 * Popup events with `display_mode` "foodoffers", as compact cards above the food offers instead of a
 * sheet that opens on its own. Only the events for the shown canteen (an event without canteens is
 * meant for all of them). A tap opens the full event, the "x" hides it for good, the same way as the
 * "do not show again" button of the popup (persisted `isOpen` flag).
 */
const PopupEventFoodoffersHint: React.FC<PopupEventFoodoffersHintProps> = ({ canteenId }) => {
	const { theme } = useTheme();
	const { translate } = useLanguage();
	const dispatch = useAppDispatch();
	const { show: showModal, close: closeModal } = useMyScrollViewModal();
	const { primaryColor, language } = useAppSelector(state => state.settings);
	const popupEvents = useAppSelector(state => state.food.popupEvents, shallowEqual) as FoodoffersPopupEvent[];

	const visibleEvents = useMemo(() => (popupEvents ?? []).filter(event => !event?.isOpen && isPopupEventShownInFoodoffers(event) && doesPopupEventMatchCanteen(event, canteenId)), [popupEvents, canteenId]);

	const dismiss = useCallback(
		(event: FoodoffersPopupEvent) => {
			const updatedEvents = popupEvents.map(entry => (entry.id === event.id ? { ...entry, isOpen: true } : entry));
			dispatch({ type: SET_POPUP_EVENTS, payload: updatedEvents });
		},
		[dispatch, popupEvents]
	);

	const openDetails = useCallback(
		(event: FoodoffersPopupEvent) => {
			const dismissAndClose = () => {
				dismiss(event);
				closeModal();
			};
			showModal({
				children: <PopupEventSheet closeSheet={dismissAndClose} eventData={event} />,
			});
		},
		[showModal, closeModal, dismiss]
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
						<TouchableOpacity onPress={() => dismiss(event)} accessibilityRole="button" accessibilityLabel={translate(TranslationKeys.hide)} hitSlop={12}>
							<MaterialCommunityIcons name="close" size={20} color={theme.screen.icon} />
						</TouchableOpacity>
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

export default PopupEventFoodoffersHint;
