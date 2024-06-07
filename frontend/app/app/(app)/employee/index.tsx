import React from "react";
import {MyScrollView} from "@/components/scrollview/MyScrollView";
import {MySafeAreaViewThemed} from "@/components/MySafeAreaViewThemed";
import {SettingsRowGroup} from "@/components/settings/SettingsRowGroup";
import {TranslationKeys} from "@/helper/translations/Translation";
import {IconNames} from "@/constants/IconNames";
import {SettingsRowNavigateSimple} from "@/components/settings/SettingsRowNavigate";

export default function EmployeeScreen() {

	return (
		<MySafeAreaViewThemed>
			<MyScrollView>
				<SettingsRowGroup>
					<SettingsRowNavigateSimple translation_key={TranslationKeys.foodweekplan} iconLeft={IconNames.foodweekplan_icon} route={"/(app)/foodweekplan"} />
				</SettingsRowGroup>
			</MyScrollView>
		</MySafeAreaViewThemed>
	)

}