import {MySafeAreaView} from "@/components/MySafeAreaView";
import {ScrollViewWithGradient} from "@/components/scrollview/ScrollViewWithGradient";
import {SettingsRowSpacerWithDivider} from "@/components/settings/SettingsRowSpacerWithDivider";
import React from "react";
import {useSynchedWikisDict} from "@/states/SynchedWikis";
import {View, Text} from "@/components/Themed";

export default function HomeScreen() {

  const [wikis, setWikis, lastUpdateWikis] = useSynchedWikisDict()

  return (
      <MySafeAreaView>
        <ScrollViewWithGradient>
          <SettingsRowSpacerWithDivider />
          <View>
            <Text>
              {JSON.stringify(wikis, null, 2)}
            </Text>
          </View>
        </ScrollViewWithGradient>
      </MySafeAreaView>
  );
}
