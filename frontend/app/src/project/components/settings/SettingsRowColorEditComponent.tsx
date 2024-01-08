// @ts-nocheck
import React, {FunctionComponent} from "react";
import {Icon, MyActionsheet} from "../../../kitcheningredients";
import {SettingsRow} from "../../components/settings/SettingsRow";
import {ColorIcon} from "../icons/ColorIcon";
import {Text, View} from "native-base";
import {SimpleColorPicker} from "../colorPicker/SimpleColorPicker";
import {AccessibilityRoles} from "../../../kitcheningredients/helper/AccessibilityRoles";

interface AppState {
    icon?: any;
    description?: any;
    initialColor?: any;
    onChange?: (newColor: string) => void;
}
export const SettingsRowColorEditComponent: FunctionComponent<AppState> = (props) => {

    const [color, setColor] = React.useState(props?.initialColor || "red");

    const width = 20;

    const actionsheet = MyActionsheet.useActionsheet();

    const icon = props?.icon || <ColorIcon/>;
    const description = props?.description || "Color";

    let handleCloseModal = () => {};

    async function onChange(newColor){
        if(props?.onChange){
            let success = await props.onChange(newColor);
            if(success){
                setColor(newColor);
                if(handleCloseModal){
                    handleCloseModal();
                }
            }
            return success;
        }
        return true;
    }

    function onPress(){
        actionsheet.show({
            title: description,
            renderCustomContent: (onCloseModal) => {
                handleCloseModal = onCloseModal;
                return (
                    <View style={{width: "100%", justifyContent: "center"}}>
                        <SimpleColorPicker onColorChange={onChange} />
                    </View>
                )
            }
        });
    }

    function renderColor(){
        return (
            <View style={{width: "100%", alignItems: "flex-end"}}>
                <View style={{backgroundColor: color, borderColor: "black", borderWidth: 1, borderRadius: width, width: width, height: width}} />
            </View>
        )
    }

    function renderContent(){
        return <View style={{flexDirection: "row", alignItems: "center"}}>
            <Text>{description}</Text>
        </View>
    }

  return (
          <SettingsRow accessibilityRole={AccessibilityRoles.adjustable} onPress={onPress} accessibilityLabel={description} leftContent={renderContent()} rightContent={renderColor()} leftIcon={icon} />
  )
}
