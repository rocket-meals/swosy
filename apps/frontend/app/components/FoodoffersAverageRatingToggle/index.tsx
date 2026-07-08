import React from 'react';
import { AntDesign } from '@expo/vector-icons';
import SettingsListBoolean from '@/components/SettingsListBoolean/SettingsListBoolean';
import { useAppSelector } from '@/redux/hooks';
import { useDispatch, shallowEqual } from 'react-redux';
import { SET_FOODOFFERS_SHOW_AVERAGE_RATING_ON_CARD } from '@/redux/Types/types';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKeys } from '@/locales/keys';

interface FoodoffersAverageRatingToggleProps {
	groupPosition: 'top' | 'middle' | 'bottom' | 'single';
	iconBgColor?: string;
	iconSize?: number;
}

const FoodoffersAverageRatingToggle: React.FC<FoodoffersAverageRatingToggleProps> = ({
	groupPosition,
	iconBgColor,
	iconSize = 20,
}) => {
	const { translate } = useLanguage();
	const dispatch = useDispatch();
	const appSettings = useAppSelector((state) => state.settings.appSettings, shallowEqual);
	const foodoffersShowAverageRatingOnCard = useAppSelector((state) => state.settings.foodoffersShowAverageRatingOnCard);
	const primaryColor = useAppSelector((state) => state.settings.primaryColor);

	if (appSettings?.foods_ratings_average_display !== true) {
		return null;
	}

	const effectiveShowAverageOnCard = foodoffersShowAverageRatingOnCard !== null
		? foodoffersShowAverageRatingOnCard
		: (appSettings?.foods_ratings_average_display_on_card ?? false);

	return (
		<SettingsListBoolean
			iconBgColor={iconBgColor ?? primaryColor}
			leftIcon={<AntDesign name="star" size={iconSize} />}
			label={translate(TranslationKeys.show_average_rating_on_card)}
			isEnabled={effectiveShowAverageOnCard}
			onToggle={() => dispatch({ type: SET_FOODOFFERS_SHOW_AVERAGE_RATING_ON_CARD, payload: !effectiveShowAverageOnCard })}
			groupPosition={groupPosition}
		/>
	);
};

export default FoodoffersAverageRatingToggle;
