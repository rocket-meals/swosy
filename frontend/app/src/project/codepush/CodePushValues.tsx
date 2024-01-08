/**
 * Copied values from Code-Push-Package
 */
enum InstallMode {
    /**
     * Indicates that you want to install the update and restart the app immediately.
     */
    IMMEDIATE,

    /**
     * Indicates that you want to install the update, but not forcibly restart the app.
     */
    ON_NEXT_RESTART,

    /**
     * Indicates that you want to install the update, but don't want to restart the app until the next time
     * the end user resumes it from the background. This way, you don't disrupt their current session,
     * but you can get the update in front of them sooner then having to wait for the next natural restart.
     * This value is appropriate for silent installs that can be applied on resume in a non-invasive way.
     */
    ON_NEXT_RESUME,

    /**
     * Indicates that you want to install the update when the app is in the background,
     * but only after it has been in the background for "minimumBackgroundDuration" seconds (0 by default),
     * so that user context isn't lost unless the app suspension is long enough to not matter.
     */
    ON_NEXT_SUSPEND
}

/**
 * Indicates the current status of a sync operation.
 */
enum SyncStatus {
    /**
     * The app is up-to-date with the CodePush server.
     */
    UP_TO_DATE,

    /**
     * An available update has been installed and will be run either immediately after the
     * syncStatusChangedCallback function returns or the next time the app resumes/restarts,
     * depending on the InstallMode specified in SyncOptions
     */
    UPDATE_INSTALLED,

    /**
     * The app had an optional update which the end user chose to ignore.
     * (This is only applicable when the updateDialog is used)
     */
    UPDATE_IGNORED,

    /**
     * The sync operation encountered an unknown error.
     */
    UNKNOWN_ERROR,

    /**
     * There is an ongoing sync operation running which prevents the current call from being executed.
     */
    SYNC_IN_PROGRESS,

    /**
     * The CodePush server is being queried for an update.
     */
    CHECKING_FOR_UPDATE,

    /**
     * An update is available, and a confirmation dialog was shown
     * to the end user. (This is only applicable when the updateDialog is used)
     */
    AWAITING_USER_ACTION,

    /**
     * An available update is being downloaded from the CodePush server.
     */
    DOWNLOADING_PACKAGE,

    /**
     * An available update was downloaded and is about to be installed.
     */
    INSTALLING_UPDATE
}

/**
 * Indicates the state that an update is currently in.
 */
enum UpdateState {
    /**
     * Indicates that an update represents the
     * version of the app that is currently running.
     */
    RUNNING,

    /**
     * Indicates than an update has been installed, but the
     * app hasn't been restarted yet in order to apply it.
     */
    PENDING,

    /**
     * Indicates than an update represents the latest available
     * release, and can be either currently running or pending.
     */
    LATEST
}

/**
 * Indicates the status of a deployment (after installing and restarting).
 */
enum DeploymentStatus {
    /**
     * The deployment failed (and was rolled back).
     */
    FAILED,

    /**
     * The deployment succeeded.
     */
    SUCCEEDED
}

/**
 * Indicates when you would like to check for (and install) updates from the CodePush server.
 */
enum CheckFrequency {
    /**
     * When the app is fully initialized (or more specifically, when the root component is mounted).
     */
    ON_APP_START,

    /**
     * When the app re-enters the foreground.
     */
    ON_APP_RESUME,

    /**
     * Don't automatically check for updates, but only do it when codePush.sync() is manully called inside app code.
     */
    MANUAL
}

export class CodePushValues{
    static readonly InstallMode = InstallMode;
    static readonly SyncStatus = SyncStatus;
    static readonly UpdateState = UpdateState;
    static readonly DeploymentStatus = DeploymentStatus;
    static readonly CheckFrequency = CheckFrequency;

    static getStatusMessage(status) {
        switch (status) {
            case CodePushValues.SyncStatus.CHECKING_FOR_UPDATE:
                return 'Checking for updates.'
            case CodePushValues.SyncStatus.DOWNLOADING_PACKAGE:
                return 'Downloading package.'
            case CodePushValues.SyncStatus.INSTALLING_UPDATE:
                return 'Installing update.'
            case CodePushValues.SyncStatus.UP_TO_DATE:
                return 'Up-to-date.'
            case CodePushValues.SyncStatus.UPDATE_INSTALLED:
                return 'Update installed.'
            default:
                return null;
        }
    }

    static isNetworkError(status){
        return status === CodePushValues.SyncStatus.UNKNOWN_ERROR
    }

    static isSyncingFinished(status) {
        return (
            status === CodePushValues.SyncStatus.CHECKING_FOR_UPDATE ||  //while checking for an update keep going
            status === CodePushValues.SyncStatus.UP_TO_DATE || //while obviously we are up to date
            status === CodePushValues.SyncStatus.UPDATE_INSTALLED || // or an update was installed
            CodePushValues.isNetworkError(status) // or a network error occurred
        )
    }
}
