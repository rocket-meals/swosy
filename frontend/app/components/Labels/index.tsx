import React, { useEffect, useMemo, useState } from 'react';
import { Linking, Text, View } from 'react-native';
import { useSelector } from 'react-redux';
import { useTheme } from '@/hooks/useTheme';
import styles from './styles';
import RedirectButton from '../RedirectButton';
import MarkingLabels from '../MarkingLabels/MarkingLabels';
import { getFoodOffer } from '@/constants/HelperFunctions';
import { studentUnionUrl } from '@/constants/Constants';
import { FoodoffersMarkings, Markings, MarkingsGroups } from '@/constants/types';
import { createSelector } from 'reselect';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKeys } from '@/locales/keys';
import { RootState } from '@/redux/reducer';
import { sortMarkingsByGroup } from '@/helper/sortingHelper';
import { MarkingGroupsHelper } from '@/redux/actions/MarkingGroups/MarkingGroups';

interface LabelsProps {
  foodDetails: any;
  offerId: string;
  handleMenuSheet?: () => void;
  color: string;
}

const selectMarkings = (state: RootState) => state.food.markings;

export const selectFoodOffer = (offerId: string) =>
  createSelector(
    [(state: RootState) => state.canteenReducer.selectedCanteenFoodOffers],
    (foodOffers) => getFoodOffer(foodOffers, offerId)
  );

const Labels: React.FC<LabelsProps> = ({
  foodDetails,
  offerId,
  handleMenuSheet,
  color,
}) => {
  const { theme } = useTheme();
  const { translate } = useLanguage();
  const { primaryColor, appSettings } = useSelector(
    (state: RootState) => state.settings
  );
  const foods_area_color = appSettings?.foods_area_color
    ? appSettings?.foods_area_color
    : primaryColor;

  let food_responsible_organization_name = appSettings?.food_responsible_organization_name || "Verantwortliche Organisation";
  let food_responsible_organization_link = appSettings?.food_responsible_organization_link || "https://www.studentenwerk-osnabrueck.de/";
    const handleRedirect = () => {
        Linking.openURL(food_responsible_organization_link).catch((err) =>
            console.error('Failed to open URL:', err)
        );
    };

  const markings = useSelector(selectMarkings);
  const foodOffer = useSelector(selectFoodOffer(offerId));

  // State for marking groups
  const [markingGroups, setMarkingGroups] = useState<MarkingsGroups[]>([]);

  // Fetch marking groups
  useEffect(() => {
    const fetchMarkingGroups = async () => {
      try {
        const markingGroupsHelper = new MarkingGroupsHelper();
        const result = await markingGroupsHelper.fetchMarkingGroups({});
        if (result) {
          setMarkingGroups(result);
        }
      } catch (error) {
        console.error('Error fetching marking groups:', error);
      }
    };

    fetchMarkingGroups();
  }, []);

  const foodMarkings = useMemo(() => {
    if (!foodOffer?.markings) return [];

    // First, map food offer markings to actual marking objects
    const mappedMarkings = foodOffer.markings
      ?.map((marking: FoodoffersMarkings) =>
        markings.find((mark: Markings) => mark.id === marking?.markings_id)
      )
      .filter((mark: any): mark is Markings => Boolean(mark));

    // Then sort them using the sortMarkingsByGroup function
    return sortMarkingsByGroup(mappedMarkings, markingGroups);
  }, [foodOffer, markings, markingGroups]);

  return (
    <View style={styles.container}>
      <Text style={{ ...styles.heading, color: theme.screen.text }}>
        {translate(TranslationKeys.markings)}
      </Text>

      {foodMarkings?.map((marking: Markings) => (
        <MarkingLabels
          key={marking.id}
          markingId={marking.id}
          handleMenuSheet={handleMenuSheet}
        />
      ))}

      <Text
        style={{
          ...styles.body,
          color: theme.screen.text,
          fontStyle: 'italic',
        }}
      >
        {translate(TranslationKeys.FOOD_LABELING_INFO)}
      </Text>
      <RedirectButton
        type='link'
        onClick={handleRedirect}
        label={food_responsible_organization_name}
        backgroundColor={foods_area_color}
        color='#FFF'
      />
    </View>
  );
};

export default Labels;
