import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";

export const useSettingTranslationCourseTimetable = () => {
    const translationsSettings = useTranslation(TranslationKeys.settings)
    const translationsCourseTimetable = useTranslation(TranslationKeys.course_timetable)
    return translationsCourseTimetable+" "+translationsSettings
}
