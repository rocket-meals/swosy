import React, {FunctionComponent, useEffect} from "react";
import {ScrollView, Text, useBreakpointValue, View} from "native-base";
import {ProfileAPI, useSynchedProfile} from "../../components/profile/ProfileAPI";
import {CourseTimetableAnimation} from "../../components/animations/CourseTimetableAnimation";
import {DateHelper} from "../../helper/DateHelper";
import {MyButton} from "../../components/buttons/MyButton";
import {CourseTimetableSchedule, TimetableEvent} from "../../components/courseTimetable/CourseTimetableSchedule";
import {
    BaseNoScrollTemplate,
    BasePadding,
    MyActionsheet,
    Navigation,
    ThemedMarkdown,
    useBackgroundColor
} from "../../../kitcheningredients";
import {TimetableImportStudIP} from "../../components/courseTimetable/timetableProviders/TimetableImportStudIP";
import {CourseTimetableHeader} from "../../components/courseTimetable/CourseTimetableHeader";
import {
    useCourseTimetableEvents, usePersonalCourseTimetableAmountDaysOnScreen,
    usePersonalCourseTimetableFirstDayOfWeek, usePersonalCourseTimetableTime
} from "../../components/courseTimetable/CourseTimetableHelper";
import {CourseTimetableEvent} from "./CourseTimetableEvent";
import {
    AppTranslation,
    useAppTranslation,
    useAppTranslationMarkdown
} from "../../components/translations/AppTranslation";
import {useDemoMode} from "../../helper/synchedJSONState";

interface AppState {

}

export const CourseTimetable: FunctionComponent<AppState> = (props) => {

    const actionsheet = MyActionsheet.useActionsheet();

    const [demo, setDemo] = useDemoMode();

    const [profile, setProfile] = useSynchedProfile();
    const locale = ProfileAPI.getLocaleForJSDates(profile);
    const backgroundColor = useBackgroundColor()

    const [firstDayOfWeek, setFirstDayOfWeek] = usePersonalCourseTimetableFirstDayOfWeek();
    const [timetableEvents, setTimetableEvents] = useCourseTimetableEvents();

    const [startTime, setStartTime] = usePersonalCourseTimetableTime(true);
    const [endTime, setEndTime] = usePersonalCourseTimetableTime(false);
    const [amountDaysOnScreen, setAmountDaysOnScreen] = usePersonalCourseTimetableAmountDaysOnScreen();

    const translationMarkdownEmptyDescription = useAppTranslationMarkdown("courseTimetableDescriptionEmpty");

    const translationCreateEvent = useAppTranslation("event")+" "+useAppTranslation("create")

    const breakPointsAmountOfDaysToShowOnScreen = {
        base: 1.1,
        sm: 2.1,
        md: 5.1,
        lg: 7,
        xl: 7
    }
    const amountOfDaysToShowOnScreen = amountDaysOnScreen || useBreakpointValue(breakPointsAmountOfDaysToShowOnScreen)


    function getEvent(id, start, end, weekday){
        let useDate = DateHelper.getDefaultWeekdayDate(weekday)
        let startDate = new Date(useDate);
        startDate.setHours(start.split(":")[0], start.split(":")[1]);
        startDate.setMinutes(startDate.getMinutes()+1)

        let endDate = new Date(useDate);
        endDate.setHours(end.split(":")[0], end.split(":")[1]);

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

    // corresponding componentDidMount
    useEffect(() => {
        //
    }, [props?.route?.params])

    function renderAnimation(){
        return (
            <View style={{width: "100%", flex: 1}}>
               <ScrollView>
                   <BasePadding>
                       <ThemedMarkdown>
                           {translationMarkdownEmptyDescription}
                       </ThemedMarkdown>
                       <CourseTimetableAnimation />
                   </BasePadding>
               </ScrollView>
            </View>
        )
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
        if(demo){
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
        let translationImport = useAppTranslation("import");
        let demoPreText = "";
        if(demo){
            translationImport = "Demo "+translationImport;
            demoPreText = "Demo ";
        }

        return(
            <View style={{width: "100%", flexDirection: "row"}}>
                <View style={{flex: 1}}>
                    <MyButton iconName={"calendar-import"}
                              accessibilityLabel={translationImport}
                              onPressShowActionsheet={[
                        {
                            title: translationImport,
                            onOptionSelect: (key) => {
                                if(key === actionsheetOptionImportFromStudIP){
                                    showStudIPImportOverlay();
                                }
                            }
                        },
                        {
                            [actionsheetOptionImportFromStudIP] : {
                                icon: "school",
                                label: demoPreText+"Import from Stud.IP",
                            },
                        }
                    ]}
                        label={translationImport}
                    >
                    </MyButton>
                </View>
                <View style={{flex: 1}}>
                    <MyButton iconName={"calendar-plus"} accessibilityLabel={translationCreateEvent} onPress={() => {
                        Navigation.navigateTo(CourseTimetableEvent, {showbackbutton: true, newEvent: true})
                    }}
                        label={translationCreateEvent}
                    >
                    </MyButton>
                </View>
            </View>
        )
    }

    let events = parseTimetableEventsToList(timetableEvents);

    function renderContent(){
        let coursesFound = Object.keys(timetableEvents).length > 0;
        if(!coursesFound){
            return renderAnimation()
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
      <BaseNoScrollTemplate route={props?.route} header={<CourseTimetableHeader />} >
          <View style={{width: "100%", height: "100%"}}>
              {renderActions()}
              {renderContent()}
          </View>
      </BaseNoScrollTemplate>
  )
}
