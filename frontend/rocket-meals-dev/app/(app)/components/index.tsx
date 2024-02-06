import {SafeAreaView, ScrollView} from 'react-native';
import {Text} from '@/components/Themed';
import {SettingsRowSpacerWithDivider} from "@/components/settings/SettingsRowSpacerWithDivider";
import React, {useState} from "react";
import {SettingsRowTextEdit} from "@/components/settings/SettingsRowTextEdit";
import {MyCardForResourcesWithImage} from "@/components/card/MyCardForResourcesWithImage";

export default function HomeScreen() {
  const [text, setText] = useState<string | undefined>("InitialText");

  return (
      <SafeAreaView style={{width: "100%", height: "100%"}}>
        <ScrollView style={{width: "100%", height: "100%"}}>
          <SettingsRowTextEdit labelRight={text} accessibilityLabel={"TestInput"} label={"Test"} onSave={setText} />
          <SettingsRowSpacerWithDivider />
          <Text>{"TEXT: "+text}</Text>
            <MyCardForResourcesWithImage accessibilityLabel={"ExampleCard"} text={"Example Card With Image"} assetId={undefined} thumbHash={undefined} />
        </ScrollView>
      </SafeAreaView>
  );
}
