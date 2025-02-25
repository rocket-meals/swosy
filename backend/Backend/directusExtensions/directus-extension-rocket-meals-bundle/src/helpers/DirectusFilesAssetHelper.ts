import {EnvVariableHelper} from "./EnvVariableHelper";
import {DirectusFiles} from "../databaseTypes/types";

export class DirectusFilesAssetHelper {

    /**
     * Access only if permission is granted for the file
     * @param directusFile
     */
    public static getDirectAssetUrl(directusFile: DirectusFiles): string {
        let publicUrl = EnvVariableHelper.getServerUrl();
        return `${publicUrl}/assets/${directusFile.id}`;
    }

}