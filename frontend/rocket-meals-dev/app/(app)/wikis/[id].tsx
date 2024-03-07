import React from "react";
import {MySafeAreaView} from "@/components/MySafeAreaView";
import {ScrollViewWithGradient} from "@/components/scrollview/ScrollViewWithGradient";
import {useLocalSearchParams} from "expo-router";
import {useSynchedWikiById} from "@/states/SynchedWikis";
import {WikiComponent} from "@/compositions/wikis/WikiComponent";

export default function WikisScreen() {

    const { id } = useLocalSearchParams();
    const used_id = id as string;
    const wiki = useSynchedWikiById(used_id);

    let content: any = null;
    if(wiki){
        content = <WikiComponent wiki={wiki} />;
    }

  return (
      <MySafeAreaView>
          <ScrollViewWithGradient style={{
              paddingHorizontal: 20,
              paddingVertical: 10
          }}>
              {content}
          </ScrollViewWithGradient>
      </MySafeAreaView>
  );
}