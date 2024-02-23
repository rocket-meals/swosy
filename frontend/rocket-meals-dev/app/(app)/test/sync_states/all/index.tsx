import {MySafeAreaView} from "@/components/MySafeAreaView";
import {ScrollViewWithGradient} from "@/components/scrollview/ScrollViewWithGradient";
import React from "react";
import {useSynchedWikisDict} from "@/states/SynchedWikis";
import {Text, View} from "@/components/Themed";
import {SettingsRowSpacer} from "@/components/settings/SettingsRowSpacer";

export default function HomeScreen() {

  const [wikis, setWikis, lastUpdateWikis] = useSynchedWikisDict()

  return (
      <MySafeAreaView>
        <ScrollViewWithGradient>
          <SettingsRowSpacer />
          <View>
            <Text>
              {JSON.stringify(wikis, null, 2)}
            </Text>
          </View>
        </ScrollViewWithGradient>
      </MySafeAreaView>
  );
}
