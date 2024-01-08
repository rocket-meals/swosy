import EnviromentHelper from "../EnviromentHelper";
import {ServerInfo} from "@directus/sdk";
import ServerAPI from "../ServerAPI";
import {CSS_Helper} from "./CSS_Helper";
import {useMyContrastColor} from "../theme/useMyContrastColor";

export class ServerInfoHelper {

    static getProjectName(serverInfo: ServerInfo){
        return serverInfo?.project?.project_name;
    }

    static getProjectColor(serverInfo: ServerInfo){
        return serverInfo?.project?.project_color;
    }

    static getProjectLogoAssetId(serverInfo: ServerInfo){
        return serverInfo?.project?.project_logo;
    }
    static getProjectLogoURL(serverInfo: ServerInfo){
        return ServerAPI.getAssetImageURL(ServerInfoHelper.getProjectLogoAssetId(serverInfo));
    }

    static getProjectBackgroundAssetId(serverInfo: ServerInfo){
        return serverInfo?.project?.public_background;
    }
    static getProjectBackgroundURL(serverInfo: ServerInfo){
        return ServerAPI.getAssetImageURL(ServerInfoHelper.getProjectBackgroundAssetId(serverInfo));
    }

    static getProjectVersion(): string {
        let manifest = EnviromentHelper.getAppManifest();
        return manifest?.version || "";
    }

    static getSsoIconStyle(serverInfo: ServerInfo){

        let custom_css = serverInfo?.project?.custom_css || ""; // custom_css:

        let parsed_css = CSS_Helper.parseCssToSelectorMap(custom_css);
        let customSsoIconStyle = parsed_css?.[".sso-icon"] || {};

        let project_color = ServerInfoHelper.getProjectColor(serverInfo);
        customSsoIconStyle.background = customSsoIconStyle?.background || project_color;
        customSsoIconStyle.color = customSsoIconStyle?.color;
        if(!customSsoIconStyle.color){
          customSsoIconStyle.color = useMyContrastColor(customSsoIconStyle.background);
        }


        return customSsoIconStyle;
    }

}
