import {
  Text,
  View,
  Image,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
} from 'react-native';
import React, { useEffect } from 'react';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { FontAwesome6 } from '@expo/vector-icons';
import { Octicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { useTheme } from '@/hooks/useTheme';
import { styles } from './styles';
import { useDispatch, useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import {
  CLEAR_ANONYMOUSLY,
  CLEAR_APARTMENTS,
  CLEAR_CAMPUSES,
  CLEAR_CANTEENS,
  CLEAR_COLLECTION_DATES_LAST_UPDATED,
  CLEAR_FOODS,
  CLEAR_MANAGEMENT,
  CLEAR_NEWS,
  CLEAR_SETTINGS,
  ON_LOGOUT,
  SET_WIKIS,
} from '@/redux/Types/types';
import { getImageUrl } from '@/constants/HelperFunctions';
import { useLanguage } from '@/hooks/useLanguage';
import * as Linking from 'expo-linking';
import useToast from '@/hooks/useToast';
import { getTitleFromTranslation } from '@/helper/resourceHelper';
import { WikisHelper } from '@/redux/actions/Wikis/Wikis';
import { Wikis } from '@/constants/types';
import { IconProps } from '@expo/vector-icons/build/createIconSet';
import { AntDesign } from '@expo/vector-icons';
import { Feather } from '@expo/vector-icons';
import { FontAwesome } from '@expo/vector-icons';
import { Entypo } from '@expo/vector-icons';
import { EvilIcons } from '@expo/vector-icons';
import { Foundation } from '@expo/vector-icons';
import { SimpleLineIcons } from '@expo/vector-icons';
import { Zocial } from '@expo/vector-icons';
import { myContrastColor } from '@/helper/colorHelper';
import { TranslationKeys } from '@/locales/keys';
import { RootState } from '@/redux/reducer';

export const iconLibraries: Record<string, any> = {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
  FontAwesome6,
  FontAwesome,
  Octicons,
  AntDesign,
  Feather,
  Entypo,
  EvilIcons,
  Foundation,
  SimpleLineIcons,
  Zocial,
};

interface MenuItemProps {
  label: string;
  iconName: string;
  iconLibName: React.ComponentType<IconProps<any>>;
  activeKey: string;
  route?: string;
  action?: () => void;
  position: number;
}

const CustomDrawerContent: React.FC<DrawerContentComponentProps> = ({
  navigation,
  state,
}) => {
  const { translate } = useLanguage();
  const toast = useToast();
  const { theme } = useTheme();
  const dispatch = useDispatch();
  const router = useRouter();
  const wikisHelper = new WikisHelper();
  const activeIndex = state.index;
  const { user, isManagement } = useSelector(
    (state: RootState) => state.authReducer
  );
  const {
    serverInfo,
    primaryColor: projectColor,
    language,
    appSettings,
    wikis,
    selectedTheme: mode,
  } = useSelector((state: RootState) => state.settings);

  const balance_area_color = appSettings?.balance_area_color
    ? appSettings?.balance_area_color
    : projectColor;
  const course_timetable_area_color = appSettings?.course_timetable_area_color
    ? appSettings?.course_timetable_area_color
    : projectColor;
  const campus_area_color = appSettings?.campus_area_color
    ? appSettings?.campus_area_color
    : projectColor;
  const foods_area_color = appSettings?.foods_area_color
    ? appSettings?.foods_area_color
    : projectColor;
  const housing_area_color = appSettings?.housing_area_color
    ? appSettings?.housing_area_color
    : projectColor;
  const news_area_color = appSettings?.news_area_color
    ? appSettings?.news_area_color
    : projectColor;

  const contrastColor = myContrastColor(
    housing_area_color,
    theme,
    mode === 'dark'
  );

  const isActive = (routeName: string) => {
    const activeRoute = state.routes[activeIndex].name;
    return activeRoute === routeName;
  };

  const getMenuItemStyle = (routeName: string) => {
    let activeBackgroundColor = 'transparent';

    if (isActive(routeName)) {
      switch (routeName) {
        case 'account-balance/index':
          activeBackgroundColor = balance_area_color;
          break;
        case 'course-timetable/index':
          activeBackgroundColor = course_timetable_area_color;
          break;
        case 'campus':
          activeBackgroundColor = campus_area_color;
          break;
        case 'foodoffers':
          activeBackgroundColor = foods_area_color;
          break;
        case 'housing':
          activeBackgroundColor = housing_area_color;
          break;
        case 'news/index':
          activeBackgroundColor = news_area_color;
          break;
        default:
          activeBackgroundColor = projectColor;
          break;
      }
    }

    return {
      ...styles.menuItem,
      backgroundColor: activeBackgroundColor,
    };
  };

  const getMenuLabelStyle = (routeName: string) => ({
    ...styles.menuLabel,
    color: isActive(routeName) ? contrastColor : theme.inactiveText,
  });

  const handleLogout = async () => {
    try {
      await AsyncStorage.clear();
      dispatch({ type: ON_LOGOUT });
      dispatch({ type: CLEAR_CANTEENS });
      dispatch({ type: CLEAR_CAMPUSES });
      dispatch({ type: CLEAR_APARTMENTS });
      dispatch({ type: CLEAR_FOODS });
      dispatch({ type: CLEAR_MANAGEMENT });
      dispatch({ type: CLEAR_NEWS });
      dispatch({ type: CLEAR_SETTINGS });
      dispatch({ type: CLEAR_COLLECTION_DATES_LAST_UPDATED });
      router.push({ pathname: '/(auth)/login', params: { logout: 'true' } });
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const openInBrowser = async (url: string) => {
    try {
      if (Platform.OS === 'web') {
        window.open(url, '_blank');
      } else {
        const supported = await Linking.canOpenURL(url);

        if (supported) {
          await Linking.openURL(url);
        } else {
          toast(`Cannot open URL: ${url}`, 'error');
        }
      }
    } catch (error) {
      console.error('An error occurred:', error);
    }
  };

  const getWikis = async () => {
    try {
      const response = (await wikisHelper.fetchWikis()) as Wikis[];
      if (response) {
        dispatch({ type: SET_WIKIS, payload: response });
      }
    } catch (error) {
      console.error('Error fetching wikis:', error);
    }
  };

  useEffect(() => {
    getWikis();
  }, []);

  const generateMenuItems = (): MenuItemProps[] => {
    let menuItems: MenuItemProps[] = [];

    // Static menu items with positions
    if (appSettings?.foods_enabled) {
      menuItems.push({
        label: translate(TranslationKeys.canteens),
        iconName: 'restaurant-sharp',
        iconLibName: Ionicons,
        activeKey: 'foodoffers',
        route: 'foodoffers',
        position: 2,
      });
    }

    if (appSettings?.balance_enabled) {
      menuItems.push({
        label: translate(TranslationKeys.accountbalance),
        iconName: 'credit-card',
        iconLibName: Octicons,
        activeKey: 'account-balance/index',
        route: 'account-balance/index',
        position: 3,
      });
    }

    if (appSettings?.campus_enabled) {
      menuItems.push({
        label: translate(TranslationKeys.campus),
        iconName: 'mortar-board',
        iconLibName: Octicons,
        activeKey: 'campus',
        route: 'campus',
        position: 4,
      });
    }

    if (appSettings?.housing_enabled) {
      menuItems.push({
        label: translate(TranslationKeys.housing),
        iconName: 'home',
        iconLibName: Octicons,
        activeKey: 'housing',
        route: 'housing',
        position: 5,
      });
    }

    if (appSettings?.news_enabled) {
      menuItems.push({
        label: translate(TranslationKeys.news),
        iconName: 'newspaper',
        iconLibName: FontAwesome6,
        activeKey: 'news/index',
        route: 'news/index',
        position: 6,
      });
    }

    if (appSettings?.course_timetable_enabled) {
      menuItems.push({
        label: translate(TranslationKeys.course_timetable),
        iconName: 'calendar-clock-outline',
        iconLibName: MaterialCommunityIcons,
        activeKey: 'course-timetable/index',
        route: 'course-timetable/index',
        position: 7,
      });
    }

    if (isManagement) {
      menuItems.push({
        label: translate(TranslationKeys.role_management),
        iconName: 'bag',
        iconLibName: Ionicons,
        activeKey: 'management/index',
        route: 'management/index',
        position: 8,
      });
    }

    // Add Wikis dynamically with position sorting
    if (wikis) {
      const wikiMenuItems = wikis
        .filter((wiki: any) => wiki.show_in_drawer) // Only show relevant wikis
        .map((wiki: any) => {
          let iconLib: any = Entypo;
          let iconName = 'home';

          if (wiki?.icon) {
            const [library, name] = wiki.icon.split(':');
            if (iconLibraries[library]) {
              iconLib = iconLibraries[library]; // Assign the library dynamically
              iconName = name;
            }
          }

          return {
            label: getTitleFromTranslation(wiki?.translations, language),
            iconName,
            iconLibName: iconLib,
            activeKey: 'faq-food/index',
            position: wiki.position ?? Number.MAX_SAFE_INTEGER,
            action: wiki.url
              ? () => openInBrowser(wiki?.url)
              : () =>
                  router.push({
                    pathname: '/wikis',
                    params: wiki?.custom_id
                      ? { custom_id: wiki?.custom_id }
                      : { id: wiki?.id },
                  }),
          };
        });

      menuItems = [...menuItems, ...wikiMenuItems];
    }

    // Sort menu items by position (smallest first)
    menuItems.sort((a, b) => a.position - b.position);

    return menuItems;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.screen.iconBg }}>
      <ScrollView
        style={{ ...styles.container, backgroundColor: theme.drawerBg }}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.content}>
          <TouchableOpacity
            style={styles.header}
            onPress={() => navigation.navigate('foodoffers')}
          >
            <View style={styles.logoContainer}>
              <Image
                source={{
                  uri: getImageUrl(serverInfo?.info?.project?.project_logo),
                }}
                style={styles.logo}
              />
            </View>
            <Text style={{ ...styles.heading, color: theme.drawerHeading }}>
              {serverInfo?.info?.project?.project_name || 'SWOSY 2.0'}
            </Text>
          </TouchableOpacity>
          <View style={styles.menuContainer}>
            {generateMenuItems().map((item, index) => (
              <TouchableOpacity
                key={index}
                style={getMenuItemStyle(item.activeKey)}
                onPress={() =>
                  item.route ? navigation.navigate(item.route) : item.action?.()
                }
              >
                <item.iconLibName
                  name={item.iconName}
                  size={24}
                  color={
                    isActive(item.activeKey)
                      ? contrastColor
                      : theme.inactiveIcon
                  }
                />
                <Text style={getMenuLabelStyle(item.activeKey)}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
            <View style={styles.divider} />
            <TouchableOpacity
              style={getMenuItemStyle('settings/index')}
              onPress={() => navigation.navigate('settings/index')}
            >
              <Ionicons
                name='settings-outline'
                size={28}
                color={
                  isActive('settings/index')
                    ? theme.activeIcon
                    : theme.inactiveIcon
                }
              />
              <Text style={getMenuLabelStyle('settings/index')}>
                {translate(TranslationKeys.settings)}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={getMenuItemStyle('faq-living/index')}
              onPress={() => {
                if (user?.id) {
                  handleLogout();
                } else {
                  dispatch({ type: CLEAR_ANONYMOUSLY });
                  dispatch({ type: CLEAR_ANONYMOUSLY });
                  dispatch({ type: CLEAR_CANTEENS });
                  dispatch({ type: CLEAR_CAMPUSES });
                  dispatch({ type: CLEAR_APARTMENTS });
                  dispatch({ type: CLEAR_FOODS });
                  dispatch({ type: CLEAR_NEWS });
                  dispatch({ type: CLEAR_SETTINGS });
                  router.push({
                    pathname: '/(auth)/login',
                    params: { logout: 'true' },
                  });
                }
              }}
            >
              <MaterialCommunityIcons
                name='logout'
                size={28}
                color={theme.inactiveIcon}
              />
              <Text style={getMenuLabelStyle('faq-living/index')}>
                {translate(TranslationKeys.logout)}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          {wikis &&
            wikis?.map((wiki: any, index: number) => {
              if (
                wiki?.custom_id &&
                !wiki?.url &&
                wiki?.show_in_drawer_as_bottom_item
              ) {
                return (
                  <>
                    <TouchableOpacity
                      onPress={() =>
                        router.push({
                          pathname: '/wikis',
                          params: { custom_id: wiki?.custom_id },
                        })
                      }
                    >
                      <Text
                        style={{ ...styles.link, color: theme.drawer.link }}
                      >
                        {getTitleFromTranslation(wiki?.translations, language)}
                      </Text>
                    </TouchableOpacity>
                    {index + 1 < wikis?.length - 1 && (
                      <Text style={{ ...styles.bar, color: theme.drawer.link }}>
                        |
                      </Text>
                    )}
                  </>
                );
              }
            })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CustomDrawerContent;
