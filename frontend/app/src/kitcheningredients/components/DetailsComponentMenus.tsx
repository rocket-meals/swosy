// @ts-nocheck
import React, {FunctionComponent, useState} from "react";
import {Text, View} from "native-base";
import {TouchableOpacity} from "react-native";
import {SettingsRowInner} from "./settings/SettingsRowInner";
import {SettingsSpacer} from "./settings/SettingsSpacer";
import {ScrollViewWithGradient} from "../utils/ScrollViewWithGradient";
import {useProjectColor} from "../templates/useProjectColor";
import {useMyContrastColor} from "../theme/useMyContrastColor";
import {AccessibilityRoles} from "../helper/AccessibilityRoles";

export type DetailsComponentMenuType = {
  color?: string,
  activeColor?: string,
  onPress?: (menuKey: string) => Promise<boolean | undefined>, // an async onPress function that returns a boolean or undefined
  element?: JSX.Element,
  menuButtonContent?: any | string,
  menuButtonText?: string,
  icon?: JSX.Element,
  amount?: number,
}

export interface AppState {
  // menus are a dict with DetailsComponentMenuType as value and a string as key
  menus: Record<string, DetailsComponentMenuType>,
  spacer?: any,
  size?: string,
  defaultMenuKey?: string,
  defaultColor?: string,
  defaultActiveColor?: string,
  defaultTextColor?: string,
  defaultActiveTextColor?: string,
  hideSelection?: boolean,
  style?: any,
  flex?: number,
  useScrollViewForHeader?: boolean,
}

export const DetailsComponentMenus: FunctionComponent<AppState> = (props) => {

  let projectColor = useProjectColor()

  let defaultButtonColor = props?.defaultColor || projectColor || "orange";
  let defaultTextColor = props?.defaultTextColor || useMyContrastColor(defaultButtonColor) || "white";
  let defaultActiveTextColor = props?.defaultActiveColor || defaultTextColor;

  if (props?.hideSelection) {
    defaultActiveTextColor = defaultTextColor;
  }

  const useScrollViewForHeader = props?.useScrollViewForHeader || false;

  const menus = props.menus || {};
  const menuKeys = Object.keys(menus);
  const defaultMenuKey = props?.defaultMenuKey || menuKeys[0];

  const [selectedMenuKey, setSelectedMenuKey] = useState(defaultMenuKey);
  let selectedMenu = menus[selectedMenuKey];
  let element = selectedMenu?.element;

  function renderMenuButton(menuKey) {
    let menu = menus[menuKey];
    let isSelected = selectedMenuKey === menuKey;

    let color = menu?.color || defaultButtonColor;

    let buttonContent = menu?.menuButtonContent;
    let buttonText = menu?.menuButtonText;
    const onPressMenu = menu?.onPress;

    let amount = menu?.amount;
    let amountText = "";
    if (amount !== undefined) {
      amountText = " (" + amount + ")";
    }

    let icon = menu?.icon;
    let renderedIcon = null;
    if (!!icon) {
      renderedIcon = icon;
    }

    let additionalStyle = {};
    let fontColor = defaultTextColor;
    let activeColorHighlight = undefined
    if (isSelected && !props?.hideSelection) {
      activeColorHighlight = defaultActiveTextColor;
    }

    let usedMenuButtonContent = null;
    if (buttonText !== undefined) {
      usedMenuButtonContent = <Text color={fontColor}>{buttonText}</Text>
    }
    if (buttonContent !== undefined) {
      usedMenuButtonContent = buttonContent;
    }

    let heightHighlight = 2;

    let leftContent = (
      <View style={{flexDirection: "column", alignItems: "center"}}>
        <View style={{flexDirection: "row", alignItems: "center"}}>
          {usedMenuButtonContent}<Text color={fontColor}>{amountText}</Text>
        </View>
        <View style={{width: "100%", backgroundColor: activeColorHighlight, height: heightHighlight}}></View>
      </View>
    )

    return (
      <View style={{marginHorizontal: 5, marginTop: 5, marginBottom: 0}} key={menuKey}>
        <TouchableOpacity
            accessibilityState={{expanded: isSelected}}
            accessibilityRole={AccessibilityRoles.tab}
            style={[{
          borderColor: "transparent",
          borderWidth: 0,
          justifyContent: "center",
          flexDirection: "row",
          backgroundColor: color,
          borderRadius: 10
        }, additionalStyle]}
                          onPress={async () => {
                            let proceed = true;
                            if (onPressMenu) {
                              let result = await onPressMenu(menuKey);
                              if (result !== undefined && result !== null) {
                                proceed = result;
                              }
                            }
                            if (proceed) {
                              setSelectedMenuKey(menuKey)
                            }
                          }}
        >
          <SettingsRowInner leftContent={leftContent} leftIcon={renderedIcon} rightIcon={null}/>
        </TouchableOpacity>
      </View>
    )
  }

  function renderMenuButtons() {
    let menuKeys = Object.keys(menus);
    let output = [];
    for (let menuKey of menuKeys) {
      if (menus[menuKey]) {
        output.push(renderMenuButton(menuKey))
      }
    }

    let style = props?.style || {
      width: "100%",
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      alignItems: "center"
    };

    let content: any = output;
    if (useScrollViewForHeader) {
      content = (
        <ScrollViewWithGradient
          scrollViewProps={{
            horizontal: true,
          }}
        >
          {output}
        </ScrollViewWithGradient>
      )
    }

    return (
      <View style={style}>
        {content}
      </View>
    )
  }

  const spacer = props?.spacer !== undefined ? props?.spacer : <SettingsSpacer/>;

  return (
    <View style={{width: "100%", flex: props?.flex}}>
      {renderMenuButtons()}
      {spacer}
      {element}
    </View>
  )

}
