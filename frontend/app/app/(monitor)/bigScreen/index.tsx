import {
  Animated,
  Dimensions,
  Easing,
  Image,
  ScrollView,
  Text,
  View,
} from 'react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import styles from './styles';
import { useTheme } from '@/hooks/useTheme';
import { useSelector } from 'react-redux';
import { fetchFoodsByCanteen } from '@/redux/actions/FoodOffers/FoodOffers';
import {
  getImageUrl,
  showDayPlanPrice,
  showFormatedPrice,
} from '@/constants/HelperFunctions';
import { getTextFromTranslation } from '@/helper/resourceHelper';
import { myContrastColor } from '@/helper/colorHelper';
import { useLanguage } from '@/hooks/useLanguage';
import { useLocalSearchParams } from 'expo-router';
import NetInfo from '@react-native-community/netinfo';
import { iconLibraries } from '@/components/Drawer/CustomDrawerContent';
import { TranslationKeys } from '@/locales/keys';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import { RootState } from '@/redux/reducer';

const Index = () => {
  useSetPageTitle(TranslationKeys.big_screen);
  const { theme } = useTheme();
  const { translate } = useLanguage();
  const params = useLocalSearchParams();
  const { width, height } = Dimensions.get('window');
  const imageSize = width / 2;
  const [currentTime, setCurrentTime] = useState('');
  const { markings, foodCategories, foodOfferCategories } = useSelector(
    (state: RootState) => state.food
  );
  const [logoStyle, setLogoStyle] = useState(styles.logo);
  const {
    language,
    primaryColor: projectColor,
    appSettings,
    serverInfo,
    selectedTheme: mode,
  } = useSelector((state: RootState) => state.settings);
  const [foods, setFoods] = useState([]);
  const [currentFoodIndex, setCurrentFoodIndex] = useState(0);
  const [currentFood, setCurrentFood] = useState<any>(null);
  const [currentMarking, setCurrentMarking] = useState([]);
  const [currentFoodCategory, setCurrentFoodCategory] = useState<any>(null);
  const [currentFoodOfferCategory, setCurrentFoodOfferCategory] =
    useState<any>(null);
  const [screenWidth, setScreenWidth] = useState(
    Dimensions.get('window').width
  );
  const [isConnected, setIsConnected] = useState(true);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { canteens } = useSelector((state: RootState) => state.canteenReducer);
  const [selectedCanteen, setSelectedCanteen] = useState<any>(null);
  const companyImage =
    appSettings?.company_image &&
    getImageUrl(String(appSettings?.company_image))?.split('?')[0];
  const foods_area_color = appSettings?.foods_area_color
    ? appSettings?.foods_area_color
    : projectColor;

  const defaultImage =
    getImageUrl(String(appSettings.foods_placeholder_image)) ||
    appSettings.foods_placeholder_image_remote_url ||
    getImageUrl(serverInfo?.info?.project?.project_logo);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state?.isConnected);
    });

    return () => unsubscribe();
  }, []);

  const fetchSelectedCanteen = useCallback(() => {
    if (!params?.canteens_id || !canteens || canteens.length === 0) return;

    const foundCanteen = canteens?.find(
      (canteen: any) => canteen.id === params?.canteens_id
    );

    if (foundCanteen) {
      setSelectedCanteen(foundCanteen);
    } else {
      console.warn('Canteen not found for ID:', params?.canteens_id);
    }
  }, [params?.canteens_id, canteens]);

  useEffect(() => {
    fetchSelectedCanteen();
  }, [params?.canteens_id, canteens]);

  const fetchFoods = async () => {
    try {
      const todayDate = new Date().toISOString().split('T')[0];
      const foodData = await fetchFoodsByCanteen(
        String(params?.canteens_id),
        todayDate
      );

      let filteredData = foodData?.data || [];

      // First filter by foodCategoryIds if exists
      if (params?.foodCategoryIds) {
        filteredData = filteredData.filter(
          (food: any) => food?.foodoffer_category === params.foodCategoryIds
        );
      }

      // Then filter by foodOfferCategoryIds if exists (using previous filtered results)
      if (params?.foodOfferCategoryIds) {
        const offerFiltered = filteredData.filter(
          (food: any) =>
            food?.food?.food_category === params.foodOfferCategoryIds
        );
        // Only overwrite if we have results from both filters
        filteredData = offerFiltered.length > 0 ? offerFiltered : [];
      }

      setFoods(filteredData);
      if (filteredData?.length > 0) {
        setCurrentFood(filteredData[0]);
        setCurrentFoodIndex(0);
        startProgressAnimation();
      }
    } catch (error) {
      console.error('Error fetching Food Offers:', error);
    }
  };

  useEffect(() => {
    if (params?.refreshFoodOffersIntervalInSeconds) {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }

      refreshIntervalRef.current = setInterval(() => {
        if (isConnected) {
          fetchFoods();
        } else {
          console.log('Offline: Skipping API call');
        }
      }, Number(params.refreshFoodOffersIntervalInSeconds) * 1000);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [params?.refreshFoodOffersIntervalInSeconds]);

  useEffect(() => {
    if (params?.canteens_id) {
      fetchFoods();
    }
  }, [params?.foodCategoryIds, params?.canteens_id]);

  useEffect(() => {
    if (foods.length > 0 && params?.nextFoodIntervalInSeconds) {
      const interval = setInterval(() => {
        setCurrentFoodIndex((prevIndex) => {
          const nextIndex = (prevIndex + 1) % foods.length;
          setCurrentFood(foods[nextIndex]);
          startProgressAnimation();
          return nextIndex;
        });
      }, Number(params.nextFoodIntervalInSeconds) * 1000);

      return () => clearInterval(interval);
    }
  }, [foods, params.nextFoodIntervalInSeconds]);

  const updateLogoStyle = useCallback(() => {
    setLogoStyle({
      width: width < 600 ? 150 : width > 600 ? 300 : 300,
      height: width < 600 ? 70 : width > 600 ? 75 : 70,
      marginRight: width > 600 ? 20 : 10,
    });
  }, [width]);

  useEffect(() => {
    updateLogoStyle();
    const subscription = Dimensions.addEventListener('change', updateLogoStyle);

    return () => {
      subscription.remove();
    };
  }, [updateLogoStyle]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const formattedTime = `${now
        .toLocaleDateString('en-GB')
        .replace(/\//g, '.')} - ${now.toLocaleTimeString('en-US', {
        hour12: false,
      })}`;
      setCurrentTime(formattedTime);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const fetchCurrentFoodCategory = async () => {
    try {
      if (params?.foodCategoryIds) {
        const currentCategory = foodOfferCategories?.filter(
          (category: any) => category?.id === params?.foodCategoryIds
        );
        setCurrentFoodCategory(currentCategory[0]);
      } else {
        const currentCategory = foodOfferCategories?.filter(
          (category: any) => category?.id === currentFood?.foodoffer_category
        );
        setCurrentFoodCategory(currentCategory[0]);
      }
    } catch (error) {
      console.error('Error fetching food categories:', error);
    }
  };

  const fetchCurrentFoodOfferCategory = async () => {
    try {
      if (params?.foodOfferCategoryIds) {
        const currentCategory = foodCategories?.filter(
          (category: any) => category?.id === params?.foodOfferCategoryIds
        );
        setCurrentFoodOfferCategory(currentCategory[0]);
      } else {
        const currentCategory = foodCategories?.filter(
          (category: any) => category?.id === currentFood?.food?.food_category
        );
        setCurrentFoodOfferCategory(currentCategory[0]);
      }
    } catch (error) {
      console.error('Error fetching food categories:', error);
    }
  };

  const fetchMarkingLabels = useCallback(() => {
    if (!currentFood?.markings || !markings) return;

    const markingIds = currentFood?.markings?.map(
      (mark: any) => mark.markings_id
    );

    const filteredMarkings = markings?.filter((mark: any) =>
      markingIds?.includes(mark.id)
    );

    let dummyMarkings: any = [];
    if (filteredMarkings) {
      filteredMarkings?.forEach((item: any) => {
        const markingImage = item?.image_remote_url
          ? { uri: item?.image_remote_url }
          : { uri: getImageUrl(item?.image) };

        const backgroundColor = item?.background_color;
        const MarkingColor = myContrastColor(
          item?.background_color,
          theme,
          mode === 'dark'
        );
        dummyMarkings.push({
          image: markingImage,
          bgColor: backgroundColor,
          color: MarkingColor,
          shortCode: item?.short_code,
          icon: item?.icon,
          hide_border: item?.hide_border,
        });
      });
      if (dummyMarkings) {
        setCurrentMarking(dummyMarkings);
      }
    }
  }, [currentFood, markings]);

  useEffect(() => {
    if (currentFood) {
      fetchCurrentFoodCategory();
      fetchCurrentFoodOfferCategory();
      fetchMarkingLabels();
    }
  }, [currentFoodIndex, currentFood]);

  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(Dimensions.get('window').width);
    };

    const subscription = Dimensions.addEventListener('change', handleResize);

    return () => subscription?.remove();
  }, []);

  const startProgressAnimation = () => {
    progressAnim.setValue(0);
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: Number(params?.nextFoodIntervalInSeconds || 10) * 1000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
  };

  return (
    <ScrollView
      style={{
        ...styles.container,
        backgroundColor: theme.screen.background,
      }}
      contentContainerStyle={{
        flexDirection:
          foods && foods?.length < 1
            ? 'column'
            : width > height
            ? 'row'
            : 'column',
      }}
    >
      <View style={[foods && foods?.length > 0 && { flex: 1 }]}>
        <View
          style={{
            ...styles.headerContainer,
          }}
        >
          <View style={styles.headerCol1}>
            <View style={styles.logoContainer}>
              <Image source={{ uri: companyImage }} style={logoStyle} />
            </View>
            <View style={styles.labelText}>
              <View style={styles.row}>
                <Text
                  style={{
                    ...styles.label,
                    color: theme.screen.text,
                    fontSize: screenWidth > 600 ? 22 : 16,
                  }}
                >
                  {selectedCanteen?.alias}
                </Text>
                {!isConnected && (
                  <View style={styles.offlineChip}>
                    <Text
                      style={{
                        ...styles.timestamp,
                        color: '#ffffff',
                        fontSize: screenWidth > 600 ? 14 : 12,
                      }}
                    >
                      {'Offline'}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.row}>
                <Text
                  style={{
                    ...styles.timestamp,
                    color: theme.screen.text,
                    fontSize: screenWidth > 600 ? 14 : 12,
                  }}
                >
                  {currentTime}
                </Text>
                <Text
                  style={{
                    ...styles.headerFoodLabel,
                    color: theme.screen.text,
                    fontSize: screenWidth > 600 ? 14 : 12,
                  }}
                >
                  {foods?.length > 0
                    ? `${currentFoodIndex + 1} / ${foods?.length} ${translate(
                        TranslationKeys.foods
                      )}`
                    : ''}
                </Text>
              </View>
            </View>
          </View>

          <Animated.View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              height: 4,
              backgroundColor: foods_area_color,
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            }}
          />
        </View>
        {foods && foods?.length > 0 && (
          <>
            {height > width && (
              <View style={{ ...styles.col2 }}>
                <Image
                  source={
                    currentFood?.food?.image_remote_url ||
                    getImageUrl(currentFood?.food?.image)
                      ? {
                          uri:
                            currentFood?.food?.image_remote_url ||
                            getImageUrl(currentFood?.food?.image),
                        }
                      : { uri: defaultImage }
                  }
                  style={{
                    width: width,
                    height: width,
                  }}
                  resizeMode='cover'
                />
              </View>
            )}
            <View
              style={{
                ...styles.contentWrapper,
                marginTop: height < width ? 0 : 20,
              }}
            >
              <View style={styles.foodAliasContainer}>
                {params?.showFoodCategoryName === 'true' && (
                  <Text
                    style={{
                      ...styles.subHeading,
                      color: theme.screen.text,
                      fontSize: screenWidth > 600 ? 24 : 16,
                    }}
                  >
                    {currentFoodCategory &&
                    currentFoodCategory?.translations?.length > 0
                      ? getTextFromTranslation(
                          currentFoodCategory?.translations,
                          language
                        )
                      : currentFoodCategory?.alias || ''}
                  </Text>
                )}
                {params?.showFoodofferCategoryName === 'true' && (
                  <Text
                    style={{
                      ...styles.subHeading,
                      color: theme.screen.text,
                      fontSize: screenWidth > 600 ? 24 : 16,
                    }}
                  >
                    {currentFoodOfferCategory &&
                    currentFoodOfferCategory?.translations?.length > 0
                      ? getTextFromTranslation(
                          currentFoodOfferCategory?.translations,
                          language
                        )
                      : currentFoodOfferCategory?.alias || ''}
                  </Text>
                )}

                <Text
                  style={{
                    ...styles.heading,
                    color: theme.screen.text,
                    textAlign: 'right',
                    fontSize: screenWidth > 600 ? 24 : 18,
                  }}
                >
                  {getTextFromTranslation(
                    currentFood?.food?.translations,
                    language
                  )}
                </Text>
              </View>
              <View style={styles.foodDetailsContainer}>
                <Text
                  style={{
                    ...styles.subHeading,
                    color: theme.screen.text,
                    fontSize: screenWidth > 600 ? 24 : 16,
                  }}
                >
                  {`${translate(TranslationKeys.price_group_student)}:`}
                </Text>
                <Text
                  style={{
                    ...styles.heading,
                    color: theme.screen.text,
                    fontSize: screenWidth > 600 ? 44 : 18,
                  }}
                >
                  {showFormatedPrice(showDayPlanPrice(currentFood, 'student'))}
                </Text>
                <Text
                  style={{
                    ...styles.body,
                    color: theme.screen.text,
                    fontSize: screenWidth > 600 ? 24 : 16,
                  }}
                >
                  {`${translate(TranslationKeys.price_group_employee)}: `}
                  {showFormatedPrice(showDayPlanPrice(currentFood, 'employee'))}
                </Text>
                <Text
                  style={{
                    ...styles.body,
                    color: theme.screen.text,
                    fontSize: screenWidth > 600 ? 24 : 16,
                  }}
                >
                  {`${translate(TranslationKeys.price_group_guest)}: `}
                  {showFormatedPrice(showDayPlanPrice(currentFood, 'guest'))}
                </Text>
                <Text
                  style={{
                    ...styles.body,
                    color: theme.screen.text,
                    fontSize: screenWidth > 600 ? 24 : 16,
                  }}
                >
                  {`${translate(TranslationKeys.markings)}:`}
                </Text>
                <View style={styles.labelsContainer}>
                  {currentMarking &&
                    currentMarking?.map((item: any) => {
                      const iconParts = item?.icon?.split(':') || [];
                      const [library, name] = iconParts;
                      const Icon = library && iconLibraries[library];
                      if (item?.shortCode && !item?.image?.uri && !item?.icon) {
                        return (
                          <View
                            style={{
                              ...styles.shortCode,
                              backgroundColor: item?.bgColor,
                            }}
                          >
                            <Text style={{ color: item.color, fontSize: 18 }}>
                              {item?.shortCode}
                            </Text>
                          </View>
                        );
                      }
                      if (!item?.image?.uri && item?.icon) {
                        return (
                          <View
                            style={{
                              ...styles.shortCode,
                              backgroundColor: item?.bgColor,
                            }}
                          >
                            <Icon name={name} size={20} color={item.color} />
                          </View>
                        );
                      }
                      if (item?.image?.uri) {
                        return (
                          <View
                            style={{
                              width: 30,
                              height: 30,
                            }}
                          >
                            <Image
                              source={item?.image?.uri}
                              style={{
                                ...styles.icon,
                                backgroundColor: item?.bgColor && item?.bgColor,
                                borderRadius: item?.bgColor
                                  ? 8
                                  : item.hide_border
                                  ? 5
                                  : 0,
                              }}
                            />
                          </View>
                        );
                      }
                    })}
                </View>
              </View>
            </View>
          </>
        )}
      </View>
      {foods && foods?.length > 0 && (
        <>
          {height < width && (
            <View style={{ ...styles.col2 }}>
              <Image
                source={
                  currentFood?.food?.image_remote_url ||
                  getImageUrl(currentFood?.food?.image)
                    ? {
                        uri:
                          currentFood?.food?.image_remote_url ||
                          getImageUrl(currentFood?.food?.image),
                      }
                    : { uri: defaultImage }
                }
                style={{
                  width: imageSize,
                  height: width > height ? height - 2 : imageSize,
                  backgroundColor: theme.screen.iconBg,
                }}
                resizeMode='cover'
              />
            </View>
          )}
        </>
      )}
      {foods && foods?.length < 1 && (
        <View style={styles.emptyContainer}>
          <View style={{ flex: 1 }}>
            <Image
              source={require('@/assets/images/icon.png')}
              resizeMode='cover'
            />
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default Index;
