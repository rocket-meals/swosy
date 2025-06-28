import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import styles from './styles';
import { Ionicons, Entypo } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKeys } from '@/locales/keys';
import useSetPageTitle from '@/hooks/useSetPageTitle';

const ExperimentalIndex = () => {
  useSetPageTitle(TranslationKeys.experimental);
  const { theme } = useTheme();
  const { translate } = useLanguage();

  return (
    <ScrollView
      style={{ ...styles.container, backgroundColor: theme.screen.background }}
      contentContainerStyle={{
        ...styles.contentContainer,
        backgroundColor: theme.screen.background,
      }}
    >
      <View style={{ ...styles.content }}>
        <TouchableOpacity
          style={{ ...styles.listItem, backgroundColor: theme.screen.iconBg }}
          onPress={() => router.navigate('/experimental/leaflet-map')}
        >
          <View style={styles.col}>
            <Ionicons name='map' color={theme.screen.icon} size={24} />
            <Text style={{ ...styles.body, color: theme.screen.text }}>
              {translate(TranslationKeys.leaflet_map)}
            </Text>
          </View>
          <Entypo name='chevron-small-right' color={theme.screen.icon} size={24} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default ExperimentalIndex;
