import React from "react";
import {MyScrollView} from "@/components/scrollview/MyScrollView";
import {MySafeAreaView} from "@/components/MySafeAreaView";
import {SettingsRowGroup} from "@/components/settings/SettingsRowGroup";
import {TranslationKeys} from "@/helper/translations/Translation";
import {IconNames} from "@/constants/IconNames";
import {SettingsRowNavigateSimple} from "@/components/settings/SettingsRowNavigate";

export default function EmployeeScreen() {

	return (
		<MySafeAreaView>
			<MyScrollView>
				<SettingsRowGroup>
					<SettingsRowNavigateSimple translation_key={TranslationKeys.foodweekplan} iconLeft={IconNames.foodweekplan_icon} route={"/(app)/foodweekplan"} />
				</SettingsRowGroup>
			</MyScrollView>
		</MySafeAreaView>
	)

}