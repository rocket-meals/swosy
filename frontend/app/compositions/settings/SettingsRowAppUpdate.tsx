import React, {FunctionComponent} from "react";
import {SettingsRowActionsheet} from "@/components/settings/SettingsRowActionsheet";
import * as Updates from 'expo-updates';
import {useUpdates} from 'expo-updates';
import {SettingsRowGroup} from "@/components/settings/SettingsRowGroup";
import {SettingsRow} from "@/components/settings/SettingsRow";
import {MySafeAreaView} from "@/components/MySafeAreaView";
import {MyScrollView} from "@/components/scrollview/MyScrollView";
import {IconNames} from "@/constants/IconNames";
import {MyModalActionSheetItem} from "@/components/modal/MyModalActionSheet";

interface AppState {

}

export const UpdateComponent: FunctionComponent<AppState> = ({...props}) => {
    const [status, setStatus] = React.useState<any>(null)
    const {
        currentlyRunning,
        availableUpdate,
        downloadedUpdate,
        isUpdateAvailable,
        isUpdatePending,
        isChecking,
        isDownloading,
        checkError,
        downloadError,
        initializationError,
        lastCheckForUpdateTimeSinceRestart,
    } = useUpdates();

    const channel = Updates.channel
    const runtimeVersion = Updates.runtimeVersion;
    const manifestCurrent = Updates.manifest;

    const [updateIsAvailable, setUpdateIsAvailable] = React.useState<boolean>(false);
    const [updateSize, setUpdateSize] = React.useState<number | null>(null);
    const [downloadedUpdateIsNew, setDownloadedUpdateIsNew] = React.useState<boolean>(false);
    const [updateManifest, setUpdateManifest] = React.useState<Updates.Manifest | null>(null);

    async function checkForUpdates() {
        setUpdateIsAvailable(false)
        setDownloadedUpdateIsNew(false)
        setUpdateManifest(null)
        setUpdateSize(null)
        try {
            setStatus("Checking for updates")
            console.log("await Updates.checkForUpdateAsync();")
            const updateCheckResult: Updates.UpdateCheckResult = await Updates.checkForUpdateAsync();
            setStatus("Checked for updates")
            setUpdateIsAvailable(updateCheckResult.isAvailable)
            if(updateCheckResult.isAvailable) {
                const manifest: Updates.Manifest = updateCheckResult.manifest;
                setUpdateManifest(manifest)
            }
        } catch (error) {
            setStatus("Error fetching latest Expo update")
        }
    }

    async function getSizeOfUpdate(manifest: Updates.Manifest) {
        // TODO: https://github.com/expo/expo/discussions/27826
    }

    async function downloadUpdates() {
        setDownloadedUpdateIsNew(false);
        try {
            setStatus("Downloading updates")
            console.log("await Updates.fetchUpdateAsync();");
            let updateResult: Updates.UpdateFetchResult = await Updates.fetchUpdateAsync();
            if (updateResult.isNew) {
                setStatus("Downloaded update is new");
                setDownloadedUpdateIsNew(true);
            } else if(updateResult.isRollBackToEmbedded) {
                setStatus("Downloaded update is a rollback to embedded")
            } else {
                setStatus("Downloaded update is not new")
            }
        } catch (error) {
            setStatus("Error fetching latest Expo update")
        }
    }

    async function reloadUpdates() {
        try{
            console.log("await Updates.reloadAsync();")
            await Updates.reloadAsync();
            setStatus("Reloading updates")
        } catch (error) {
            alert(`Error fetching latest Expo update: ${error}`);
            setStatus("Error fetching latest Expo update")
        }
    }

    return <MySafeAreaView>
        <MyScrollView>
            <SettingsRowGroup>
                <SettingsRow labelLeft={"Channel"} accessibilityLabel={"Channel"} leftIcon={IconNames.fact_icon} labelRight={channel} />
                <SettingsRow labelLeft={"Status"} accessibilityLabel={"Status"} leftIcon={IconNames.fact_icon} labelRight={status} />
                <SettingsRow labelLeft={"Runtime Version"} accessibilityLabel={"Runtime Version"} leftIcon={IconNames.fact_icon} labelRight={runtimeVersion} />
                <SettingsRow labelLeft={"Update available"} accessibilityLabel={"Update available"} leftIcon={IconNames.fact_icon} labelRight={updateIsAvailable+""} />
                <SettingsRow labelLeft={"Downloaded Update New"} accessibilityLabel={"Downloaded Update New"} leftIcon={IconNames.fact_icon} labelRight={downloadedUpdateIsNew+""} />
                <SettingsRow labelLeft={"Update Size"} accessibilityLabel={"Update Size"} leftIcon={IconNames.fact_icon} labelRight={updateSize+""} />
            </SettingsRowGroup>
            <SettingsRowGroup>
                <SettingsRow labelLeft={"Check for update"} accessibilityLabel={"Check for update"} leftIcon={IconNames.settings_system_auto_icon} onPress={() => checkForUpdates()} />
                <SettingsRow disabled={!updateIsAvailable} labelLeft={"Download update"} accessibilityLabel={"Download update"} leftIcon={"cloud-download"} onPress={() => downloadUpdates()} />
                <SettingsRow disabled={!downloadedUpdateIsNew} labelLeft={"Reload update"} accessibilityLabel={"Reload update"} leftIcon={IconNames.settings_system_auto_icon} onPress={() => reloadUpdates()} />
            </SettingsRowGroup>
        </MyScrollView>
    </MySafeAreaView>
}


export const SettingsRowAppUpdate: FunctionComponent<AppState> = ({...props}) => {
    const config: MyModalActionSheetItem = {
        label: "App Update",
        accessibilityLabel: "App Update",
        key: "app-update",
        title: "App Update",
        renderAsContentInsteadItems: (key: string, hide: () => void) => {
            return <UpdateComponent />
        }
    }

    return(
        <SettingsRowActionsheet labelLeft={
            "App Update"
        } config={config} accessibilityLabel={
            "App Update"
        } leftIcon={
            "cloud-download"
        } {...props}  />
    )
}
