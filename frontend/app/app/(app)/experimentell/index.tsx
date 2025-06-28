import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import React from 'react';
import styles from './styles';
import { useTheme } from '@/hooks/useTheme';
import { Entypo, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKeys } from '@/locales/keys';
import useSetPageTitle from '@/hooks/useSetPageTitle';

const index = () => {
  useSetPageTitle(TranslationKeys.experimentell);
  const { translate } = useLanguage();
  const { theme } = useTheme();

  return (
    <ScrollView
      style={{ ...styles.container, backgroundColor: theme.screen.background }}
      contentContainerStyle={{
        ...styles.contentContainer,
        backgroundColor: theme.screen.background,
      }}
    >
      <View style={{ ...styles.content }}>
        <Text style={{ ...styles.heading, color: theme.screen.text }}>
          {translate(TranslationKeys.experimentell)}
        </Text>
        <TouchableOpacity
          style={{ ...styles.listItem, backgroundColor: theme.screen.iconBg }}
          onPress={() => router.navigate('/experimentell/LeafletMap')}
        >
          <View style={styles.col}>
            <MaterialCommunityIcons name='map' color={theme.screen.icon} size={24} />
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

export default index;
