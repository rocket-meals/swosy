import {ConfigHolder} from "./ConfigHolder";

export default class EnviromentHelper{

	static getDirectusAccessTokenName(){
		return "directus_access_token";
	}

	static getAppManifest(): any{
		return ConfigHolder?.AppConfig;
	}

  static getAppManifestExtra(): any{
    return EnviromentHelper.getAppManifest()?.extra;
  }

  /**
   * Please use ConfigHolder.instance.getBackendUrl()
   * This method gives the Backend URl in the initial AppManifest which may not update dynamically
   */
	static getHardCodedBackendURL(): string{
		return EnviromentHelper.getAppManifestExtra()?.BACKEND_URL;
	}

	static getAssetURL(file_id): any{
		if(!file_id){
			return null;
		}
		return ConfigHolder.instance.getBackendUrl()+"/assets/"+file_id
	}

	static getBasePath(): string{
		return EnviromentHelper.getAppManifestExtra()?.BASE_PATH;
	}

}
