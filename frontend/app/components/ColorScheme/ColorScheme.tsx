import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { isWeb } from '@/constants/Constants';
import { useSelector } from 'react-redux';
import { useLanguage } from '@/hooks/useLanguage';
import { RootState } from '@/redux/reducer';
// Define the type for the theme prop
type Theme = {
  id: string;
  name: string;
  icon: string;
};

// Define the props for the component
type ColorSchemeProps = {
  theme: Theme;
  isSelected: boolean;
  onPress: () => void;
};

const ColorScheme: React.FC<ColorSchemeProps> = ({
  theme,
  isSelected,
  onPress,
}) => {
  const { theme: themes } = useTheme();
  const { primaryColor } = useSelector((state: RootState) => state.settings);
  const { translate } = useLanguage();
  return (
    <TouchableOpacity
      style={{
        ...styles.row,
        paddingHorizontal: isWeb ? 20 : 10,
        backgroundColor: isSelected ? primaryColor : themes.screen.iconBg,
      }}
      onPress={onPress}
    >
      {/* Theme Icon */}
      <MaterialCommunityIcons
        name={theme.icon}
        size={24}
        color={isSelected ? themes.activeText : themes.screen.icon}
        style={styles.icon}
      />

      {/* Theme Text */}
      <Text
        style={{
          ...styles.text,
          color: isSelected ? themes.activeText : themes.header.text,
        }}
      >
        {translate(theme.name)}
      </Text>

      {/* Radio Button */}
      <MaterialCommunityIcons
        name={isSelected ? 'checkbox-marked' : 'checkbox-blank'}
        size={24}
        color={isSelected ? '#ffffff' : '#ffffff'}
        style={styles.radioButton}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  row: {
    marginTop: 10,
    width: '100%',
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
  },
  icon: {
    marginRight: 10,
  },
  text: {
    flex: 1,
    fontSize: 16,
    color: 'black',
  },
  radioButton: {
    marginLeft: 'auto',
  },
});

export default ColorScheme;
