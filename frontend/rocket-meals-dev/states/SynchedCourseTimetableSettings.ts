import {useSyncState} from "@/helper/syncState/SyncState";
import {PersistentStore} from "@/helper/syncState/PersistentStore";


type Timetable_Settings_Type = {
  start_time?: string,
  end_time?: string,
  amount_days_to_show?: number
  intelligent_title?: boolean,
}

export function useSynchedCourseTimetableSettingsRaw(): [Timetable_Settings_Type, (newValue: Timetable_Settings_Type) => void] {
  const [timetableSettings, setTimetableSettings] = useSyncState<Timetable_Settings_Type>(PersistentStore.course_timetable_settings)
  let usedTimetableSettings = timetableSettings as Timetable_Settings_Type | null
  if(usedTimetableSettings === null) {
    usedTimetableSettings = {
      start_time: undefined,
      end_time: undefined,
      amount_days_to_show: undefined,
      intelligent_title: undefined
    }
  }
  return [usedTimetableSettings, setTimetableSettings]
}