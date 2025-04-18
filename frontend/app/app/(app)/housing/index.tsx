import {
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  Linking,
  Image,
} from 'react-native';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import styles from './styles';
import { useTheme } from '@/hooks/useTheme';
import { isWeb } from '@/constants/Constants';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import {
  DrawerContentComponentProps,
  DrawerNavigationProp,
} from '@react-navigation/drawer';
import { RootDrawerParamList } from './types';
import { useFocusEffect, useNavigation } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { Apartments, Buildings } from '@/constants/types';
import {
  SET_APARTMENTS,
  SET_APARTMENTS_LOCAL,
  SET_UNSORTED_APARTMENTS,
} from '@/redux/Types/types';
import { BuildingsHelper } from '@/redux/actions/Buildings/Buildings';
import { calculateDistanceInMeter } from '@/helper/distanceHelper';
import { ApartmentsHelper } from '@/redux/actions/Apartments/Apartments';
import ApartmentItem from '@/components/ApartmentItem/ApartmentItem';
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import BuildingSortSheet from '@/components/BuildingSortSheet/BuildingSortSheet';
import useToast from '@/hooks/useToast';
import { useLanguage } from '@/hooks/useLanguage';
import ImageManagementSheet from '@/components/ImageManagementSheet/ImageManagementSheet';
import { Tooltip, TooltipContent, TooltipText } from '@gluestack-ui/themed';
import CustomCollapsible from '@/components/CustomCollapsible/CustomCollapsible';
import { myContrastColor } from '@/helper/colorHelper';
import { getTextFromTranslation } from '@/helper/resourceHelper';
import RedirectButton from '@/components/RedirectButton';
import { Platform } from 'react-native';

const index: React.FC<DrawerContentComponentProps> = ({ navigation }) => {
  const toast = useToast();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const dispatch = useDispatch();
  const apartmentsHelper = new ApartmentsHelper();
  const buildingsHelper = new BuildingsHelper();
  const [query, setQuery] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const sortSheetRef = useRef<BottomSheet>(null);
  const sortPoints = useMemo(() => ['80%'], []);
  const imageManagementSheetRef = useRef<BottomSheet>(null);
  const imageManagementPoints = useMemo(() => ['70%'], []);
  const [apartmentsDispatched, setApartmentsDispatched] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [distanceAdded, setDistanceAdded] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<Buildings | null>();
  const [selectedApartmentId, setSelectedApartementId] = useState<string>('');
  const [screenWidth, setScreenWidth] = useState(
    Dimensions.get('window').width
  );
  const { selectedCanteen } = useSelector((state: any) => state.canteenReducer);
  const {
    drawerPosition,
    apartmentsSortBy,
    primaryColor: projectColor,
    appSettings,
    language,
  } = useSelector((state: any) => state.settings);
  const mode = useSelector((state: any) => state.settings.theme);
  const { apartments, apartmentsLocal, unSortedApartments } = useSelector(
    (state: any) => state.apartment
  );

  const housing_area_color = appSettings?.housing_area_color
    ? appSettings?.housing_area_color
    : projectColor;

  const contrastColor = myContrastColor(
    housing_area_color,
    theme,
    mode === 'dark'
  );
  const drawerNavigation =
    useNavigation<DrawerNavigationProp<RootDrawerParamList>>();

  const openSortSheet = () => {
    sortSheetRef.current?.expand();
  };

  const closeSortSheet = () => {
    sortSheetRef?.current?.close();
  };

  const openImageManagementSheet = () => {
    imageManagementSheetRef?.current?.expand();
  };

  const closeImageManagementSheet = () => {
    imageManagementSheetRef?.current?.close();
  };

  useEffect(() => {
    if (Platform.OS === 'web') {
      const title = 'Housing';
      document.title = title;
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setIsActive(true);
      return () => {
        setIsActive(false);
      };
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setApartmentsDispatched(false);
    fetchAllApartments();
    setRefreshing(false);
  }, []);

  const fetchAllApartments = async () => {
    setLoading(true);
    try {
      // Fetch all apartments
      const apartmentData = (await apartmentsHelper.fetchApartments(
        {}
      )) as Buildings[];
      const apartments = apartmentData || [];

      if (apartments && apartments?.length > 0) {
        const apartmentWithBuilding = await Promise.all(
          apartments.map(async (apartment) => {
            const buildingData = (await buildingsHelper.fetchBuildingById(
              apartment?.building
            )) as Buildings;

            return {
              ...apartment,
              ...buildingData,
            };
          })
        );

        if (apartmentWithBuilding) {
          dispatch({ type: SET_APARTMENTS, payload: apartmentWithBuilding });
          setApartmentsDispatched(true);
        }
      }
    } catch (error) {
      console.error('Error fetching apartments or buildings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (apartments && selectedBuilding && apartmentsDispatched) {
      setLoading(true);
      const apartmentsWithDistance = addDistance(apartments);
      if (apartmentsWithDistance) {
        dispatch({
          type: SET_APARTMENTS,
          payload: apartmentsWithDistance,
        });
        dispatch({
          type: SET_UNSORTED_APARTMENTS,
          payload: apartmentsWithDistance,
        });
        setDistanceAdded(true);
        setLoading(false);
      }
    }
  }, [selectedBuilding, apartmentsDispatched]);

  const addDistance = (apartments: Apartments[]) => {
    let campusWithDistance: Array<Buildings> = [];
    if (apartments) {
      apartments?.forEach((apartment: any) => {
        const distance = Number(
          calculateDistanceInMeter(
            selectedBuilding?.coordinates?.coordinates,
            apartment?.coordinates?.coordinates
          )
        );
        campusWithDistance.push({ ...apartment, distance });
      });
      if (campusWithDistance?.length === 0) {
        return apartments;
      }
      return campusWithDistance;
    }
  };

  const fetchSelectedBuilding = async () => {
    if (selectedCanteen?.building) {
      const buildingData = (await buildingsHelper.fetchBuildingById(
        selectedCanteen.building
      )) as Buildings;
      const building = buildingData || [];
      if (building) {
        setSelectedBuilding(building);
      }
    } else {
      toast('Please select canteen', 'error');
    }
  };

  useEffect(() => {
    fetchSelectedBuilding();
    fetchAllApartments();
  }, []);

  const updateSort = (id: string, apartments: Apartments[]) => {
    // Copy food offers to avoid mutation
    setLoading(true);
    let copiedApartments = [...apartments];

    // Sorting logic based on option id
    switch (id) {
      case 'intelligent':
        copiedApartments = sortApartmentsIntelligently(copiedApartments) || [];
        break;
      case 'alphabetical':
        copiedApartments = sortApartmentsAlphabetically(copiedApartments) || [];
        break;
      case 'distance':
        copiedApartments = sortApartmentsWithDistance(copiedApartments) || [];
        break;
      case 'free rooms':
        copiedApartments =
          sortApartmentsByAvailableDate(copiedApartments) || [];
        break;
      default:
        copiedApartments = unSortedApartments || [];
        break;
    }

    // Dispatch updated food offers and close the sheet
    dispatch({
      type: SET_APARTMENTS,
      payload: copiedApartments,
    });
    dispatch({
      type: SET_APARTMENTS_LOCAL,
      payload: copiedApartments,
    });
    setLoading(false);
  };

  const sortApartmentsIntelligently = (apartments: any[]) => {
    if (!apartments) return apartments;

    return apartments.sort((a, b) => {
      // Priority 1: Apartments marked as free (no `available_from`)
      const isFreeA = !a.available_from;
      const isFreeB = !b.available_from;

      if (isFreeA && !isFreeB) return -1; // Free apartments come first
      if (!isFreeA && isFreeB) return 1; // Non-free apartments come later

      // Priority 2: Sort by distance for non-free apartments
      return a.distance - b.distance;
    });
  };

  const sortApartmentsWithDistance = (apartments: Apartments[]) => {
    if (apartments) {
      return apartments?.sort((a: any, b: any) => a.distance - b.distance);
    } else {
      return apartments;
    }
  };

  const sortApartmentsAlphabetically = (apartments: Apartments[]) => {
    if (apartments) {
      return apartments?.sort((a: any, b: any) =>
        a.alias.localeCompare(b.alias)
      );
    } else {
      return apartments;
    }
  };

  const sortApartmentsByAvailableDate = (apartments: Apartments[]) => {
    if (!apartments) return apartments;

    return apartments.sort((a, b) => {
      const availableFromA = a.available_from
        ? new Date(a.available_from)
        : null;
      const availableFromB = b.available_from
        ? new Date(b.available_from)
        : null;

      if (availableFromA && availableFromB) {
        return availableFromA.getTime() - availableFromB.getTime();
      } else if (availableFromA) {
        return -1;
      } else if (availableFromB) {
        return 1;
      }
      return 0;
    });
  };

  useEffect(() => {
    if (apartments && distanceAdded) {
      updateSort(apartmentsSortBy, apartments);
    }
  }, [apartmentsSortBy, distanceAdded]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (query === '') {
        dispatch({
          type: SET_APARTMENTS,
          payload: apartmentsLocal,
        });
      } else {
        const filteredApartments = apartments?.filter((apartment) =>
          apartment?.alias?.toLowerCase()?.includes(query?.toLowerCase())
        );
        dispatch({
          type: SET_APARTMENTS,
          payload: filteredApartments,
        });
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [query]);

  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(Dimensions.get('window').width);
    };

    const subscription = Dimensions.addEventListener('change', handleResize);

    return () => subscription?.remove();
  }, []);

  const getContent = () => {
    // Regex patterns for different content types
    const contentPatterns = {
      email: /\[([^\]]+)]\((mailto:[^\)]+)\)/,
      link: /\[([^\]]+)]\((https?:\/\/[^\)]+)\)/,
      image: /!\[([^\]]*)]\(([^)]+)\)/,
      heading: /^#{1,3}\s*(.*)$/,
    };

    if (appSettings?.housing_translations) {
      const rawText = getTextFromTranslation(
        appSettings?.housing_translations,
        language
      );
      const lines = rawText.split('\n').filter((line) => line.trim() !== '');

      // Process content into a structured format
      const processContent = (lines: string[]) => {
        const result: any[] = [];
        let stack = [{ level: 0, items: result }];
        let currentText = '';

        const flushTextContent = () => {
          if (currentText.trim()) {
            stack[stack.length - 1].items.push({
              type: 'text',
              content: currentText.trim(),
            });
            currentText = '';
          }
        };

        lines.forEach((line) => {
          // Check for headings first
          const headingMatch = line.match(contentPatterns.heading);
          if (headingMatch) {
            flushTextContent();

            const level = headingMatch[0].match(/#/g)?.length || 1;
            const headerText = headingMatch[1].trim();

            // Close previous sections at this level or higher
            while (stack.length > 1 && stack[stack.length - 1].level >= level) {
              stack.pop();
            }

            const newSection = {
              type: 'collapsible',
              header: headerText,
              items: [],
              level,
            };

            stack[stack.length - 1].items.push(newSection);
            stack.push({ level, items: newSection.items });
            return;
          }

          // Check for other content types
          if (contentPatterns.image.test(line)) {
            flushTextContent();
            const match = line.match(contentPatterns.image);
            stack[stack.length - 1].items.push({
              type: 'image',
              altText: match?.[1] || '',
              url: match?.[2] || '',
            });
          } else if (contentPatterns.email.test(line)) {
            flushTextContent();
            const match = line.match(contentPatterns.email);
            stack[stack.length - 1].items.push({
              type: 'email',
              displayText: match?.[1],
              email: match?.[2],
            });
          } else if (contentPatterns.link.test(line)) {
            flushTextContent();
            const match = line.match(contentPatterns.link);
            stack[stack.length - 1].items.push({
              type: 'link',
              displayText: match?.[1],
              url: match?.[2],
            });
          } else {
            currentText += `${line}\n`;
          }
        });

        flushTextContent();
        return result;
      };

      // Component for rendering text with proper formatting
      const TextContent = ({
        text,
        level,
      }: {
        text: string;
        level: number;
      }) => (
        <Text
          style={{
            fontSize: 16,
            fontFamily: 'Poppins_400Regular',
            color: theme.screen.text,
            marginLeft: level * 16,
            marginBottom: 10,
            lineHeight: 24,
          }}
        >
          {text}
        </Text>
      );

      // Component for rendering images
      const ImageContent = ({
        url,
        altText,
        level,
      }: {
        url: string;
        altText: string;
        level: number;
      }) => (
        <View
          style={{
            marginLeft: level * 16,
            marginVertical: 10,
            backgroundColor: theme.screen.iconBg,
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          <Image
            source={{ uri: url }}
            style={{
              width: '100%',
              height: 400,
              resizeMode: 'cover',
            }}
            alt={altText}
          />
          {altText && (
            <Text
              style={{
                padding: 8,
                fontSize: 12,
                color: theme.screen.text,
                fontFamily: 'Poppins_400Regular',
              }}
            >
              {altText}
            </Text>
          )}
        </View>
      );

      // Main renderer for content items
      const renderContentItem = (item: any, level: number, index: number) => {
        switch (item.type) {
          case 'text':
            return (
              <TextContent
                key={`text-${level}-${index}`}
                text={item.content}
                level={level}
              />
            );

          case 'email':
            return (
              <View
                key={`email-${level}-${index}`}
                style={{ marginLeft: level * 16, marginBottom: 10 }}
              >
                <RedirectButton
                  type='email'
                  label={item.displayText}
                  onClick={() => Linking.openURL(`mailto:${item.email}`)}
                  backgroundColor={housing_area_color}
                  color={contrastColor}
                />
              </View>
            );

          case 'link':
            return (
              <View
                key={`link-${level}-${index}`}
                style={{ marginLeft: level * 16, marginBottom: 10 }}
              >
                <RedirectButton
                  type='link'
                  label={item.displayText}
                  onClick={() => Linking.openURL(item.url)}
                  backgroundColor={housing_area_color}
                  color={contrastColor}
                />
              </View>
            );

          case 'image':
            return (
              <ImageContent
                key={`image-${level}-${index}`}
                url={item.url}
                altText={item.altText}
                level={level}
              />
            );

          case 'collapsible':
            return (
              <View
                key={`collapsible-${level}-${index}`}
                style={{ marginTop: level > 0 ? 5 : 10 }}
              >
                <CustomCollapsible
                  headerText={item.header}
                  customColor={housing_area_color}
                >
                  {renderContent(item.items, level + 1)}
                </CustomCollapsible>
              </View>
            );

          default:
            return null;
        }
      };

      // Recursive content renderer
      const renderContent = (items: any[], level = 0) => {
        return items.map((item, index) =>
          renderContentItem(item, level, index)
        );
      };

      const hierarchicalContent = processContent(lines);
      return (
        <View style={{ paddingBottom: 20 }}>
          {renderContent(hierarchicalContent)}
        </View>
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.screen.background }}>
      <View style={{ ...styles.container }}>
        <View
          style={{
            ...styles.header,
            backgroundColor: theme.header.background,
            paddingHorizontal: isWeb ? 20 : 10,
          }}
        >
          <View
            style={[
              styles.row,
              {
                flexDirection:
                  drawerPosition === 'right' ? 'row-reverse' : 'row',
              },
            ]}
          >
            <View
              style={[
                styles.col1,
                {
                  flexDirection:
                    drawerPosition === 'right' ? 'row-reverse' : 'row',
                },
              ]}
            >
              <Tooltip
                placement='top'
                trigger={(triggerProps) => (
                  <TouchableOpacity
                    {...triggerProps}
                    onPress={() => drawerNavigation.toggleDrawer()}
                    style={{ padding: 10 }}
                  >
                    <Ionicons name='menu' size={24} color={theme.header.text} />
                  </TouchableOpacity>
                )}
              >
                <TooltipContent bg={theme.tooltip.background} py='$1' px='$2'>
                  <TooltipText fontSize='$sm' color={theme.tooltip.text}>
                    {`${t('open_drawer')}`}
                  </TooltipText>
                </TooltipContent>
              </Tooltip>

              <Text style={{ ...styles.heading, color: theme.header.text }}>
                {t('housing')}
              </Text>
            </View>
            <View style={{ ...styles.col2, gap: isWeb ? 30 : 15 }}>
              <Tooltip
                placement='top'
                trigger={(triggerProps) => (
                  <TouchableOpacity
                    {...triggerProps}
                    onPress={openSortSheet}
                    style={{ padding: 10 }}
                  >
                    <MaterialIcons
                      name='sort'
                      size={24}
                      color={theme.header.text}
                    />
                  </TouchableOpacity>
                )}
              >
                <TooltipContent bg={theme.tooltip.background} py='$1' px='$2'>
                  <TooltipText fontSize='$sm' color={theme.tooltip.text}>
                    {`${t('sort')}: ${t('apartments')}`}
                  </TooltipText>
                </TooltipContent>
              </Tooltip>
            </View>
          </View>
        </View>
        <ScrollView
          style={{
            ...styles.compusContainer,
            backgroundColor: theme.screen.background,
          }}
          contentContainerStyle={{
            ...styles.compusContentContainer,
            paddingHorizontal: isWeb ? 5 : 5,
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={{ width: '100%', padding: screenWidth > 600 ? 20 : 5 }}>
            {getContent()}
          </View>
          <View
            style={{
              ...styles.searchContainer,
              width: screenWidth > 768 ? '60%' : '100%',
              paddingHorizontal: screenWidth > 600 ? 20 : 5,
            }}
          >
            <TextInput
              style={[styles.searchInput, { color: theme.screen.text }]}
              cursorColor={theme.screen.text}
              placeholderTextColor={theme.screen.placeholder}
              onChangeText={setQuery}
              value={query}
              placeholder='Search campus here...'
            />
          </View>
          <View style={{ ...styles.campusContainer, gap: isWeb ? 10 : 10 }}>
            {loading ? (
              <View
                style={{
                  height: 200,
                  width: '100%',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <ActivityIndicator size={30} color={theme.screen.text} />
              </View>
            ) : apartments && apartments?.length > 0 ? (
              apartments?.map((apartment: any) => (
                <ApartmentItem
                  key={apartment.id}
                  apartment={apartment}
                  setSelectedApartementId={setSelectedApartementId}
                  openImageManagementSheet={openImageManagementSheet}
                />
              ))
            ) : (
              <View
                style={{
                  height: 200,
                  width: '100%',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: 'Poppins_400Regular',
                    color: theme.screen.text,
                  }}
                >
                  No Apartment Found
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
        {isActive && (
          <BottomSheet
            ref={sortSheetRef}
            index={-1}
            snapPoints={sortPoints}
            backgroundStyle={{
              ...styles.sheetBackground,
              backgroundColor: theme.sheet.sheetBg,
            }}
            enablePanDownToClose
            handleComponent={null}
            backdropComponent={(props) => <BottomSheetBackdrop {...props} />}
          >
            <BuildingSortSheet closeSheet={closeSortSheet} freeRooms={true} />
          </BottomSheet>
        )}

        {isActive && (
          <BottomSheet
            ref={imageManagementSheetRef}
            index={-1}
            snapPoints={imageManagementPoints}
            backgroundStyle={{
              ...styles.sheetBackground,
              backgroundColor: theme.sheet.sheetBg,
            }}
            handleComponent={null}
            enablePanDownToClose
            enableHandlePanningGesture={false}
            enableContentPanningGesture={false}
            backdropComponent={(props) => <BottomSheetBackdrop {...props} />}
          >
            <ImageManagementSheet
              closeSheet={closeImageManagementSheet}
              selectedFoodId={selectedApartmentId}
              handleFetch={() => {
                setApartmentsDispatched(false);
                fetchAllApartments();
              }}
              fileName='buildings'
            />
          </BottomSheet>
        )}
      </View>
    </SafeAreaView>
  );
};

export default index;
