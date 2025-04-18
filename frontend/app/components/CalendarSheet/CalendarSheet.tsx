import { Text, TouchableOpacity, View } from 'react-native';
import React, { useState } from 'react';
import styles from './styles';
import { useTheme } from '@/hooks/useTheme';
import { CalendarSheetProps, Direction } from './types';
import { BottomSheetView } from '@gorhom/bottom-sheet';
import { isWeb } from '@/constants/Constants';
import { AntDesign } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { useSelector } from 'react-redux';
import { useLanguage } from '@/hooks/useLanguage';
import { myContrastColor } from '@/helper/colorHelper';
const CalendarSheet: React.FC<CalendarSheetProps> = ({
  closeSheet,
  selected,
  setSelected,
}) => {
  const { theme } = useTheme();
  const { t } = useLanguage()
  const { primaryColor,appSettings} = useSelector((state: any) => state.settings);
  const mode = useSelector((state: any) => state.settings.theme);
  const foods_area_color = appSettings?.foods_area_color
    ? appSettings?.foods_area_color
    : primaryColor;
    const contrastColor = myContrastColor(
      foods_area_color,
      theme,
      mode === 'dark'
    );
 

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const navigateMonth = (direction: 'next' | 'prev') => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(
      currentMonth.getMonth() + (direction === 'next' ? 1 : -1)
    );
    setCurrentMonth(newMonth);
  };

  return (
    <BottomSheetView
      style={{ ...styles.container, backgroundColor: theme.sheet.sheetBg }}
    >
      <View
        style={{
          ...styles.sheetHeader,
          paddingRight: isWeb ? 10 : 0,
          paddingTop: isWeb ? 10 : 0,
        }}
      >
        <View />
        <Text
          style={{
            ...styles.sheetHeading,
            fontSize: isWeb ? 40 : 28,
            color: theme.sheet.text,
          }}
        >
          {t('select')} : {t('date')}
        </Text>
        <TouchableOpacity
          style={{
            ...styles.sheetcloseButton,
            backgroundColor: theme.sheet.closeBg,
          }}
          onPress={closeSheet}
        >
          <AntDesign name='close' size={24} color={theme.sheet.closeIcon} />
        </TouchableOpacity>
      </View>

      <View
        style={{
          ...styles.calendarView,
          width: isWeb ? '90%' : '100%',
          marginTop: isWeb ? 40 : 20,
        }}
      >
        <Calendar
          key={currentMonth.toISOString()}
          style={styles.calendar}
          current={currentMonth.toISOString().split('T')[0]}
          onDayPress={(day: any) => {
            setSelected(day.dateString);
          }}
          markedDates={{
            [selected]: {
              selected: true,
              disableTouchEvent: true,
              selectedDotColor: foods_area_color,
            },
          }}
          renderArrow={(direction: Direction) => (
            <TouchableOpacity
              style={{
                ...styles.calendarAction,
                backgroundColor: theme.screen.iconBg,
              }}
              onPress={() =>
                navigateMonth(direction === 'left' ? 'prev' : 'next')
              }
            >
              <AntDesign
                name={direction === 'left' ? 'arrowleft' : 'arrowright'}
                size={20}
                color={foods_area_color}
              />
            </TouchableOpacity>
          )}
          onMonthChange={(month: any) => {
            setCurrentMonth(new Date(month.year, month.month - 1));
          }}
          hideExtraDays
          theme={{
            backgroundColor: 'black',
            calendarBackground: theme.sheet.sheetBg,
            textSectionTitleColor: theme.screen.text,
            selectedDayBackgroundColor: foods_area_color,
            selectedDayTextColor: contrastColor,
            todayTextColor: foods_area_color,
            monthTextColor: theme.screen.text,
            dayTextColor: theme.screen.text,
            textDisabledColor: 'gray',
            arrowColor: foods_area_color,
            disabledArrowColor: 'gray',
            textDayFontFamily: 'Poppins_400Regular',
            textMonthFontFamily: 'Poppins_400Regular',
            textDayHeaderFontFamily: 'Poppins_400Regular',
            textDayFontSize: 16,
            textMonthFontSize: 18,
            textDayHeaderFontSize: 14,
          }}
        />
      </View>
    </BottomSheetView>
  );
};

export default CalendarSheet;
