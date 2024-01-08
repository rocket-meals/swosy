// @ts-nocheck
import React, {useEffect} from "react";
import {PackagesWithLicenses} from "./PackagesWithLicenses";
import {ConfigHolder} from "../../ConfigHolder";
import {keyof} from "ts-keyof";
import {RouteHelper} from "../../navigation/RouteHelper";
import {SettingsSpacer} from "../../components/settings/SettingsSpacer";

export const License = (props) => {

  ConfigHolder.instance.setHideDrawer(false, RouteHelper.getNameOfComponent(License));

	// corresponding componentDidMount
	useEffect(() => {

	}, [props?.route?.params])

  let component = ConfigHolder.plugin.getLicenseComponent();

	return(
		<>
      {component}
      <SettingsSpacer />
			<PackagesWithLicenses />
		</>
	)
}

License.displayName = keyof({ License });
