import {MyGridFlatList} from "@/components/grid/MyGridFlatList";
import {MyCardForResourcesWithImage} from "@/components/card/MyCardForResourcesWithImage";
import {ListRenderItemInfo} from "react-native";
import {useState} from "react";
import {Heading, View} from "@/components/Themed";
import {SettingsRowTextEdit} from "@/components/settings/SettingsRowTextEdit";
import {useMyGridListDefaultColumns} from "@/components/grid/MyGridFlatListDefaultColumns";
import {MySafeAreaView} from "@/components/MySafeAreaView";
import {MyScrollView} from "@/components/scrollview/MyScrollView";
import {MyButton} from "@/components/buttons/MyButton";

export default function ButtonTestScreen() {

  return (
    <MySafeAreaView>
        <MyScrollView>
            <Heading>{"Button Takes only space required"}</Heading>
            <View style={{
                width: 200,
                backgroundColor: "gray",
                padding: 20,
                flexDirection: "column",
            }}>
                <MyButton accessibilityLabel={"Test"} text={"Test"} useOnlyNecessarySpace={true} leftIcon={"account"} leftIconColoredBox={true} />
                <MyButton accessibilityLabel={"Test"} useOnlyNecessarySpace={true} leftIcon={"account"} leftIconColoredBox={true} />
                <MyButton accessibilityLabel={"Test"} text={"Test"} useOnlyNecessarySpace={true} leftIconColoredBox={true} />
                <MyButton accessibilityLabel={"Test"} text={"Hallo dies ist ein langer Text der umgebrochen werden soll"} leftIconColoredBox={true} useOnlyNecessarySpace={true} leftIcon={"account"} />
            </View>
            <Heading>{"Button Takes only space required in row"}</Heading>
            <View style={{
                width: 200,
                backgroundColor: "gray",
                padding: 20,
                flexDirection: "row",
                flexWrap: "wrap",
            }}>
                <MyButton accessibilityLabel={"Test"} text={"Test"} useOnlyNecessarySpace={true} leftIcon={"account"} leftIconColoredBox={true} />
                <MyButton accessibilityLabel={"Test"} useOnlyNecessarySpace={true} leftIcon={"account"} leftIconColoredBox={true} />
                <MyButton accessibilityLabel={"Test"} text={"Test"} useOnlyNecessarySpace={true} leftIconColoredBox={true} />
                <MyButton accessibilityLabel={"Test"} text={"Hallo dies ist ein langer Text der umgebrochen werden soll"} leftIconColoredBox={true} useOnlyNecessarySpace={true} leftIcon={"account"} />
            </View>
            <Heading>{"Button Takes whole space given"}</Heading>
            <View style={{
                width: 200,
                backgroundColor: "gray",
                padding: 20,
            }}>
                <MyButton accessibilityLabel={"Test"} text={"Test"} useOnlyNecessarySpace={false} leftIcon={"account"} leftIconColoredBox={true} />
                <MyButton accessibilityLabel={"Test"} useOnlyNecessarySpace={false} leftIcon={"account"} leftIconColoredBox={true} />
                <MyButton accessibilityLabel={"Test"} text={"Test"} useOnlyNecessarySpace={false} leftIconColoredBox={true} />
                <MyButton accessibilityLabel={"Test"} text={"Hallo dies ist ein langer Text der umgebrochen werden soll"} leftIconColoredBox={true} useOnlyNecessarySpace={false} leftIcon={"account"} />
            </View>
        </MyScrollView>
    </MySafeAreaView>
  );
}
