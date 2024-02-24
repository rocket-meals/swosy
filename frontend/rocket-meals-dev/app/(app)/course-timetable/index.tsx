import {MySafeAreaView} from "@/components/MySafeAreaView";
import {MyScrollView} from "@/components/scrollview/MyScrollView";
import {NoCourseTimetableFound} from "@/compositions/courseTimetable/NoCourseTimetableFound";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {useIsDemo} from "@/states/SynchedDemo";
import {useViewBackgroundColor, View} from "@/components/Themed";
import {MyButton} from "@/components/buttons/MyButton";
import {DateHelper, Weekday} from "@/helper/date/DateHelper";
import {useBreakPointValue} from "@/helper/device/DeviceHelper";
import {useSynchedFirstWeekday} from "@/states/SynchedFirstWeekday";
import {useProfileLocaleForJsDate, useSynchedProfile} from "@/states/SynchedProfile";
import {
    useCourseTimetableEvents,
    usePersonalCourseTimetableTime
} from "@/compositions/courseTimetable/CourseTimetableHelper";

export default function CourseTimetableScreen() {


    const actionsheet = MyActionsheet.useActionsheet();

    const translation_import = useTranslation(TranslationKeys.import);

    const isDemo = useIsDemo()

    const locale = useProfileLocaleForJsDate();
    const backgroundColor = useViewBackgroundColor()

    const [firstDayOfWeek, setFirstDayOfWeek] = useSynchedFirstWeekday()
    const [timetableEvents, setTimetableEvents] = useCourseTimetableEvents();
    const [startTime, setStartTime] = usePersonalCourseTimetableTime(true);
    const [endTime, setEndTime] = usePersonalCourseTimetableTime(false);
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

    const actionsheetOptionImportFromStudIP = "importFromStudIP"

    function onImport(events: TimetableEvent[]){
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

    function showStudIPImportOverlay(){
        let title = "Import from Stud.IP";
        if(isDemo){
            title = "Demo Import from Stud.IP";
        }

        actionsheet.show({
            title: title,
            renderCustomContent: (onCloseModal) => {
                return (
                    <>
                        <TimetableImportStudIP onCloseModal={onCloseModal} onImport={onImport} />
                    </>
                )
            }
        });
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
        let demoPreText = "";
        let title_import = translation_import
        if(isDemo){
            title_import = "Demo "+translation_import;
            demoPreText = "Demo ";
        }

        return(
            <View style={{width: "100%", flexDirection: "row"}}>
                <MyButton leftIcon={"calendar-import"}
                          accessibilityLabel={title_import}
                          text={title_import}
                          onPress={() => {
                              console.log("Import from Stud.IP")
                          }}
                />
                    <MyButton leftIcon={"calendar-plus"} accessibilityLabel={translationCreateEvent} onPress={() => {
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