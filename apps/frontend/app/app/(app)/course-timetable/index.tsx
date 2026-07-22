import React, { useCallback, useEffect, useState } from 'react';
import { Linking, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useAppSelector } from '@/redux/hooks';
import TimeTableData from '@/constants/TimeTable';
import CourseTimetable from '../../../components/CourseTimeTable/CourseTimetable';
import CourseBottomSheet from '../../../components/CourseTimeTable/CourseBottomSheet';
import styles from './styles';
import { FontAwesome } from '@expo/vector-icons';
import { useMyScrollViewModal } from '@/components/GlobalModal/useMyScrollViewModal';
import { EventTypes } from './types';
import { courseTimetableDescriptionEmpty } from '@/constants/translationConstants';
import RedirectButton from '@/components/RedirectButton';
import useToast from '@/hooks/useToast';
import { useLanguage } from '@/hooks/useLanguage';
import { myContrastColor } from '@/helper/ColorHelper';
import { TranslationKeys } from '@/locales/keys';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import CollectibleSpot from '@/components/CollectibleItem/CollectibleSpot';
import { CollectibleAt } from 'repo-depkit-common';
import { PARSE_MARKDOWN_REGEX, extractTextAndLink } from './markdownHelpers';

const TimetableScreen = () => {
	useSetPageTitle(TranslationKeys.course_timetable);
	const { theme } = useTheme();
	const toast = useToast();
    const { translate } = useLanguage();
    const { primaryColor, language, appSettings, selectedTheme: mode } = useAppSelector((state) => state.settings);
    const { profile } = useAppSelector((state) => state.authReducer);
	const { show: showScrollViewModal, close: closeScrollViewModal } = useMyScrollViewModal();
	const [events, setEvents] = useState<EventTypes[]>([]);
	const [isUpdate, setIsUpdate] = useState(false);
	const [selectedEventId, setSelectedEventId] = useState('');
	const [timeTableData, setTimeTableData] = useState(() => TimeTableData(theme).map(item => ({ ...item })));
	const course_timetable_area_color = appSettings?.course_timetable_area_color ? appSettings?.course_timetable_area_color : primaryColor;
	const contrastColor = myContrastColor(course_timetable_area_color, theme, mode === 'dark');
	const { text, label, link } = extractTextAndLink(courseTimetableDescriptionEmpty[language as keyof typeof courseTimetableDescriptionEmpty] || courseTimetableDescriptionEmpty.en);

	const openSheet = useCallback(() => {
		showScrollViewModal({
			children: <CourseBottomSheet timeTableData={timeTableData} closeSheet={closeScrollViewModal} isUpdate={isUpdate} selectedEventId={selectedEventId} />,
		});
	}, [showScrollViewModal, closeScrollViewModal, timeTableData, isUpdate, selectedEventId]);

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
						toast(`Cannot open URL: ${link}`, 'error');
					}
				}
			} catch (error) {
				console.error('An error occurred:', error);
			}
		}
	};

	const parseMarkdown = (text: string) => {
		const parts = text?.split(PARSE_MARKDOWN_REGEX);

		return parts?.map((part, index) => {
			if (part?.startsWith('**') && part?.endsWith('**')) {
				return (
					// eslint-disable-next-line react/no-array-index-key
					<Text key={`${index}-${part}`} style={{ fontWeight: 'bold' }}>
						{part?.slice(2, -2)}
					</Text>
				);
			} else if (part?.startsWith('*') && part?.endsWith('*')) {
				return (
					// eslint-disable-next-line react/no-array-index-key
					<Text key={`${index}-${part}`} style={{ fontStyle: 'italic' }}>
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
                                <TouchableOpacity
                                        style={{
                                                ...styles.createButton,
                                                backgroundColor: course_timetable_area_color,
                                        }}
                                        onPress={openSheet}
                                >
                                        <FontAwesome name="calendar-plus-o" size={20} color={contrastColor} />
                                        <View>
                                                <Text style={{ ...styles.createButtonText, color: contrastColor }}>{`${translate(TranslationKeys.event)} ${translate(TranslationKeys.create)}`}</Text>
                                        </View>
                                </TouchableOpacity>
                                {events && events?.length > 0 ? (
                                        <CourseTimetable events={events} openSheet={openSheet} setIsUpdate={setIsUpdate} setTimeTableData={setTimeTableData} setSelectedEventId={setSelectedEventId} />
                                ) : (
                                        <View style={styles.noEventsContainer}>
                                                <Text
                                                        style={{
                                                                ...styles.body,
                                                                color: theme.sheet.text,
                                                        }}
                                                >
                                                        {parseMarkdown(text)}
                                                </Text>
                                                {link && <RedirectButton label={label} type="link" backgroundColor={course_timetable_area_color} color={contrastColor} onClick={() => handleOpenInBrowser(link)} />}
                                        </View>
                                )}
                                <CollectibleSpot collectibleKey={CollectibleAt.collectible_at_course_timetable} />
                        </ScrollView>
                </View>
        );
};

export default TimetableScreen;
