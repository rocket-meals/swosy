import {useSynchedProfile} from "@/states/SynchedProfile";

export function useCourseTimetableEvents(): any[]{
    const [profile, setProfile] = useSynchedProfile();
    let courseTimetable = profile.course_timetable || {};

    const setCourseTimetable = async (value) => {
        profile.course_timetable = value;
        let success = await setProfile(profile);
        return success;
    }
    const addNewCourseTimetableEvent = async (event) => {
        if(!event){
            return false;
        }
        // find the next free id
        let id = 1;
        while(courseTimetable[id]){
            // id is already taken
            id++;
        }
        event.id = id;
        courseTimetable[id] = event;
        let success = await setCourseTimetable(courseTimetable);
        return success;
    }
    return [courseTimetable, setCourseTimetable, addNewCourseTimetableEvent];
}

export function usePersonalCourseTimetableSettings(): any[]{
    const [jsonState, setJsonState] = useJSONState(StorageKeys.CACHED_PERSONAL_SETTINGS_COURSE_TIMETABLE);
    const reset = async () => {
        setJsonState({});
    }
    return [jsonState, setJsonState, reset];
}

export function usePersonalCourseTimetableTime(start: boolean): [string, (value: string) => void]{
    const [jsonState, setJsonState] = usePersonalCourseTimetableSettings();
    const field = start ? "timetableStartTime" : "timetableEndTime";
    const defaultValue = start ? "08:00" : "20:00";
    const time = jsonState?.[field] || defaultValue;
    const setCourseTimetableTime = async (value: Weekday) => {
        jsonState[field] = value;
        return await setJsonState(jsonState);
    }
    return [time, setCourseTimetableTime];
}

export function usePersonalCourseTimetableAmountDaysOnScreen(): [number, (value: number) => void]{
    const [jsonState, setJsonState] = usePersonalCourseTimetableSettings();
    const field = "amountDaysOnScreen";
    const defaultValue = undefined;
    const amountDaysOnScreen = jsonState?.[field] || defaultValue;
    const setAmountDaysOnScreen = async (value: number) => {
        jsonState[field] = value;
        if(value <= 0){
            delete jsonState[field];
        }
        return await setJsonState(jsonState);
    }
    const asNumber = parseInt(amountDaysOnScreen) || 0;
    return [asNumber, setAmountDaysOnScreen];
}

export function usePersonalCourseTimetableTitleIntelligent(): [boolean, (value: boolean) => void]{
    const [jsonState, setJsonState] = usePersonalCourseTimetableSettings();
    const field = "titleIntelligent";
    const defaultValue = true;
    const fieldValue = jsonState?.[field];
    const titleIntelligent = fieldValue!==undefined ? fieldValue : defaultValue;
    const setTitleIntelligent = async (value: boolean) => {
        jsonState[field] = value;
        return await setJsonState(jsonState);
    }
    return [titleIntelligent, setTitleIntelligent];
}

export function useTimetableViewMode(): [Weekday, (value: Weekday) => void]{
    const [jsonState, setJsonState] = usePersonalCourseTimetableSettings();
    const field = "firstDayOfWeek";
    const firstDayOfWeek = jsonState?.[field] || Weekday.MONDAY;
    const setFirstDayOfWeek = (value: Weekday) => {
        jsonState[field] = value;
        setJsonState(jsonState);
    }
    return [firstDayOfWeek, setFirstDayOfWeek];
}
