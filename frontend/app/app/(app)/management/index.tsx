import {
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useCallback } from 'react';
import styles from './styles';
import { useTheme } from '@/hooks/useTheme';
import {
  Entypo,
  FontAwesome,
  Ionicons,
  MaterialCommunityIcons,
} from '@expo/vector-icons';
import { router } from 'expo-router';
import { useDispatch } from 'react-redux';
import {
  SET_DAY_PLAN,
  SET_FOOD_PLAN,
  SET_WEEK_PLAN,
} from '@/redux/Types/types';
import { useLanguage } from '@/hooks/useLanguage';
import { useFocusEffect } from 'expo-router';

const index = () => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const dispatch = useDispatch();

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'web') {
        const title = 'Management';
        document.title = title;
      }
    }, [])
  );
  return (
    <ScrollView
      style={{
        ...styles.container,
        backgroundColor: theme.screen.background,
      }}
      contentContainerStyle={{
        ...styles.contentContainer,
        backgroundColor: theme.screen.background,
      }}
    >
      <View style={{ ...styles.content }}>
        <Text style={{ ...styles.heading, color: theme.screen.text }}>
          {t('statistiken')}
        </Text>
        <TouchableOpacity
          style={{ ...styles.listItem, backgroundColor: theme.screen.iconBg }}
          onPress={() => {
            router.navigate('/statistics');
          }}
        >
          <View style={styles.col}>
            <MaterialCommunityIcons
              name='calendar'
              color={theme.screen.icon}
              size={24}
            />
            <Text style={{ ...styles.body, color: theme.screen.text }}>
              {t('test_statistik')}
            </Text>
          </View>
          <Entypo
            name='chevron-small-right'
            color={theme.screen.icon}
            size={24}
          />
        </TouchableOpacity>
        <Text style={{ ...styles.heading, color: theme.screen.text }}>
          {t('monitore')}
        </Text>
        <TouchableOpacity
          style={{ ...styles.listItem, backgroundColor: theme.screen.iconBg }}
          onPress={() => {
            dispatch({
              type: SET_WEEK_PLAN,
              payload: {
                selectedCanteen: {},
                isAllergene: true,
              },
            });
            router.navigate('/foodPlanWeek');
          }}
        >
          <View style={styles.col}>
            <MaterialCommunityIcons
              name='calendar'
              color={theme.screen.icon}
              size={24}
            />
            <Text style={{ ...styles.body, color: theme.screen.text }}>
              {t('foodweekplan')}
            </Text>
          </View>
          <Entypo
            name='chevron-small-right'
            color={theme.screen.icon}
            size={24}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={{ ...styles.listItem, backgroundColor: theme.screen.iconBg }}
          onPress={() => {
            dispatch({
              type: SET_DAY_PLAN,
              payload: {
                selectedCanteen: {},
                mealOfferCategory: '',
                isMenuCategory: true,
                nextFoodInterval: 10,
                refreshInterval: 300,
                isFullScreen: true,
                foodCategory: '',
                isMenuCategoryName: true,
              },
            });
            router.navigate('/foodPlanDay');
          }}
        >
          <View style={styles.col}>
            <MaterialCommunityIcons
              name='folder-image'
              color={theme.screen.icon}
              size={24}
            />
            <Text style={{ ...styles.body, color: theme.screen.text }}>
              {t('foodBigScreen')}
            </Text>
          </View>
          <Entypo
            name='chevron-small-right'
            color={theme.screen.icon}
            size={24}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={{ ...styles.listItem, backgroundColor: theme.screen.iconBg }}
          onPress={() => {
            dispatch({
              type: SET_FOOD_PLAN,
              payload: {
                selectedCanteen: {},
                additionalSelectedCanteen: {},
                nextFoodInterval: 10,
                refreshInterval: 300,
              },
            });
            router.navigate('/foodPlanList');
          }}
        >
          <View style={styles.col}>
            <MaterialCommunityIcons
              name='view-list'
              color={theme.screen.icon}
              size={24}
            />
            <Text style={{ ...styles.body, color: theme.screen.text }}>
              {t('monitorDayPlan')}
            </Text>
          </View>
          <Entypo
            name='chevron-small-right'
            color={theme.screen.icon}
            size={24}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={{ ...styles.listItem, backgroundColor: theme.screen.iconBg }}
          onPress={() => {
            router.navigate('/labels');
          }}
        >
          <View style={styles.col}>
            <Ionicons name='bag-add' size={24} color={theme.screen.icon} />
            <Text style={{ ...styles.body, color: theme.screen.text }}>
              {t('markings')}
            </Text>
          </View>
          <Entypo
            name='chevron-small-right'
            color={theme.screen.icon}
            size={24}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={{ ...styles.listItem, backgroundColor: theme.screen.iconBg }}
          onPress={() => {
            router.navigate('/form-categories');
          }}
        >
          <View style={styles.col}>
            <FontAwesome name='list-alt' color={theme.screen.icon} size={22} />
            <Text style={{ ...styles.body, color: theme.screen.text }}>
              {t('form_categories')}
            </Text>
          </View>
          <Entypo
            name='chevron-small-right'
            color={theme.screen.icon}
            size={24}
          />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default index;
