import {MyActionsheet} from "../../../kitcheningredients";
import React, {FunctionComponent} from "react";
import {ScrollView, Text, View} from "native-base";
import {Markings} from "../../directusTypes/types";
import {useAppTranslation} from "../translations/AppTranslation";
import {TouchableOpacity} from "react-native";
import {MarkingSettingsList} from "./MarkingSettingsList";
import {AnimationAllergene} from "../animations/AnimationAllergene";
import {MyTouchableOpacity} from "../buttons/MyTouchableOpacity";

interface AppState {
    markings: Markings[]
}
export const MarkingActionSheet: FunctionComponent<AppState> = (props) => {

    const markings = props?.markings || [];
    const actionsheet = MyActionsheet.useActionsheet();

    const translationTitle = useAppTranslation("attention");
    const translationContent = useAppTranslation("marking_dislike_in_food");

    let handleCloseModal = () => {};

    return (
        <MyTouchableOpacity
            accessibilityLabel={translationTitle+"!: "+translationContent}
            onPress={() => {
                actionsheet.show({
                    title: <Text>{translationTitle}{" !"}</Text>,
                    renderCustomContent: (onCloseModal) => {
                        handleCloseModal = onCloseModal;
                        return (
                            <ScrollView style={{width: "100%"}}>
                                <View style={{width: "100%", justifyContent: "center", alignContent: "center", alignItems: "center"}}>
                                    <View>
                                        <Text>{translationContent}</Text>
                                    </View>
                                </View>
                                <AnimationAllergene />
                                <View style={{width: "100%", justifyContent: "center"}}>
                                    <MarkingSettingsList markings={markings} />
                                </View>
                            </ScrollView>
                        )
                    }
                });
            }}
        >
            {props.children}
        </MyTouchableOpacity>
    )
}
