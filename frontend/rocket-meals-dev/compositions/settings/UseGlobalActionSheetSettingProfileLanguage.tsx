import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {useProfileLanguageCode} from "@/states/SynchedProfile";
import {useSynchedLanguagesDict} from "@/states/SynchedLanguages";
import {useMyGlobalActionSheet} from "@/components/actionsheet/MyGlobalActionSheet";
import {Text} from "@/components/Themed";
import CountryFlag from "react-native-country-flag";
import {useIsDebug} from "@/states/Debug";

export function useGlobalActionSheetSettingProfileLanguage(){

    const translation_select = useTranslation(TranslationKeys.select)

    const isDebug = useIsDebug()

    const title = useTranslation(TranslationKeys.language)

    const [selectedLanguageKey, setSavedLanguageKey] = useProfileLanguageCode()
    const [languageDict, setLanguageDict] = useSynchedLanguagesDict();
    const usedLanguageDict = languageDict || {}
    let selectedKey = selectedLanguageKey

    let availableOptionKeys = Object.keys(usedLanguageDict)

    let items = []
    for(let key of availableOptionKeys){
        let language = usedLanguageDict[key]
        let code = language?.code

        let icon = "translation"
        let active = code === selectedKey

        const label = language?.name || code

        // code is in form of "de-DE" so we need to extract the iso code which is the second part "DE"
        const isoCode = code?.split("-")[1]

        let itemAccessibilityLabel = label+" "+translation_select

        items.push({
            key: code as string,
            label: label,
            icon: icon,
            active: active,
            accessibilityLabel: itemAccessibilityLabel,
            renderLeftIcon: (backgroundColor: string, backgroundColorOnHover: string, textColor: string, lighterOrDarkerTextColor: string, hide: () => void) => {
                let renderedContent = [];
                renderedContent.push(
                    <CountryFlag isoCode={isoCode} size={22} />
                )
                if (isDebug) {
                    renderedContent.push(
                        <Text>{code}</Text>
                    )
                }
                return renderedContent
            },
            onSelect: async (code: string, hide: () => void) => {
                setSavedLanguageKey(code)
                hide();
            }
        })
    }

    const config = {
        onCancel: undefined,
        visible: true,
        title: title,
        items: items
    }

    const [show, hide, showActionsheetConfig] = useMyGlobalActionSheet()

    const onPress = () => {
        show(config)
    }

    return onPress;
}