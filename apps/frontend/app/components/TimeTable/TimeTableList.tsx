import { Dimensions, Text, TouchableOpacity, View } from 'react-native';
import React, { useEffect, useState } from 'react';
import styles from './styles';
import { useTheme } from '@/hooks/useTheme';
import { isWeb } from '@/constants/Constants';
import { Feather, FontAwesome5, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { TimeTableListProps } from './types';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';

type TimeTableListRowTheme = {
	screen: {
		icon: string;
		text: string;
	};
};

const renderTimeTableListRow = (
	icon: React.ReactNode,
	labelText: string,
	valueText: string,
	windowWidth: number,
	theme: TimeTableListRowTheme,
	key: string
) => {
	return (
		<TouchableOpacity
			key={key}
			style={{
				...styles.list,
				paddingHorizontal: isWeb ? 20 : 10,
			}}
		>
			<View style={{ ...styles.col, gap: isWeb ? 10 : 5 }}>
				{icon}
				<Text
					style={{
						...styles.label,
						color: theme.screen.text,
						fontSize: windowWidth > 500 ? 16 : 13,
					}}
				>
					{labelText}
				</Text>
			</View>
			<View
				style={{
					...styles.col,
					gap: isWeb ? 10 : 5,
					alignItems: 'center',
					justifyContent: 'flex-end',
				}}
			>
				<Text
					style={{
						...styles.value,
						color: theme.screen.text,
						fontSize: windowWidth > 500 ? 16 : 13,
					}}
				>
					{valueText}
				</Text>
				<FontAwesome5 name="pen" size={20} color={theme.screen.icon} />
			</View>
		</TouchableOpacity>
	);
};

const TimeTableList: React.FC<TimeTableListProps> = ({ leftIcon, label, rightIcon, value, handleFunction }) => {
	const { theme } = useTheme();
	const [windowWidth, setWindowWidth] = useState(Dimensions.get('window').width);

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
		<BottomSheetScrollView style={{ ...styles.sheetView, backgroundColor: theme.sheet.sheetBg }} contentContainerStyle={styles.contentContainer}>
			{renderTimeTableListRow(
				<MaterialCommunityIcons name="tag-text-outline" size={24} color={theme.screen.icon} />,
				'Title',
				'New',
				windowWidth,
				theme,
				'title'
			)}
			{renderTimeTableListRow(
				<MaterialCommunityIcons name="tag-text-outline" size={24} color={theme.screen.icon} />,
				'Location',
				'',
				windowWidth,
				theme,
				'location'
			)}
			{renderTimeTableListRow(
				<MaterialIcons name="color-lens" size={24} color={theme.screen.icon} />,
				'Colors',
				'#fff',
				windowWidth,
				theme,
				'colors'
			)}

			{renderTimeTableListRow(
				<MaterialCommunityIcons name="clock-start" size={24} color={theme.screen.icon} />,
				'Start Time',
				'08:00',
				windowWidth,
				theme,
				'start-time'
			)}

			{renderTimeTableListRow(
				<MaterialCommunityIcons name="clock-end" size={24} color={theme.screen.icon} />,
				'End Time',
				'10:00',
				windowWidth,
				theme,
				'end-time'
			)}

			{renderTimeTableListRow(
				<Feather name="calendar" size={24} color={theme.screen.icon} />,
				'Week Days',
				'Monday',
				windowWidth,
				theme,
				'week-days'
			)}

			{/* <TouchableOpacity
        style={{
          ...styles.list,
          //   backgroundColor: theme.screen.iconBg,
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
      </TouchableOpacity> */}
		</BottomSheetScrollView>
	);
};

export default TimeTableList;
