import React from 'react';
import { View, Text, Image } from 'react-native';
import { useSelector } from 'react-redux';
import { useTheme } from '@/hooks/useTheme';
import { useMyContrastColor } from '@/helper/colorHelper';
import { iconLibraries } from '../Drawer/CustomDrawerContent';
import { getImageUrl } from '@/constants/HelperFunctions';
import styles from './styles';
import { Markings } from '@/constants/types';
import { RootState } from '@/redux/reducer';

interface MarkingIconProps {
  marking: Markings;
  size?: number;
  color?: string;
}

const MarkingIcon: React.FC<MarkingIconProps> = ({ marking, size = 24, color }) => {
  const { theme } = useTheme();
  const { selectedTheme: mode } = useSelector((state: RootState) => state.settings);

  if (!marking) return null;

  const markingImage = marking.image_remote_url
    ? { uri: marking.image_remote_url }
    : marking.image
    ? { uri: getImageUrl(String(marking.image)) }
    : null;

  const bgColor = marking.background_color;
  const contrast = useMyContrastColor(bgColor, theme, mode === 'dark');
  const textColor = color || contrast;

  const iconParts = marking.icon?.split(':') || [];
  const [library, iconName] = iconParts;
  const Icon = library && iconLibraries[library];

  const isTextOnly =
    !!marking.short_code && !markingImage?.uri && !Icon;

  const containerStyle = [
    styles.container,
    {
      width: isTextOnly ? undefined : size,
      minWidth: size,
      height: size,
      backgroundColor: bgColor || 'transparent',
      borderWidth: marking.hide_border ? 0 : 1,
      borderColor: textColor,
      borderRadius: bgColor ? 8 : 0,
      paddingHorizontal: isTextOnly ? 4 : undefined,
    },
  ];

  if (markingImage?.uri) {
    return (
      <View style={containerStyle}>
        <Image
          source={markingImage}
          style={{ width: size, height: size, resizeMode: 'contain', borderRadius: bgColor ? 8 : 0 }}
        />
      </View>
    );
  }

  if (Icon) {
    return (
      <View style={containerStyle}>
        <Icon name={iconName} size={size * 0.8} color={textColor} />
      </View>
    );
  }

  if (marking.short_code) {
    return (
      <View style={containerStyle}>
        <Text style={{ color: textColor, fontSize: size * 0.65, lineHeight: size * 0.8 }}>
          {marking.short_code}
        </Text>
      </View>
    );
  }

  return null;
};

export default MarkingIcon;
