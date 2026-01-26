import { ActivityIndicator, SafeAreaView, ScrollView, View, useWindowDimensions } from 'react-native';
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useTheme } from '@/hooks/useTheme';
import styles from './styles';
import LocationInformation from '@/components/LocationInformation/LocationInformation';
import BuildingDescription from '@/components/BuildingDescription';
import { useLocalSearchParams } from 'expo-router';
import { useAppSelector } from '@/redux/hooks';
import { myContrastColor } from '@/helper/ColorHelper';
import { DatabaseTypes } from 'repo-depkit-common';
import { getImageUrl } from '@/constants/HelperFunctions';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKeys } from '@/locales/keys';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import { Image as ExpoImage } from 'expo-image';
import useLinkCoordinateModal from '@/hooks/useLinkCoordinateModal';
import DetailsImage from './components/DetailsImage';
import DetailsHeader from './components/DetailsHeader';
import DetailsTabs from './components/DetailsTabs';

const Details = () => {
  useSetPageTitle(TranslationKeys.building_details);
  const { theme } = useTheme();
  const { translate } = useLanguage();
  const { openLinkCoordinateModal } = useLinkCoordinateModal();
  const { id } = useLocalSearchParams();
  const { serverInfo, appSettings, primaryColor, selectedTheme: mode } = useAppSelector((state) => state.settings);
  const { campusesDict } = useAppSelector((state) => state.campus);
  const { width: screenWidth } = useWindowDimensions();
  
  const defaultImage = useMemo(() => getImageUrl(serverInfo?.info?.project?.project_logo), [serverInfo]);
  const [activeTab, setActiveTab] = useState<'information' | 'description'>('information');

  const campus_area_color = appSettings?.campus_area_color ? appSettings?.campus_area_color : primaryColor;
  const contrastColor = myContrastColor(campus_area_color, theme, mode === 'dark');

  const campusDetails = useMemo<DatabaseTypes.Buildings | null>(() => {
    if (!id) return null;
    const data = campusesDict[String(id)];
    return data || null;
  }, [campusesDict, id]);

  const imageSource = useMemo(() => {
    if (!campusDetails) return { uri: defaultImage };
    if (campusDetails?.image_remote_url || campusDetails?.image) {
      return { uri: (campusDetails?.image_remote_url as string) || getImageUrl(String(campusDetails?.image)) };
    }
    return { uri: defaultImage };
  }, [campusDetails, defaultImage]);

  useEffect(() => {
    let mounted = true;
    if (imageSource?.uri) {
        ExpoImage.prefetch?.(imageSource.uri).catch(() => {});
    }
    return () => {
      mounted = false;
    };
  }, [imageSource]);

  const handleOpenNavigation = useCallback(() => {
    if (!campusDetails) return;
    const point = campusDetails.coordinates as { coordinates?: [number, number] } | undefined | null;
    const coordinates = Array.isArray(point?.coordinates) ? point?.coordinates : undefined;
    if (!coordinates || coordinates.length !== 2) {
      console.error('Invalid coordinates');
      return;
    }
    const [longitude, latitude] = coordinates;
    openLinkCoordinateModal({
      latlon: { latitude, longitude },
    });
  }, [campusDetails, openLinkCoordinateModal]);

  const renderContent = useMemo(() => {
    if (activeTab === 'information') return <LocationInformation campusDetails={campusDetails} />;
    if (activeTab === 'description') return <BuildingDescription campusDetails={campusDetails} />;
    return null;
  }, [activeTab, campusDetails]);

  const themeStyles = useMemo(
    () => ({
      backgroundColor: campus_area_color,
      borderColor: campus_area_color,
      color: contrastColor,
    }),
    [campus_area_color, contrastColor]
  );

  // Determine if we should show loading. 
  // If we have an ID but no details yet, and we expect details (e.g. if dictionary is empty?), 
  // but campusesDict usually has data. 
  // For now, render immediately. If data is missing, it will show empty/default values.
  
  return (
    <SafeAreaView style={{ ...styles.safeAreaContainer, backgroundColor: theme.screen.background }}>
      <ScrollView
        style={{ ...styles.container, backgroundColor: theme.screen.background }}
        contentContainerStyle={{ ...styles.contentContainer, paddingHorizontal: screenWidth > 900 ? 20 : 10 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ ...styles.bulidingContainer, width: screenWidth > 1000 ? '80%' : '100%', flexDirection: 'column' }}>
            <DetailsImage imageSource={imageSource} screenWidth={screenWidth} />

            <View style={{ ...styles.detailsContainer, width: '100%' }}>
                <DetailsHeader 
                    alias={campusDetails?.alias} 
                    screenWidth={screenWidth}
                    theme={theme}
                    translate={translate}
                    onOpenNavigation={handleOpenNavigation}
                />

                <DetailsTabs
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    screenWidth={screenWidth}
                    theme={theme}
                    themeStyles={themeStyles}
                    contrastColor={contrastColor}
                    translate={translate}
                >
                    {renderContent}
                </DetailsTabs>
            </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Details;
