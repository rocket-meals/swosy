import {SettingsRowSyncBooleanSwitch} from "@/components/settings/SettingsRowSyncBooleanSwitch";
import {PersistentStore} from "@/helper/syncState/PersistentStore";
import React from "react";
import {SettingsRowLogout} from "@/components/settings/SettingsRowLogout";
import {SettingsRowDrawerPosition} from "@/compositions/settings/SettingsRowDrawerPosition";
import {SettingsRowProfileNickname} from "@/compositions/settings/SettingsRowProfileNickname";
import {SettingsRowUser} from "@/compositions/settings/SettingsRowUser";
import {SettingsRowSpacerWithDivider} from "@/components/settings/SettingsRowSpacerWithDivider";
import {SettingsRowProfileCanteen} from "@/compositions/settings/SettingsRowProfileCanteen";
import {MySafeAreaView} from "@/components/MySafeAreaView";
import {ScrollViewWithGradient} from "@/components/scrollview/ScrollViewWithGradient";
import {SettingsRowProfileLanguage} from "@/compositions/settings/SettingsRowProfileLanguage";
import {IconNames} from "@/constants/IconNames";
import {SettingsRowFirstDayOfWeek} from "@/compositions/settings/SettingsRowFirstDayOfWeek";
import {SettingsRowColorScheme} from "@/compositions/settings/SettingsRowColorScheme";
import {SettingsRowProfileEatingHabits} from "@/compositions/settings/SettingsRowEatingHabits";

export default function SettingsScreen() {

  return (
     <MySafeAreaView>
       <ScrollViewWithGradient>
           <SettingsRowSpacerWithDivider />
           <SettingsRowUser />
           <SettingsRowProfileNickname />
           <SettingsRowProfileLanguage />
           <SettingsRowProfileCanteen />
           <SettingsRowProfileEatingHabits />
           <SettingsRowSpacerWithDivider />
           <SettingsRowColorScheme />
           <SettingsRowDrawerPosition />
           <SettingsRowFirstDayOfWeek />
           <SettingsRowSpacerWithDivider />
           <SettingsRowLogout />
           <SettingsRowSpacerWithDivider />
           <SettingsRowSyncBooleanSwitch labelLeft={"Debug"} leftIcon={IconNames.debug_icon} accessibilityLabel={"Debug"} variable={PersistentStore.debug} />
           <SettingsRowSyncBooleanSwitch labelLeft={"Demo"} leftIconOn={IconNames.demo_icon_on} leftIconOff={IconNames.demo_icon_off} accessibilityLabel={"Demo"} variable={PersistentStore.demo} />
           <SettingsRowSyncBooleanSwitch labelLeft={"Performance"} leftIconOn={IconNames.performance_icon_on} leftIconOff={IconNames.performance_icon_off} accessibilityLabel={"Performance"} variable={PersistentStore.performance} />
           <SettingsRowSyncBooleanSwitch labelLeft={"Developer"} leftIconOn={IconNames.demo_icon_on} leftIconOff={IconNames.demo_icon_off} accessibilityLabel={"Developer"} variable={PersistentStore.develop} />
       </ScrollViewWithGradient>
     </MySafeAreaView>
  );
}