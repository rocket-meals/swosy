import React, {FunctionComponent} from "react";
import {SettingsRowActionsheet} from "@/components/settings/SettingsRowActionsheet";
import * as Updates from 'expo-updates';
import {View, Text} from "@/components/Themed";

interface AppState {

}
export const SettingsRowAppUpdate: FunctionComponent<AppState> = ({...props}) => {

    const [resutlt, setResult] = React.useState<any>(null)

    let items = []
    items.push({
        key: "check",
        label: "Check for updates",
        icon: "cloud-download",
        active: false,
        accessibilityLabel: "Check for updates",
        onSelect: async (key: string, hide: () => void) => {
            try {
                setResult("Checking for updates")
                const update = await Updates.checkForUpdateAsync();
                setResult("Checked for updates")

                if (update.isAvailable) {
                    setResult("Downloading updates")
                    await Updates.fetchUpdateAsync();
                    setResult("Downloaded updates")
                    await Updates.reloadAsync();
                    setResult("Reloaded updates")
                    hide()
                } else {
                    setResult("No updates available")
                    hide()
                }
            } catch (error) {
                // You can also add an alert() to see the error message in case of an error when fetching updates.
                alert(`Error fetching latest Expo update: ${error}`);
                setResult("Error fetching latest Expo update")
            }
        }
    })

    const config = {
        onCancel: undefined,
        visible: true,
        title: "App Update",
        items: items
    }

    function renderDebug() {
        if (resutlt) {
            return <View style={{
                width: "100%",
            }}>
                <Text>
                    {resutlt}
                </Text>
            </View>
        }
    }

    return(
        <>
            <SettingsRowActionsheet labelLeft={
                "App Update"
            } config={config} accessibilityLabel={
                "App Update"
            } leftIcon={
                "cloud-download"
            } {...props}  />
            {renderDebug()}
        </>
    )
}
