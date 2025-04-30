import { Dimensions, Image, Text, TouchableOpacity, View } from 'react-native';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import styles from './styles';
import { isWeb } from '@/constants/Constants';
import { useTheme } from '@/hooks/useTheme';
import {
  AntDesign,
  MaterialCommunityIcons,
  MaterialIcons,
} from '@expo/vector-icons';
import { FoodItemProps } from './types';
import {
  excerpt,
  getImageUrl,
  getpreviousFeedback,
  showFormatedPrice,
  showPrice,
} from '@/constants/HelperFunctions';
import {
  getDescriptionFromTranslation,
  getTextFromTranslation,
} from '@/helper/resourceHelper';
import {
  Foods,
  FoodsFeedbacks,
  Markings,
  ProfilesMarkings,
} from '@/constants/types';
import { useDispatch, useSelector } from 'react-redux';
import { FoodFeedbackHelper } from '@/redux/actions/FoodFeedbacks/FoodFeedbacks';
import {
  DELETE_FOOD_FEEDBACK_LOCAL,
  SET_MARKING_DETAILS,
  SET_SELECTED_FOOD_MARKINGS,
  UPDATE_FOOD_FEEDBACK_LOCAL,
} from '@/redux/Types/types';
import PermissionModal from '../PermissionModal/PermissionModal';
import { router } from 'expo-router';
import { createSelector } from 'reselect';
import { Tooltip, TooltipContent, TooltipText } from '@gluestack-ui/themed';
import { useLanguage } from '@/hooks/useLanguage';
const selectAuthState = (state: any) => state.authReducer;
const selectFoodState = (state: any) => state.food;

const selectPreviousFeedback = createSelector(
  [selectFoodState, (_, foodId) => foodId],
  (foodState, foodId) => getpreviousFeedback(foodState.ownFoodFeedbacks, foodId)
);

const selectMarkings = createSelector(
  [selectFoodState],
  (foodState) => foodState.markings
);

const FoodItem: React.FC<FoodItemProps> = memo(
  ({
    item,
    handleMenuSheet,
    handleImageSheet,
    setSelectedFoodId,
    handleEatingHabitsSheet,
  }) => {
    const foodFeedbackHelper = useMemo(() => new FoodFeedbackHelper(), []);
    const [screenWidth, setScreenWidth] = useState(
      Dimensions.get('window').width
    );
    const [warning, setWarning] = useState(false);
    const dispatch = useDispatch();
    const { theme } = useTheme();
    const { t } = useLanguage();
    const { food } = item;
    const foodItem = food as Foods;
    const markings = useSelector(selectMarkings);
    const { user, profile, isManagement } = useSelector(selectAuthState);
    const previousFeedback = useSelector((state) =>
      selectPreviousFeedback(state, foodItem.id)
    );
    const {
      amountColumnsForcard,
      language,
      serverInfo,
      appSettings,
      primaryColor,
    } = useSelector((state: any) => state.settings);
    const foods_area_color = appSettings?.foods_area_color
      ? appSettings?.foods_area_color
      : primaryColor;
    const defaultImage =
      getImageUrl(appSettings.foods_placeholder_image) ||
      appSettings.foods_placeholder_image_remote_url ||
      getImageUrl(serverInfo?.info?.project?.project_logo);

    const getPriceGroup = (price_group: string) => {
      if (price_group) {
        return `price_group_${price_group?.toLocaleLowerCase()}`;
      }
      return '';
    };

    const handleNavigation = (id: string, foodId: string) => {
      router.push({
        pathname: '/(app)/foodoffers/details',
        params: { id, foodId },
      });
    };

    const dislikedMarkings = useMemo(
      () =>
        item?.markings?.filter((marking) =>
          profile?.markings?.some(
            (profileMarking: ProfilesMarkings) =>
              profileMarking?.markings_id === marking?.markings_id &&
              profileMarking?.like === false
          )
        ),
      [item?.markings, profile?.markings]
    );

    const handleOpenSheet = useCallback(() => {
      dispatch({ type: SET_SELECTED_FOOD_MARKINGS, payload: dislikedMarkings });
      handleEatingHabitsSheet('eatingHabits');
    }, [dispatch, dislikedMarkings, handleEatingHabitsSheet]);

    const updateRating = useCallback(
      async (rating: number | null) => {
        if (!user?.id) {
          setWarning(true);
          return;
        }
        try {
          const updateFeedbackResult =
            (await foodFeedbackHelper.updateFoodFeedback(
              foodItem?.id,
              profile?.id,
              { ...previousFeedback, rating }
            )) as FoodsFeedbacks;
          dispatch({
            type: updateFeedbackResult?.id
              ? UPDATE_FOOD_FEEDBACK_LOCAL
              : DELETE_FOOD_FEEDBACK_LOCAL,
            payload: updateFeedbackResult || previousFeedback?.id,
          });
        } catch (e) {
          console.error('Error creating feedback:', e);
        }
      },
      [user?.id, profile?.id, foodItem?.id, previousFeedback]
    );

    const markingsData = useMemo(
      () =>
        markings
          ?.filter((m: Markings) =>
            item?.markings.some((mark) => mark.markings_id === m.id)
          )
          .slice(0, 2),
      [markings, item?.markings]
    );

    useEffect(() => {
      const handleResize = () => setScreenWidth(Dimensions.get('window').width);
      const subscription = Dimensions.addEventListener('change', handleResize);
      return () => subscription?.remove();
    }, []);

    const openMarkingLabel = (marking: Markings) => {
      dispatch({
        type: SET_MARKING_DETAILS,
        payload: marking,
      });
      handleMenuSheet('menu');
    };

    const handlePriceChange = () => {
      router.navigate('/price-group');
    };

    const getCardDimension = () => {
      const dimensionMap = [
        { min: 960, max: 1110, value: 300 },
        { min: 750, max: 840, value: 350 },
        { min: 710, max: 750, value: 330 },
        { min: 650, max: 709, value: 300 },
        { min: 570, max: Infinity, value: 260 },
        { min: 530, max: Infinity, value: 240 },
        { min: 500, max: Infinity, value: 220 },
        { min: 450, max: Infinity, value: 210 },
        { min: 380, max: Infinity, value: 180 },
        { min: 360, max: Infinity, value: 170 },
        { min: 340, max: Infinity, value: 160 },
        { min: 320, max: Infinity, value: 150 },
        { min: 300, max: Infinity, value: 140 },
        { min: 280, max: Infinity, value: 130 },
      ];

      for (const { min, max, value } of dimensionMap) {
        if (screenWidth > min && screenWidth < max) return value;
      }

      return 120; // Default value
    };

    const getCardWidth = () => {
      const offset = screenWidth < 500 ? 10 : screenWidth < 900 ? 25 : 35;
      return screenWidth / amountColumnsForcard - offset;
    };

    useEffect(() => {
      getCardWidth();
    }, [amountColumnsForcard, screenWidth]);

    return (
      <>
        <Tooltip
          placement='top'
          trigger={(triggerProps) => (
            <TouchableOpacity
              {...triggerProps}
              style={{
                ...styles.card,
                width:
                  amountColumnsForcard === 0
                    ? getCardDimension()
                    : getCardWidth(),
                backgroundColor: theme.card.background,
                borderWidth: dislikedMarkings.length > 0 ? 3 : 0,
                borderColor: '#FF000095',
              }}
              onPress={() => {
                const foodId =
                  item?.food && typeof item.food !== 'string'
                    ? item.food.id
                    : '';

                handleNavigation(item?.id, foodId);
              }}
            >
              <View
                style={{
                  ...styles.imageContainer,
                  height:
                    amountColumnsForcard === 0
                      ? getCardDimension()
                      : getCardWidth(),
                }}
              >
                <Image
                  style={{
                    ...styles.image,
                    borderColor: foods_area_color,
                  }}
                  source={
                    foodItem?.image_remote_url || foodItem?.image
                      ? {
                          uri:
                            foodItem?.image_remote_url ||
                            getImageUrl(foodItem?.image),
                        }
                      : { uri: defaultImage }
                  }
                />
                {isManagement && (
                  <Tooltip
                    placement='top'
                    trigger={(triggerProps) => (
                      <TouchableOpacity
                        {...triggerProps}
                        style={styles.editImageButton}
                        onPress={() => {
                          setSelectedFoodId(item?.food?.id);
                          handleImageSheet(item?.food?.id);
                        }}
                      >
                        <MaterialCommunityIcons
                          name='image-edit'
                          size={20}
                          color={'white'}
                        />
                      </TouchableOpacity>
                    )}
                  >
                    <TooltipContent
                      bg={theme.tooltip.background}
                      py='$1'
                      px='$2'
                    >
                      <TooltipText fontSize='$sm' color={theme.tooltip.text}>
                        {`${t('edit')}: ${t('image')}`}
                      </TooltipText>
                    </TooltipContent>
                  </Tooltip>
                )}
                <TouchableOpacity style={styles.favContainer}>
                  {previousFeedback?.rating === 5 ? (
                    <Tooltip
                      placement='top'
                      trigger={(triggerProps) => (
                        <TouchableOpacity
                          {...triggerProps}
                          onPress={() => updateRating(null)}
                        >
                          <AntDesign
                            name='star'
                            size={20}
                            color={foods_area_color}
                          />
                        </TouchableOpacity>
                      )}
                    >
                      <TooltipContent
                        bg={theme.tooltip.background}
                        py='$1'
                        px='$2'
                      >
                        <TooltipText fontSize='$sm' color={theme.tooltip.text}>
                          {t('set_rate_as_not_favorite')}
                        </TooltipText>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <Tooltip
                      placement='top'
                      trigger={(triggerProps) => (
                        <TouchableOpacity
                          {...triggerProps}
                          onPress={() => updateRating(5)}
                        >
                          <AntDesign name='staro' size={20} color={'white'} />
                        </TouchableOpacity>
                      )}
                    >
                      <TooltipContent
                        bg={theme.tooltip.background}
                        py='$1'
                        px='$2'
                      >
                        <TooltipText fontSize='$sm' color={theme.tooltip.text}>
                          {t('set_rate_as_favorite')}
                        </TooltipText>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </TouchableOpacity>
                {dislikedMarkings.length > 0 && (
                  <Tooltip
                    placement='top'
                    trigger={(triggerProps) => (
                      <TouchableOpacity
                        style={{
                          ...styles.favContainerWarn,
                        }}
                        {...triggerProps}
                        onPress={handleOpenSheet}
                      >
                        <MaterialIcons
                          name='warning'
                          size={20}
                          color={foods_area_color}
                        />
                      </TouchableOpacity>
                    )}
                  >
                    <TooltipContent
                      bg={theme.tooltip.background}
                      py='$1'
                      px='$2'
                    >
                      <TooltipText fontSize='$sm' color={theme.tooltip.text}>
                        {`${t('attention')} ${t('eating_habits')}`}
                      </TooltipText>
                    </TooltipContent>
                  </Tooltip>
                )}
                <View style={styles.categoriesContainer}>
                  {markingsData?.map((mark: any) => {
                    const description = getDescriptionFromTranslation(
                      mark?.translations,
                      language
                    );
                    if ((mark?.image_remote_url || mark?.image) && description)
                      return (
                        <TouchableOpacity
                          key={mark.id}
                          onPress={() => openMarkingLabel(mark)}
                        >
                          <Image
                            source={
                              mark?.image_remote_url || mark?.image
                                ? {
                                    uri:
                                      mark?.image_remote_url ||
                                      getImageUrl(mark?.image),
                                  }
                                : { uri: defaultImage }
                            }
                            style={{
                              ...styles.categoryLogo,
                              backgroundColor:
                                mark?.background_color &&
                                mark?.background_color,
                              borderRadius: mark?.background_color
                                ? 8
                                : mark.hide_border
                                ? 5
                                : 0,
                            }}
                          />
                        </TouchableOpacity>
                      );
                  })}
                </View>
                <Tooltip
                  placement='top'
                  trigger={(triggerProps) => (
                    <TouchableOpacity
                      style={styles.priceTag}
                      {...triggerProps}
                      onPress={handlePriceChange}
                    >
                      <Text style={styles.priceText}>
                        {showFormatedPrice(showPrice(item, profile))}
                      </Text>
                    </TouchableOpacity>
                  )}
                >
                  <TooltipContent bg={theme.tooltip.background} py='$1' px='$2'>
                    <TooltipText fontSize='$sm' color={theme.tooltip.text}>
                      {`${showFormatedPrice(showPrice(item, profile))} - ${t(
                        'edit'
                      )}: ${t('price_group')} ${t(
                        profile?.price_group
                          ? getPriceGroup(profile?.price_group)
                          : ''
                      )}`}
                    </TooltipText>
                  </TooltipContent>
                </Tooltip>
              </View>

              <View
                style={{
                  ...styles.cardContent,
                  gap: isWeb ? 15 : 5,
                  borderColor: foods_area_color,
                  paddingHorizontal: isWeb
                    ? screenWidth > 550
                      ? 5
                      : screenWidth > 360
                      ? 5
                      : 5
                    : 5,
                }}
              >
                <Text style={{ ...styles.foodName, color: theme.screen.text }}>
                  {screenWidth > 1000
                    ? excerpt(
                        getTextFromTranslation(
                          foodItem?.translations,
                          language
                        ),
                        120
                      )
                    : screenWidth > 700
                    ? excerpt(
                        getTextFromTranslation(
                          foodItem?.translations,
                          language
                        ),
                        80
                      )
                    : screenWidth > 460
                    ? excerpt(
                        getTextFromTranslation(
                          foodItem?.translations,
                          language
                        ),
                        60
                      )
                    : excerpt(
                        getTextFromTranslation(
                          foodItem?.translations,
                          language
                        ),
                        40
                      )}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        >
          <TooltipContent bg={theme.tooltip.background} py='$1' px='$2'>
            <TooltipText fontSize='$sm' color={theme.tooltip.text}>
              {getTextFromTranslation(foodItem?.translations, language)}
            </TooltipText>
          </TooltipContent>
        </Tooltip>

        <PermissionModal isVisible={warning} setIsVisible={setWarning} />
      </>
    );
  },
  (prevProps, nextProps) => prevProps.item === nextProps.item
);

export default FoodItem;
