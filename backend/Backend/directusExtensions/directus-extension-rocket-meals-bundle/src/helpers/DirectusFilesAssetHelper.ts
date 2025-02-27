import {EnvVariableHelper} from "./EnvVariableHelper";
import {DirectusFiles} from "../databaseTypes/types";
import {MyDatabaseTestableHelperInterface} from "./MyDatabaseHelperInterface";

export type DirectusFilesAssetHelperOptions = {
    useInternalServerUrl?: boolean,
}

export class DirectusFilesAssetHelper {

    public static getOptionsDefault(): DirectusFilesAssetHelperOptions {
        return {
            useInternalServerUrl: false,
        }
    }

    public static getOptionsInternal(): DirectusFilesAssetHelperOptions {
        let defaultOptions = this.getOptionsDefault();
        defaultOptions.useInternalServerUrl = true;
        return defaultOptions;
    }

    private static getAssetUrl(serverUrl: string, directusFileId: string): string {
        return `${serverUrl}/assets/${directusFileId}`;
    }

    /**
     * Access only if permission is granted for the file
     * @param directusFile
     */
    public static getDirectAssetUrl(directusFile: DirectusFiles, myDatabaseTestableHelperInterface: MyDatabaseTestableHelperInterface, options: DirectusFilesAssetHelperOptions): string {
        return DirectusFilesAssetHelper.getDirectAssetUrlById(directusFile.id, myDatabaseTestableHelperInterface, options);
    }

    public static getDirectAssetUrlById(directusFileId: string, myDatabaseTestableHelperInterface: MyDatabaseTestableHelperInterface, options: DirectusFilesAssetHelperOptions): string {
        let serverPort = myDatabaseTestableHelperInterface.getServerPort();
        const internalServerUrl = `http://127.0.0.1:${serverPort}`; // TODO: Maybe EnvVariable HOST instead of 127.0.0.1 ?
        let serverUrl = internalServerUrl
        if(options.useInternalServerUrl){
            serverUrl = internalServerUrl;
        } else {
            let publicServerUrl = myDatabaseTestableHelperInterface.getServerUrl();
            serverUrl = publicServerUrl;
        }

        return DirectusFilesAssetHelper.getAssetUrl(serverUrl, directusFileId);
    }

}