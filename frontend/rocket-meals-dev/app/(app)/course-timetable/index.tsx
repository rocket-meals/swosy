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
    BaseCourseTimetableEvent,
    CourseTimetableEventType, CourseTimetableDictType,
    useCourseTimetableEvents, usePersonalCourseTimetableAmountDaysOnScreen,
    usePersonalCourseTimetableTimeEnd, usePersonalCourseTimetableTimeStart
} from "@/compositions/courseTimetable/CourseTimetableHelper";
import {MyGlobalActionSheetConfig, useMyGlobalActionSheet} from "@/components/actionsheet/MyGlobalActionSheet";
import React from "react";
import {TimetableImportDemo} from "@/compositions/courseTimetable/timetableProviders/TimetableImportDemo";
import {CourseTimetableSchedule} from "@/compositions/courseTimetable/CourseTimetableSchedule";
import {SettingsRowActionsheet} from "@/components/settings/SettingsRowActionsheet";
import {IconNames} from "@/constants/IconNames";
import {CourseTimetableEvent} from "@/compositions/courseTimetable/CourseTimetableEvent";

export default function CourseTimetableScreen() {

    const translation_import = useTranslation(TranslationKeys.import);
    const [show, hide, showActionsheetConfig] = useMyGlobalActionSheet()

    const isDemo = useIsDemo()

    const locale = useProfileLocaleForJsDate();
    const backgroundColor = useViewBackgroundColor()

    const [firstDayOfWeek, setFirstDayOfWeek] = useSynchedFirstWeekday()
    const [startTime, setStartTime] = usePersonalCourseTimetableTimeStart();
    const [endTime, setEndTime] = usePersonalCourseTimetableTimeEnd();
    const [amountDaysOnScreen, setAmountDaysOnScreen] = usePersonalCourseTimetableAmountDaysOnScreen();
    const [timetableEvents, setTimetableEvents, addNewCourseTimetableEvent, removeCourseTimetableEvent] = useCourseTimetableEvents();

    const translation_event = useTranslation(TranslationKeys.event)
    const translation_create = useTranslation(TranslationKeys.create)
    const translation_edit = useTranslation(TranslationKeys.edit)

    const translationCreateEvent = translation_event+" "+translation_create

    const breakPointsAmountOfDaysToShowOnScreen = {
        sm: 2.1,
        md: 5.1,
        lg: 7,
        xl: 7
    }
    const amountOfDaysToShowOnScreen = amountDaysOnScreen || useBreakPointValue(breakPointsAmountOfDaysToShowOnScreen)

    const configShowDemoImportProvider: MyGlobalActionSheetConfig = {
        onCancel: undefined,
        visible: true,
        title: "Import",
        renderCustomContent: (backgroundColor: string | undefined, backgroundColorOnHover: string, textColor: string, lighterOrDarkerTextColor: string, hide: () => void) => {
            return (
                    <MyScrollView>
                        <View style={{
                            width: "100%",
                        }}>
                            <Text>{"Show Import"}</Text>
                            <TimetableImportDemo onCloseModal={hide} onImport={onImport}/>
                        </View>
                    </MyScrollView>
            );
        }
    }

    function renderTimetableEventForEditOrCreate(item?: BaseCourseTimetableEvent | CourseTimetableEventType){
        return (
            <MyScrollView>
                <CourseTimetableEvent item={item}
                                      handleEditExisting={async (usedEvent: CourseTimetableEventType, hide: () => void) => {
                                          console.log(usedEvent)
                                          // update the event in the timetableEvents with the id
                                          timetableEvents[usedEvent.id] = usedEvent;
                                          await setTimetableEvents(timetableEvents)
                                          handlePressOnEvent(usedEvent);
                                      }}
                                      handleEditTemplate={async (usedEvent: BaseCourseTimetableEvent, hide: () => void) => {
                                          handlePressOnEvent(usedEvent);
                                      }}
                                      handleDelete={async (itemToDelete: CourseTimetableEventType) => {
                                          console.log("Delete")
                                          console.log(itemToDelete)
                                          await removeCourseTimetableEvent(itemToDelete)
                                          hide()
                                      }}
                                      handleCreateNew={async (usedEvent: BaseCourseTimetableEvent) => {
                                          console.log("Save")
                                          console.log(usedEvent)
                                          await addNewCourseTimetableEvent(usedEvent)
                                          hide()
                                      }}
                />
            </MyScrollView>
        )
    }

    function handlePressOnEvent(item: BaseCourseTimetableEvent){
        const configShowOnPressEvent: MyGlobalActionSheetConfig = {
            onCancel: undefined,
            visible: true,
            title: translation_event + ": " + translation_edit,
            renderCustomContent: (backgroundColor: string | undefined, backgroundColorOnHover: string, textColor: string, lighterOrDarkerTextColor: string, hide: () => void) => {
                return renderTimetableEventForEditOrCreate(item)
            }
        }
        show(configShowOnPressEvent);
    }

    function handlePressCreateEvent(){
        const configShowCreateEvent: MyGlobalActionSheetConfig = {
            onCancel: undefined,
            visible: true,
            title: translation_event + ": " + translation_create,
            renderCustomContent: (backgroundColor: string | undefined, backgroundColorOnHover: string, textColor: string, lighterOrDarkerTextColor: string, hide: () => void) => {
                return renderTimetableEventForEditOrCreate(undefined)
            }
        }
        show(configShowCreateEvent);
    }

    const importProviders: any[] = []

    if(isDemo){
        importProviders.push({
            key: "demo",
            label: "Demo",
            icon: IconNames.demo_icon_on,
            config: configShowDemoImportProvider,
        })
    }

    const hasImportProviders = importProviders.length > 0;

    const renderedImportProviders: React.ReactNode[] = []
    for(let i=0; i<importProviders.length; i++){
        let importProvider = importProviders[i];
        renderedImportProviders.push(
            <SettingsRowActionsheet key={importProvider.key} accessibilityLabel={importProvider.label} config={importProvider.config} labelLeft={importProvider.label} leftIcon={importProvider.icon} />
        )
    }

    const configShowSelectImportProvider: MyGlobalActionSheetConfig = {
        onCancel: undefined,
        visible: true,
        title: "Select Import Provider",
        renderCustomContent: (backgroundColor: string | undefined, backgroundColorOnHover: string, textColor: string, lighterOrDarkerTextColor: string, hide: () => void) => {


            return (
                    <MyScrollView>
                        <View style={{
                            width: "100%",
                        }}>
                            {renderedImportProviders}
                        </View>
                    </MyScrollView>
            );
        }
    }



    function onImport(events: CourseTimetableEventType[]){
        console.log("On Import")
        console.log(events);

        let newEvents: CourseTimetableDictType = {};
        let currentEventId = 1;
        for(let event of events){
            let id = event?.id || currentEventId;
            event.id = id+"";
            newEvents[id] = event;
            currentEventId++;
        }

        console.log("New Events dict")
        console.log(newEvents);
        setTimetableEvents(newEvents)
    }

    function renderImportAction(){
        let title_import = translation_import

        if(hasImportProviders) {
            return (
                <View style={{paddingBottom: 10, paddingRight: 10}}>
                    <MyButton leftIconColoredBox={true} useOnlyNecessarySpace={true} leftIcon={IconNames.calendar_import_icon}
                              accessibilityLabel={title_import}
                              text={title_import}
                              onPress={() => {
                                  show(configShowSelectImportProvider)
                              }}
                    />
                </View>
            )
        } else {
            return null;
        }
    }

    function renderActions(){


        return(
            <View style={{flexDirection: "row", marginTop: 10, marginHorizontal: 10, flexWrap: "wrap"}}>
                {renderImportAction()}
                <View style={{paddingBottom: 10}}>
                    <MyButton leftIconColoredBox={true} useOnlyNecessarySpace={true} leftIcon={IconNames.course_timetable_event_create_icon} accessibilityLabel={translationCreateEvent} onPress={() => {
                        handlePressCreateEvent()
                    }}
                              text={translationCreateEvent}
                    />
                </View>
            </View>
        )
    }

    function renderContent(){
        let coursesFound = Object.keys(timetableEvents).length > 0;
        if(!coursesFound){
            return (
                <MyScrollView style={{
                    paddingHorizontal: 10
                }}>
                    <NoCourseTimetableFound />
                </MyScrollView>
            )
        } else {
            return (
                <View style={{width: "100%", flex: 1}}>
                    <CourseTimetableSchedule
                        key={amountOfDaysToShowOnScreen+"-"+firstDayOfWeek+"-"+startTime+"-"+endTime}
                        weekStartsOn={firstDayOfWeek}
                        currentWeekday={DateHelper.getWeekdayToday()}
                        amountOfDaysToShowOnScreen={amountOfDaysToShowOnScreen}
                        backgroundColor={backgroundColor}
                        locale={locale}
                        eventsDict={timetableEvents}
                        onPressEvent={(item: CourseTimetableEventType) => {
                            handlePressOnEvent(item);
                        }}
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
