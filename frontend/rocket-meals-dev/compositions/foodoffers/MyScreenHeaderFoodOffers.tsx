import React from "react";
import {Heading, View, Text} from "@/components/Themed"
import {getMyScreenHeaderFunction, MyScreenHeader, MyScreenHeaderProps} from "@/components/drawer/MyScreenHeader";
import {SettingsButtonProfileCanteen} from "@/compositions/settings/SettingsButtonProfileCanteen";
import {useFoodOfferSelectedDate} from "@/states/SynchedFoodOfferStates";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {DateHelper} from "@/helper/date/DateHelper";
import {useProfileLocaleForJsDate} from "@/states/SynchedProfile";
import {Divider} from "@gluestack-ui/themed";
import {MyPreviousNextButton} from "@/components/buttons/MyPreviousNextButton";
import {SimpleDatePicker} from "@/components/datePicker/SimpleDatePicker";
import {UtilizationForecast} from "@/compositions/utilizationForecast/UtilizationForecast";
import {UtilizationButton} from "@/compositions/utilizationForecast/UtilizationButton";

const MyScreenHeaderFoodOffers = ({ ...props }: MyScreenHeaderProps) => {
    const title = undefined //"TEST"

    let locale = useProfileLocaleForJsDate()

    const [selectedDate, setSelectedDate, changeAmountDays] = useFoodOfferSelectedDate();

    const translation_day = useTranslation(TranslationKeys.day);

    const dateCopy = new Date(selectedDate);
    const humanReadableDate = DateHelper.useSmartReadableDate(dateCopy, locale)

    function renderSecondaryHeaderContent(props: any) {
        return (
            <View style={{
                height: "100%",
                width: "100%",
                justifyContent: "flex-end",
                alignItems: "center",
                flexDirection: "row",
            }} >
                <View>
                    <SettingsButtonProfileCanteen />
                </View>
            </View>
        );
    }

    function renderSwitchDate(forward: boolean){
        let translation = translation_day;
        return <MyPreviousNextButton useTransparentBorderColor={true} translation={translation} forward={forward} onPress={() => {
            changeAmountDays(forward ? 1 : -1);
        }} />
    }

    return <View style={{
        width: "100%",
    }}>
        <MyScreenHeader hideDivider={true} {...props} custom_title={title} custom_renderHeaderDrawerOpposite={renderSecondaryHeaderContent} />
        <View style={{
            width: "100%",
            flexDirection: "row",
            flexWrap: "wrap",
        }}>
            <View style={{
                justifyContent: "center",
                alignItems: "center",
                flexDirection: "row",
                flexShrink: 1,
            }}>
                {renderSwitchDate(false)}
                <SimpleDatePicker currentDate={selectedDate} onSelectDate={(date) => {
                    setSelectedDate(date);
                } }>
                </SimpleDatePicker>
                {renderSwitchDate(true)}
            </View>
            <View style={{
                alignItems: "center",
                flexDirection: "row",
                flexShrink: 1,
            }}>
                <Heading>{humanReadableDate}</Heading>
            </View>
            <View style={{
                // take the rest of the space
                justifyContent: "flex-end",
                alignItems: "flex-end",
                flexDirection: "row",
                flexGrow: 1,

            }}>
                <UtilizationButton />
            </View>
        </View>
        <Divider />
    </View>
}


export const getMyScreenHeaderFoodOffers: getMyScreenHeaderFunction = () => {
    return (props: MyScreenHeaderProps) => {
        return <MyScreenHeaderFoodOffers {...props} />
    }
}
