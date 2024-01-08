import React, {FunctionComponent} from "react";
import {useAppTranslation} from "../../components/translations/AppTranslation";
import {SettingsProfileLanguageComponent} from "../../components/settings/SettingsProfileLanguageComponent";
import {View} from "native-base";

export const LoginLanguageSelector: FunctionComponent = (props) => {

	return(
		<View style={{width: "100%"}}>
			<SettingsProfileLanguageComponent shadeLevel={0} />
		</View>
	)
}
