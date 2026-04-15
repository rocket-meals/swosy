import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Linking, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useAppSelector } from '@/redux/hooks';
import { useFocusEffect } from 'expo-router';
import TimeTableData from '@/constants/TimeTable';
import CourseTimetable from '../../../components/CourseTimeTable/CourseTimetable';
import CourseBottomSheet from '../../../components/CourseTimeTable/CourseBottomSheet';
import styles from './styles';
import { FontAwesome } from '@expo/vector-icons';
import BaseBottomSheet from '@/components/BaseBottomSheet';
import type BottomSheet from '@gorhom/bottom-sheet';
import { EventTypes } from './types';
import { courseTimetableDescriptionEmpty } from '@/constants/translationConstants';
import RedirectButton from '@/components/RedirectButton';
import useToast from '@/hooks/useToast';
import { useLanguage } from '@/hooks/useLanguage';
import { myContrastColor } from '@/helper/ColorHelper';
import { TranslationKeys } from '@/locales/keys';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import CollectibleSpot from '@/components/CollectibleItem/CollectibleSpot';
import { CollectibleAt, StringHelper } from 'repo-depkit-common';
import AppButton from '@/components/AppButton';

const extractTextAndLink = (description: string) => {
	// Remove unintended spaces between `]` and `(`
	const cleanedDescription = StringHelper.replaceAllWithOptions({ str: description, find: ']\\s+\\(', replace: '](' });

	const regex = /\[(.*?)\]\((.*?)\)/g;
	const match = regex.exec(cleanedDescription);

	if (match) {
		const label = match[1]; // The text inside the square brackets
		const link = match[2]; // The URL inside the parentheses
		const textWithoutLinkAndLabel = cleanedDescription.replace(match[0], '').trim(); // Remove the entire match
		return { text: textWithoutLinkAndLabel, label, link };
	}

	return { text: description, label: '', link: null };
};

const TimetableScreen = () => {
	useSetPageTitle(TranslationKeys.course_timetable);
	const { theme } = useTheme();
	const toast = useToast();
    const { translate } = useLanguage();
    const { primaryColor, language, appSettings, selectedTheme: mode } = useAppSelector((state) => state.settings);
    const { profile } = useAppSelector((state) => state.authReducer);
	const bottomSheetRef = useRef<BottomSheet>(null);
	const [events, setEvents] = useState<EventTypes[]>([]);
	const [isActive, setIsActive] = useState(false);
	const [isUpdate, setIsUpdate] = useState(false);
	const [selectedEventId, setSelectedEventId] = useState('');
	const [timeTableData, setTimeTableData] = useState(() => TimeTableData(theme).map(item => ({ ...item })));
	const course_timetable_area_color = appSettings?.course_timetable_area_color ? appSettings?.course_timetable_area_color : primaryColor;
	const contrastColor = myContrastColor(course_timetable_area_color, theme, mode === 'dark');
	const { text, label, link } = extractTextAndLink(courseTimetableDescriptionEmpty[language as keyof typeof courseTimetableDescriptionEmpty] || courseTimetableDescriptionEmpty.en);
	const isArabic = language === 'ar';

	const openSheet = useCallback(() => {
		bottomSheetRef?.current?.expand();
	}, []);

	const closeSheet = () => {
		bottomSheetRef?.current?.close();
		setIsUpdate(false);
	};

	useFocusEffect(
		useCallback(() => {
			setIsActive(true);
			return () => {
				setIsActive(false);
			};
		}, [])
	);

	const capitalizeFirstLetter = (string: string) => {
		return string?.charAt(0)?.toUpperCase() + string?.slice(1)?.toLowerCase();
	};

	useEffect(() => {
		if (profile?.course_timetable) {
			let courseTimetable = profile?.course_timetable ? profile?.course_timetable : {};
			const events = Object.values(courseTimetable).map((item: any) => ({
				day: capitalizeFirstLetter(item?.weekday?.id) || 'Monday',
				startTime: item.start,
				endTime: item.end,
				title: item.title,
				color: item.color,
				id: item.id,
				location: item.location,
			}));
			setEvents(events);
		}
	}, [profile]);

	const handleOpenInBrowser = async (link: string) => {
		if (link) {
			try {
				if (Platform.OS === 'web') {
					window.open(link, '_blank');
				} else {
					const supported = await Linking.canOpenURL(link);

					if (supported) {
						await Linking.openURL(link);
					} else {
						toast(translate(TranslationKeys.cannotOpenUrl).replace('${url}', link), 'error');
					}
				}
			} catch (error) {
				console.error('An error occurred:', error);
			}
		}
	};

	const parseMarkdown = (text: string) => {
		const regex = /(\*\*.*?\*\*|\*.*?\*|\[.*?\]\(.*?\))/g;
		const parts = text?.split(regex);

		return parts?.map((part, index) => {
			if (part?.startsWith('**') && part?.endsWith('**')) {
				return (
					<Text key={index} style={{ fontWeight: 'bold' }}>
						{part?.slice(2, -2)}
					</Text>
				);
			} else if (part?.startsWith('*') && part?.endsWith('*')) {
				return (
					<Text key={index} style={{ fontStyle: 'italic' }}>
						{part?.slice(1, -1)}
					</Text>
				);
			} else {
				return part;
			}
		});
	};

        return (
                <View style={{ ...styles.container, backgroundColor: theme.screen.background }}>
                        <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
								<View style={{ width: '100%', alignItems: isArabic ? 'flex-end' : 'flex-start' }}>
									<AppButton
										onPress={openSheet}
										style={{
											...styles.createButton,
											backgroundColor: course_timetable_area_color,
											marginVertical: 0,
											...(isArabic ? { marginLeft: 0, marginRight: 10 } : null),
										}}
										text={`${translate(TranslationKeys.event)} ${translate(TranslationKeys.create)}`}
										iconLeft={isArabic ? undefined : <FontAwesome name="calendar-plus-o" size={20} color={contrastColor} />}
										iconRight={isArabic ? <FontAwesome name="calendar-plus-o" size={20} color={contrastColor} /> : undefined}
										textStyle={{ ...styles.createButtonText, color: contrastColor }}
										usePlainText
									/>
								</View>
                                {events && events?.length > 0 ? (
                                        <CourseTimetable events={events} openSheet={openSheet} setIsUpdate={setIsUpdate} setTimeTableData={setTimeTableData} setSelectedEventId={setSelectedEventId} />
                                ) : (
                                        <View style={styles.noEventsContainer}>
                                                <Text
													style={{
															...styles.body,
															color: theme.sheet.text,
															textAlign: isArabic ? 'right' : 'left',
															writingDirection: isArabic ? 'rtl' : 'ltr',
													}}
                                                >
                                                    {parseMarkdown(text)}
                                                </Text>
                                                {link && <RedirectButton label={label} type="link" backgroundColor={course_timetable_area_color} color={contrastColor} onClick={() => handleOpenInBrowser(link)} />}
                                        </View>
                                )}
                                <CollectibleSpot collectibleKey={CollectibleAt.collectible_at_course_timetable} />
                        </ScrollView>
                        {isActive && (
                                <BaseBottomSheet
                                        ref={bottomSheetRef}
                                        index={-1}
                                        backgroundStyle={{
                                                ...styles.sheetBackground,
                                                backgroundColor: theme.sheet.sheetBg,
                                        }}
                                        enablePanDownToClose
                                        handleComponent={null}
                                        onClose={closeSheet}
                                >
                                        <CourseBottomSheet timeTableData={timeTableData} closeSheet={closeSheet} isUpdate={isUpdate} selectedEventId={selectedEventId} />
                                </BaseBottomSheet>
                        )}
                </View>
        );
};

export default TimetableScreen;
