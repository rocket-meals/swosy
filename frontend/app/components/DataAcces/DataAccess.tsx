import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  Dimensions,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import styles from './styles';
import { useTheme } from '@/hooks/useTheme';
import { isWeb } from '@/constants/Constants';
import { useSelector } from 'react-redux';
import { Entypo } from '@expo/vector-icons';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKeys } from '@/locales/keys';
import { RootState } from '@/redux/reducer';

const parseMarkdown = (text: string, theme: any) => {
  return text.split('\n').map((line, index) => {
    if (line.startsWith('## ')) {
      return (
        <Text key={index} style={[styles.value, { color: theme.header.text }]}>
          {line.replace('## ', '')}
        </Text>
      );
    } else if (line.startsWith('### ')) {
      return (
        <Text
          key={index}
          style={[styles.labelParagraph, { color: theme.header.text }]}
        >
          {line.replace('### ', '')}
        </Text>
      );
    } else {
      return (
        <Text
          key={index}
          style={[styles.titleHeading, { color: theme.header.text }]}
        >
          {line}
        </Text>
      );
    }
  });
};

const DataAccess = ({ onOpenBottomSheet }: any) => {
  const { theme } = useTheme();
  const { translate } = useLanguage();
  const { user, profile } = useSelector(
    (state: RootState) => state.authReducer
  );
  const {
    canteens,
    buildings,
    selectedCanteenFoodOffers,
    canteenFoodOffers,
    businessHours,
    canteenFeedbackLabels,
    ownCanteenFeedBackLabelEntries,
  } = useSelector((state: RootState) => state.canteenReducer);

  const {
    foodFeedbackLabels,
    ownFoodFeedbacks,
    ownfoodFeedbackLabelEntries,
    markings,
    selectedFoodMarkings,
    foodCategories,
    foodOfferCategories,
    markingDetails,
  } = useSelector((state: RootState) => state.food);

  const [windowWidth, setWindowWidth] = useState(
    Dimensions.get('window').width
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

  const dataAccessText = translate(TranslationKeys.data_access_introduction);

  const infoItems = [
    { label: 'account', value: user },
    { label: 'profile', value: profile },
    { label: 'food_feedbacks', value: ownFoodFeedbacks },
  ];

  const dataDevice = [
    { label: 'canteens', value: canteens },
    { label: 'buildings', value: buildings },
    { label: 'Selected Canteen FoodOffers', value: selectedCanteenFoodOffers },
    { label: 'Canteen FoodOffers', value: canteenFoodOffers },
    { label: 'Business Hours', value: businessHours },
    { label: 'Canteen FeedbackLabels', value: canteenFeedbackLabels },
    {
      label: 'Own Canteen FeedBack Label Entries',
      value: ownCanteenFeedBackLabelEntries,
    },
    { label: 'Food FeedbackLabels', value: foodFeedbackLabels },
    { label: 'Own FoodFeedbacks', value: ownFoodFeedbacks },
    {
      label: 'Own Food Feedback Label Entries',
      value: ownfoodFeedbackLabelEntries,
    },
    { label: 'Markings', value: markings },
    { label: 'Selected Food Markings', value: selectedFoodMarkings },
    { label: 'Food Categories', value: foodCategories },
    { label: 'FoodOffer Categories', value: foodOfferCategories },
    { label: 'MarkingDetails', value: markingDetails },
  ];

  return (
    <View
      style={{ ...styles.container, backgroundColor: theme.screen.background }}
    >
      <ScrollView>
        <View style={{ alignItems: 'center' }}>
          <View style={styles.imageContainer}>
            <Image
              source={require('../../assets/images/dataAccess.png')}
              style={styles.image}
            />
          </View>

          <View
            style={[
              styles.infoContainer,
              { width: windowWidth > 600 ? '85%' : '90%' },
            ]}
          >
            <View>{parseMarkdown(dataAccessText, theme)}</View>
          </View>

          <View
            style={[
              styles.infoContainer,
              { width: windowWidth > 600 ? '90%' : '100%' },
            ]}
          >
            <View>
              <Text
                style={{ ...styles.labelParagraph, color: theme.header.text }}
              >
                {translate(
                  TranslationKeys.your_data_which_we_know_if_you_have_a_profile
                )}
              </Text>
            </View>
            {/* Info Items List */}
            <View style={styles.infoContainer}>
              {infoItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.infoRow,
                    {
                      backgroundColor: theme.screen.iconBg,
                      paddingHorizontal: isWeb ? 20 : 10,
                      paddingVertical: isWeb ? 20 : 10,
                    },
                  ]}
                  onPress={() => onOpenBottomSheet(item)}
                >
                  <View style={styles.iconLabelContainer}>
                    <Text
                      style={{
                        ...styles.label,
                        color: theme.header.text,
                        fontSize: windowWidth < 500 ? 16 : 18,
                      }}
                    >
                      {translate(item.label)}
                    </Text>
                  </View>
                  <Entypo
                    name='chevron-small-right'
                    size={25}
                    color={theme.screen.icon}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Device Data List */}
            <View style={styles.infoContainer}>
              <View>
                <Text
                  style={{
                    marginBottom: 10,
                    fontSize: 16,
                    color: theme.header.text,
                  }}
                >
                  {translate(
                    TranslationKeys.translation_all_on_device_saved_data
                  )}
                </Text>
              </View>
              {dataDevice.map((data, index) => {
                if (data?.value) {
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.infoRow,
                        {
                          backgroundColor: theme.screen.iconBg,
                          paddingHorizontal: isWeb ? 20 : 10,
                          paddingVertical: isWeb ? 20 : 10,
                        },
                      ]}
                      onPress={() => onOpenBottomSheet(data)}
                    >
                      <View style={styles.iconLabelContainer}>
                        <Text
                          style={{
                            ...styles.label,
                            color: theme.header.text,
                            fontSize: windowWidth < 500 ? 16 : 18,
                          }}
                        >
                          {data.label}
                        </Text>
                      </View>
                      <Entypo
                        name='chevron-small-right'
                        size={25}
                        color={theme.screen.icon}
                      />
                    </TouchableOpacity>
                  );
                }
              })}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default DataAccess;
