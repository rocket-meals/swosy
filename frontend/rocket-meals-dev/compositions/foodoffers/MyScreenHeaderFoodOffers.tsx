import React from "react";
import {Text, View} from "@/components/Themed"
import {getMyScreenHeaderFunction, MyScreenHeader, MyScreenHeaderProps} from "@/components/drawer/MyScreenHeader";
import {SettingsButtonProfileCanteen} from "@/compositions/settings/SettingsButtonProfileCanteen";
import {useFoodOfferSelectedDate} from "@/states/SynchedFoodOfferSelectedDate";
import {MyButton} from "@/components/buttons/MyButton";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {DateHelper} from "@/helper/date/DateHelper";
import {useProfileLocaleForJsDate, useSynchedProfile} from "@/states/SynchedProfile";

const MyScreenHeaderFoodOffers = ({ ...props }: MyScreenHeaderProps) => {
    const title = undefined //"TEST"

    let locale = useProfileLocaleForJsDate()

    const [selectedDate, setSelectedDate, changeAmountDays] = useFoodOfferSelectedDate();

    const translation_day = useTranslation(TranslationKeys.day);
    const translation_next = useTranslation(TranslationKeys.next);
    const translation_previous = useTranslation(TranslationKeys.previous);

    const dateCopy = new Date(selectedDate);
    const humanReadableDate = DateHelper.useSmartReadableDate(dateCopy, locale)

    function renderSecondaryHeaderContent(props: any) {
        return (
            <View style={{
                height: "100%",
                width: "100%",
                backgroundColor: "orange",
                justifyContent: "flex-end",
                flexDirection: "row",
            }} >
                <View style={{height: 10, width: 10, backgroundColor: "green"}}>

                </View>
                <View>
                    <SettingsButtonProfileCanteen />
                </View>
            </View>
        );
    }

    function renderSwitchDate(forward: boolean){
        let translation = translation_day;
        if(forward){
            translation += ": " + translation_next;
        } else {
            translation += ": " + translation_previous;
        }
        const iconName = forward ? "chevron-right" : "chevron-left";

        return <MyButton tooltip={translation} useOnlyNecessarySpace={true} leftIcon={iconName} accessibilityLabel={translation} onPress={() => {
            changeAmountDays(forward ? 1 : -1);
        }   } />
    }

    return <View style={{
        width: "100%",
    }}>
        <MyScreenHeader {...props} custom_title={title} custom_renderHeaderDrawerOpposite={renderSecondaryHeaderContent} />
        <View style={{
            height: 100,
            width: "100%",
            backgroundColor: "orange",
            flexDirection: "row",
            justifyContent: "space-between",
            flexWrap: "wrap",
        }}>
            {renderSwitchDate(false)}
            <Text>{JSON.stringify(selectedDate, null, 2)}</Text>
            <Text>{humanReadableDate}</Text>
            {renderSwitchDate(true)}
        </View>
    </View>
}


export const getMyScreenHeaderFoodOffers: getMyScreenHeaderFunction = () => {
    return (props: MyScreenHeaderProps) => {
        return <MyScreenHeaderFoodOffers {...props} />
    }
}
