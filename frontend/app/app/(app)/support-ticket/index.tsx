import {
  ActivityIndicator,
  Dimensions,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useCallback, useEffect, useState } from 'react';
import styles from './styles';
import { useTheme } from '@/hooks/useTheme';
import { AppFeedback } from '@/redux/actions/AppFeedback/AppFeedback';
import { Entypo, MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { router, useFocusEffect } from 'expo-router';
import { useLanguage } from '@/hooks/useLanguage';

const index = () => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const appFeedback = new AppFeedback();
  const [loading, setLoading] = useState(false);
  const [allTickets, setAllTickets] = useState<any>(null);
  const [windowWidth, setWindowWidth] = useState(
    Dimensions.get('window').width
  );

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'web') {
        const title = t('my_support_tickets');
        document.title = title;
      }
    }, [])
  );

  const getAllTickets = async () => {
    setLoading(true);
    const allTickets = await appFeedback.fetchAppFeedback();
    if (allTickets) {
      setAllTickets(allTickets);
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      getAllTickets();
      return () => {};
    }, [])
  );

  useEffect(() => {
    const onChange = ({ window }: { window: any }) => {
      setWindowWidth(window.width);
    };

    const subscription = Dimensions.addEventListener('change', onChange);
    return () => {
      subscription.remove();
    };
  }, []);
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.screen.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      {loading ? (
        <View
          style={{
            width: '100%',
            height: 400,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <ActivityIndicator size='large' color={theme.screen.text} />
        </View>
      ) : (
        <View
          style={[styles.section, { width: windowWidth > 600 ? '85%' : '95%' }]}
        >
          {allTickets &&
            allTickets?.map((item: any, index: number) => (
              <TouchableOpacity
                style={{ ...styles.row, backgroundColor: theme.screen.iconBg }}
                onPress={() => {
                  router.push(`/feedback-support?app_feedbacks_id=${item.id}`);
                }}
                key={index}
              >
                <View style={styles.leftView}>
                  <MaterialCommunityIcons
                    name={'bell'}
                    size={25}
                    color={theme.screen.icon}
                  />
                  <Text
                    style={[
                      styles.linkText,
                      {
                        color: theme.screen.text,
                        fontSize: windowWidth < 500 ? 14 : 18,
                      },
                    ]}
                  >
                    {item?.title}
                  </Text>
                </View>
                <View style={styles.textIcon}>
                  <Text
                    style={[
                      styles.iconText,
                      {
                        color: theme.screen.text,
                        fontSize: windowWidth < 500 ? 14 : 18,
                      },
                    ]}
                  >
                    {item?.date_created
                      ? format(new Date(item.date_created), 'dd.MM.yyyy HH:mm')
                      : 'N/A'}
                  </Text>
                  <Entypo
                    name={'chevron-small-right'}
                    size={25}
                    color={theme.screen.icon}
                  />
                </View>
              </TouchableOpacity>
            ))}
        </View>
      )}
    </ScrollView>
  );
};

export default index;
