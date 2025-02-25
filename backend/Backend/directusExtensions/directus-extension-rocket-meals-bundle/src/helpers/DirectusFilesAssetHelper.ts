import {EnvVariableHelper} from "./EnvVariableHelper";
import {DirectusFiles} from "../databaseTypes/types";
import {MyDatabaseTestableHelperInterface} from "./MyDatabaseHelperInterface";

export class DirectusFilesAssetHelper {

    /**
     * Access only if permission is granted for the file
     * @param directusFile
     */
    public static getDirectAssetUrl(directusFile: DirectusFiles, myDatabaseTestableHelperInterface: MyDatabaseTestableHelperInterface): string {
        return DirectusFilesAssetHelper.getDirectAssetUrlById(directusFile.id, myDatabaseTestableHelperInterface);
    }

    public static getDirectAssetUrlById(directusFileId: string, myDatabaseTestableHelperInterface: MyDatabaseTestableHelperInterface): string {
        let serverUrl = myDatabaseTestableHelperInterface.getServerUrl();
        return `${serverUrl}/assets/${directusFileId}`;
    }

}