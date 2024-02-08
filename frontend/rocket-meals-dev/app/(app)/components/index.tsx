import {SafeAreaView} from 'react-native';
import {Text, View} from '@/components/Themed';
import {SettingsRowSpacerWithDivider} from "@/components/settings/SettingsRowSpacerWithDivider";
import React, {useState} from "react";
import {SettingsRowTextEdit} from "@/components/settings/SettingsRowTextEdit";
import {MyCardForResourcesWithImage} from "@/components/card/MyCardForResourcesWithImage";
import {MyButton} from "@/components/buttons/MyButton";
import {MyScrollView} from "@/components/scrollview/MyScrollView";
import {MySafeAreaView} from "@/components/MySafeAreaView";

export default function HomeScreen() {
  const [text, setText] = useState<string | undefined | null>("InitialText");
  const [active, setActive] = useState<boolean>(false);

  const switchActive = () => {
    setActive(!active);
  }

  return (
      <MySafeAreaView>
        <MyScrollView>
            <Text>{"TEXT: "+text}</Text>
            <SettingsRowSpacerWithDivider />
            <View>
                <MyButton accessibilityLabel={"Switch Active"} text={"Switch Active"} onPress={switchActive} leftIcon={"star-outline"} leftIconActive={"star"} rightIcon={"test-tube-empty"} isActive={active} />
            </View>
            <View>
                <MyButton disabled={true} leftIconColoredBox={false} accessibilityLabel={"Disbaled Button"} text={"Disbaled Button"} onPress={switchActive} leftIcon={"star-outline"} leftIconActive={"star"} rightIcon={"test-tube-empty"} isActive={active} />
            </View>
            <View>
                <MyButton key={"newStyleTest"} tooltip={"Test"} leftIconColoredBox={true} accessibilityLabel={"Disbaled Button"} text={"Disbaled Button"} onPress={switchActive} leftIcon={"star-outline"} leftIconActive={"star"} rightIcon={"test-tube-empty"} isActive={active} />
            </View>
            <SettingsRowSpacerWithDivider />
          <SettingsRowTextEdit labelRight={text} accessibilityLabel={"TestInput"} label={"Test"} onSave={setText} />
          <SettingsRowSpacerWithDivider />

            <MyCardForResourcesWithImage accessibilityLabel={"ExampleCard"} text={"Example Card With Image"} assetId={undefined} thumbHash={undefined} />
        </MyScrollView>
      </MySafeAreaView>
  );
}
