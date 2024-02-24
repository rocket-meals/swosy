import {MySafeAreaView} from "@/components/MySafeAreaView";
import {MyScrollView} from "@/components/scrollview/MyScrollView";
import {NoCourseTimetableFound} from "@/compositions/courseTimetable/NoCourseTimetableFound";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {useIsDemo} from "@/states/SynchedDemo";
import {Text, useViewBackgroundColor, View} from "@/components/Themed";
import {MyButton} from "@/components/buttons/MyButton";
import {DateHelper, Weekday} from "@/helper/date/DateHelper";
import {useBreakPointValue} from "@/helper/device/DeviceHelper";
import {useSynchedFirstWeekday} from "@/states/SynchedFirstWeekday";
import {useProfileLocaleForJsDate, useSynchedProfile} from "@/states/SynchedProfile";
import {
    CourseTimetableEventType,
    useCourseTimetableEvents, usePersonalCourseTimetableAmountDaysOnScreen,
    usePersonalCourseTimetableTimeEnd, usePersonalCourseTimetableTimeStart
} from "@/compositions/courseTimetable/CourseTimetableHelper";
import {MyGlobalActionSheetConfig, useMyGlobalActionSheet} from "@/components/actionsheet/MyGlobalActionSheet";
import React from "react";
import {TimetableImportDemo} from "@/compositions/courseTimetable/timetableProviders/TimetableImportDemo";
import {CourseTimetableSchedule} from "@/compositions/courseTimetable/CourseTimetableSchedule";
import {SettingsRowActionsheet} from "@/components/settings/SettingsRowActionsheet";
import {IconNames} from "@/constants/IconNames";

export default function CourseTimetableScreen() {

    const translation_import = useTranslation(TranslationKeys.import);
    const [show, hide, showActionsheetConfig] = useMyGlobalActionSheet()

    const isDemo = useIsDemo()

    const locale = useProfileLocaleForJsDate();
    const backgroundColor = useViewBackgroundColor()

    const [firstDayOfWeek, setFirstDayOfWeek] = useSynchedFirstWeekday()
    const [timetableEvents, setTimetableEvents] = useCourseTimetableEvents();
    const [startTime, setStartTime] = usePersonalCourseTimetableTimeStart();
    const [endTime, setEndTime] = usePersonalCourseTimetableTimeEnd();
    const [amountDaysOnScreen, setAmountDaysOnScreen] = usePersonalCourseTimetableAmountDaysOnScreen();

    const translation_event = useTranslation(TranslationKeys.event)
    const translation_create = useTranslation(TranslationKeys.create)

    const translationCreateEvent = translation_event+" "+translation_create

    const breakPointsAmountOfDaysToShowOnScreen = {
        base: 1.1,
        sm: 2.1,
        md: 5.1,
        lg: 7,
        xl: 7
    }
    const amountOfDaysToShowOnScreen = amountDaysOnScreen || useBreakPointValue(breakPointsAmountOfDaysToShowOnScreen)


    function getEvent(id: string, start: string, end: string, weekday: Weekday){
        let useDate = DateHelper.getDefaultWeekdayDate(weekday)
        let startDate = new Date(useDate);
        startDate.setHours(parseInt(start.split(":")[0]), parseInt(start.split(":")[1]));
        startDate.setMinutes(startDate.getMinutes()+1)

        let endDate = new Date(useDate);
        endDate.setHours(parseInt(end.split(":")[0]), parseInt(end.split(":")[1]));

        /** Fix timeline display. Since events which start and end at the same time they will share space */
        /** For example 08:00-09:00 and 09:00-10:00 arent overlapping technicly */
        /** But we have to reduce the end by 1 minute */
        endDate.setMinutes(endDate.getMinutes()-1); // reduce end by 1 minute

        return{
            id: id,
            startDate: startDate,
            endDate: endDate,
        }
    }

    const configShowDemoImportProvider: MyGlobalActionSheetConfig = {
        onCancel: undefined,
        visible: true,
        title: "Import",
        renderCustomContent: (backgroundColor: string | undefined, backgroundColorOnHover: string, textColor: string, lighterOrDarkerTextColor: string, hide: () => void) => {
            return (
                <MySafeAreaView>
                    <MyScrollView>
                        <View style={{
                            width: "100%",
                            padding: 20,
                        }}>
                            <Text>{"Show Import"}</Text>
                            <TimetableImportDemo onCloseModal={hide} onImport={onImport}/>
                        </View>
                    </MyScrollView>
                </MySafeAreaView>
            );
        }
    }

    const importProviders = []

    if(isDemo){
        importProviders.push({
            key: "demo",
            label: "Demo",
            icon: IconNames.demo_icon_on,
            config: configShowDemoImportProvider,
        })
    }

    const configShowSelectImportProvider: MyGlobalActionSheetConfig = {
        onCancel: undefined,
        visible: true,
        title: "Select Import Provider",
        renderCustomContent: (backgroundColor: string | undefined, backgroundColorOnHover: string, textColor: string, lighterOrDarkerTextColor: string, hide: () => void) => {
            const renderedImportProviders = []
            for(let i=0; i<importProviders.length; i++){
                let importProvider = importProviders[i];
                renderedImportProviders.push(
                    <SettingsRowActionsheet key={importProvider.key} accessibilityLabel={importProvider.label} config={importProvider.config} labelLeft={importProvider.label} leftIcon={importProvider.icon} />
                )
            }

            return (
                <MySafeAreaView>
                    <MyScrollView>
                        <View style={{
                            width: "100%",
                            padding: 20,
                        }}>
                            {renderedImportProviders}
                        </View>
                    </MyScrollView>
                </MySafeAreaView>
            );
        }
    }



    function onImport(events: CourseTimetableEventType[]){
        let newEvents = {};
        let currentEventId = 1;
        for(let event of events){
            let id = event?.id || currentEventId;
            event.id = id+"";
            newEvents[id] = event;
            currentEventId++;
        }
        setTimetableEvents(newEvents)
    }


    function parseTimetableEventsToList(timetableEvents){
        let events = [];
        for(let key in timetableEvents){
            let event = timetableEvents[key];
            let parsedEvent = getEvent(event.id, event.start, event.end, event.weekday);
            events.push(parsedEvent)
        }
        return events;
    }

    function renderActions(){
        let title_import = translation_import

        return(
            <View style={{width: "100%", flexDirection: "row", marginTop: 10, marginHorizontal: 10}}>
                <MyButton leftIconColoredBox={true} useOnlyNecessarySpace={true} leftIcon={"calendar-import"}
                          accessibilityLabel={title_import}
                          text={title_import}
                          onPress={() => {
                              show(configShowSelectImportProvider)
                          }}
                />
                <View style={{
                    width: 10
                }} />
                    <MyButton leftIconColoredBox={true} useOnlyNecessarySpace={true} leftIcon={"calendar-plus"} accessibilityLabel={translationCreateEvent} onPress={() => {
                        console.log("Create event")
                    }}
                              text={translationCreateEvent}
                    />
            </View>
        )
    }

    let events = parseTimetableEventsToList(timetableEvents);

    function renderContent(){
        let coursesFound = Object.keys(timetableEvents).length > 0;
        if(!coursesFound){
            return (
                <MyScrollView>
                    <NoCourseTimetableFound />
                </MyScrollView>
            )
        } else {
            return (
                <View style={{width: "100%", height: "100%", flex: 1}}>
                    <CourseTimetableSchedule
                        weekStartsOn={firstDayOfWeek}
                        currentWeekday={DateHelper.getWeekdayToday()}
                        amountOfDaysToShowOnScreen={amountOfDaysToShowOnScreen}
                        backgroundColor={backgroundColor}
                        locale={locale}
                        events={events}
                        fromHour={parseInt(startTime)}
                        toHour={parseInt(endTime)}
                    />
                </View>
            )
        }
    }

    return (
        <MySafeAreaView>
            {renderActions()}
            {renderContent()}
        </MySafeAreaView>
    )
  }