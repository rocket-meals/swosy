import {useUpdates} from "expo-updates"; // Optional if you want to use default theme

export interface ServerStatusFlowLoaderProps {
    children?: React.ReactNode;
}

export const RootAppUpdateChecker = (props: ServerStatusFlowLoaderProps) => {

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

  return (
      props.children
  )
}
