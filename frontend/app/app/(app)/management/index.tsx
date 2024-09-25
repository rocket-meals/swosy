import React from "react";
import {MyScrollView} from "@/components/scrollview/MyScrollView";
import {MySafeAreaView} from "@/components/MySafeAreaView";
import {SettingsRowGroup} from "@/components/settings/SettingsRowGroup";
import {TranslationKeys} from "@/helper/translations/Translation";
import {IconNames} from "@/constants/IconNames";
import {SettingsRowNavigateSimple} from "@/components/settings/SettingsRowNavigate";

export default function ManagementScreen() {
	return (
		<MySafeAreaView>
			<MyScrollView>
				<SettingsRowGroup label={"Statistiken"}>
					<SettingsRowNavigateSimple title={"Test Statistik"} leftIcon={IconNames.foodweekplan_icon} route={"/(app)/statistics"} />
				</SettingsRowGroup>
				<SettingsRowGroup label={"Monitore"}>
					<SettingsRowNavigateSimple translation_key={TranslationKeys.foodweekplan} leftIcon={IconNames.foodweekplan_icon} route={"/(app)/foodoffers/monitor/weekplan"} />
					<SettingsRowNavigateSimple translation_key={TranslationKeys.foodBigScreen} leftIcon={IconNames.gallery_icon} route={"/(app)/foodoffers/monitor/bigscreen"} />
					<SettingsRowNavigateSimple translation_key={TranslationKeys.monitorDayPlan} leftIcon={IconNames.monitorDayPlan_icon} route={"/(app)/foodoffers/monitor/dayplan"} />
				</SettingsRowGroup>
			</MyScrollView>
		</MySafeAreaView>
	)
}