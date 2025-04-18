import { Dimensions, Text, TouchableOpacity, View } from 'react-native';
import React, { useEffect, useState } from 'react';
import styles from './styles';
import { useTheme } from '@/hooks/useTheme';
import { isWeb } from '@/constants/Constants';
import { Ionicons, Octicons } from '@expo/vector-icons';
import { SettingListProps } from './types';

const SettingList: React.FC<SettingListProps> = ({
  leftIcon,
  label,
  rightIcon,
  value,
  handleFunction,
}) => {
  const { theme } = useTheme();
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

  return (
    <TouchableOpacity
      style={{
        ...styles.list,
        backgroundColor: theme.screen.iconBg,
        paddingHorizontal: isWeb ? 20 : 10,
      }}
      onPress={handleFunction}
    >
      <View style={{ ...styles.col, gap: isWeb ? 10 : 5 }}>
        {leftIcon}
        <Text
          style={{
            ...styles.label,
            color: theme.screen.text,
            fontSize: windowWidth > 500 ? 16 : 13,
            marginTop: isWeb ? 0 : 2,
          }}
        >
          {label}
        </Text>
      </View>
      <View
        style={{
          ...styles.col,
          gap: isWeb ? 10 : 5,
          alignItems: 'center',
          // backgroundColor: 'red',
          justifyContent: 'flex-end',
        }}
      >
        {value && (
          <Text
            style={{
              ...styles.value,
              color: theme.screen.text,
              fontSize: windowWidth > 500 ? 16 : 13,
              marginTop: isWeb ? 0 : 2,
            }}
          >
            {value}
          </Text>
        )}
        {rightIcon}
      </View>
    </TouchableOpacity>
  );
};

export default SettingList;
