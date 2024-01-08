// @ts-nocheck
import React, { FunctionComponent, useEffect, useState } from "react";
import { View, Text, useToast, ScrollView, Divider, useClipboard } from "native-base";
import {ConfigHolder, Icon, ServerAPI} from "../../../kitcheningredients";
import { useSynchedProfile } from "../../components/profile/ProfileAPI";
import { Share, TouchableOpacity } from "react-native";
import { AppTranslation } from "../../components/translations/AppTranslation";
import { Directus } from "@directus/sdk";
import {Nutritions} from "../../components/food/nutritions/Nutritions";
import {NutritionIcon} from "../../components/food/nutritions/NutritionIcon";
import {MarkingIcon} from "../../components/marking/MarkingIcon";
import {FoodCard} from "../../components/food/FoodCard";
import {SettingsSpacer} from "../../components/settings/SettingsSpacer";
import {DetailsComponentMenus} from "../../components/detailsComponent/DetailsComponentMenus";
import {IdIcon} from "../../components/icons/IdIcon"; // Import Directus SDK

interface AppState {}

export const ProfileRawInformation: FunctionComponent<AppState> = (props) => {
    const [profile, setProfile] = useSynchedProfile();
    const [activityLogs, setActivityLogs] = useState(null); // State to hold activity logs

    let stringifiedProfile = JSON.stringify(profile, null, 2);

    const user_instance = ConfigHolder.instance.getUser();
    const stringifiedUser = JSON.stringify(user_instance, null, 2);

    const toast = useToast();
    const clipboard = useClipboard();

    // Initialize Directus SDK
    const directus = ServerAPI.getClient()


    function renderCopyButton( content){
        return(
            <TouchableOpacity style={{flex: 1}} onPress={async () => {
                await clipboard.onCopy(content);
                toast.show({
                    description: "Copied"
                });
            }} >
                <View style={{padding: 10, backgroundColor: "orange", flexDirection: "row"}}>
                    <Icon name={"content-copy"} />
                    <View style={{width: 18}}></View>
                    <View><AppTranslation id={"copy"} /><Text>{" "}</Text></View>
                </View>
            </TouchableOpacity>
        )
    }

    function renderElement(jsonObject){
        return(
            <View>
                {renderCopyButton(jsonObject)}
                <View style={{width: 30}}></View>
                <Text>{JSON.stringify(jsonObject, null, 2)}</Text>
            </View>
        )
    }

    const menus = {
        "user": {
            element: renderElement(user_instance),
            renderIcon: (backgroundColor, textColor) => { return <IdIcon color={textColor} />},
            renderContent: (backgroundColor, textColor) => { return <Text color={textColor}>{"User"}</Text>},
        },
        "profile": {
            element: renderElement(profile),
            renderIcon: (backgroundColor, textColor) => { return <Icon name={"face-outline"} color={textColor} />},
            renderContent: (backgroundColor, textColor) => { return <Text color={textColor}>{"Profile"}</Text>},
        },
        "activity": {
            element: renderElement(activityLogs),
            renderIcon: (backgroundColor, textColor) => { return <Icon name={"clock"} color={textColor} />},
            renderContent: (backgroundColor, textColor) => { return <Text color={textColor}>{"Activity"}</Text>},
        },
    }

    // Fetch activity logs for the current user
    const fetchActivityLogs = async () => {
        try {
            const logs = await directus.activity.readByQuery({
                filter: {
                    user: user_instance.id, // Replace with the ID of the current user
                },
                sort: ["-timestamp"]
            });
            setActivityLogs(logs);
        } catch (error) {
            console.error("Error fetching activity logs:", error);
        }
    };

    useEffect(() => {
        fetchActivityLogs(); // Fetch activity logs on component mount
    }, [props?.route?.params]);


    return (
        <View style={{width: "100%"}}>
                <DetailsComponentMenus menus={menus} />
        </View>
    )
};
