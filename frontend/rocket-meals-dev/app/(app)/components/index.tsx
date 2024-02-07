import {SafeAreaView, ScrollView} from 'react-native';
import {Text} from '@/components/Themed';
import {SettingsRowSpacerWithDivider} from "@/components/settings/SettingsRowSpacerWithDivider";
import React, {useState} from "react";
import {SettingsRowTextEdit} from "@/components/settings/SettingsRowTextEdit";
import {MyCardForResourcesWithImage} from "@/components/card/MyCardForResourcesWithImage";
import {MyButton} from "@/components/buttons/MyButton";
import {MyNewButton} from "@/components/buttons/MyNewButton";

export default function HomeScreen() {
  const [text, setText] = useState<string | undefined>("InitialText");
  const [active, setActive] = useState<boolean>(false);

  const switchActive = () => {
    setActive(!active);
  }

  return (
      <SafeAreaView style={{width: "100%", height: "100%"}}>
        <ScrollView style={{width: "100%", height: "100%"}}>
            <Text>{"TEXT: "+text}</Text>
            <SettingsRowSpacerWithDivider />
            <MyButton accessibilityLabel={"TestButton"} text={"Test"} onPress={() => {setText("ButtonPressed")}} />
            <MyNewButton accessibilityLabel={"Switch Active"} text={"Switch Active"} onPress={switchActive} leftIcon={"star-outline"} leftIconActive={"star"} rightIcon={"test-tube-empty"} isActive={active} />
            <SettingsRowSpacerWithDivider />
          <SettingsRowTextEdit labelRight={text} accessibilityLabel={"TestInput"} label={"Test"} onSave={setText} />
          <SettingsRowSpacerWithDivider />

            <MyCardForResourcesWithImage accessibilityLabel={"ExampleCard"} text={"Example Card With Image"} assetId={undefined} thumbHash={undefined} />
        </ScrollView>
      </SafeAreaView>
  );
}
