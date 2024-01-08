// @ts-nocheck
import React from 'react';
import {ScrollView, View} from 'native-base';
import {ConfigHolder} from "../ConfigHolder";
import {DrawerButton} from "./DrawerButton";
import {useProjectColor} from "./useProjectColor";
import {RequiredSettingsButton} from "../screens/settings/RequiredSettingsButton";
import {useSynchedDrawerConfig} from "../synchedstate/SynchedState";
import {Layout} from "./Layout";

export const RequiredNavigationBar = ({
                                        children,
                                        navigation,
                                        title,
                                        showbackbutton,
                                        header,
                                        doclink,
                                        navigateTo,
                                        _status,
                                        _hStack,
                                        ...props
                                      }: any) => {

  const backgroundColor = props?.backgroundColor;
  const textColor = props?.textColor;

  let isSmallDevice = Layout.usesSmallDevice();

  const [drawerConfig, setDrawerConfig] = useSynchedDrawerConfig();
  let drawerPosition = drawerConfig?.drawerPosition || 'left';
  let flexDirection = drawerPosition === 'left' ? "row" : "row-reverse";

  let childContent = ConfigHolder.plugin.getBottomNavbarComponent();

  function renderChildren(childContent){
    if(!childContent){
        return null;
    }

    let childrenArray = []
    // Check if childContent is a single React Element or a Fragment
    if (React.Children.count(childContent.props.children) > 1) {
      // Convert children into array if childContent is a Fragment
      childrenArray = React.Children.toArray(childContent.props.children);
    } else {
      // Make an array with a single element if childContent is a single React Element
      childrenArray = [childContent];
    }

    return childrenArray.map((child, index) => (
      <View style={{paddingRight: 12}} key={index}>
        {child}
      </View>
    ));
  }

  const isHidden = !isSmallDevice;
  let additionalStyle = {};
  if(isHidden){
    additionalStyle["opacity"] = 0
  }

  let leftContent = (
    <View style={[{flexDirection: flexDirection, alignItems: "center"}, additionalStyle]}>
    <DrawerButton color={textColor} backgroundColor={backgroundColor} />
  </View>
  )

	return (
    <View style={{width: "100%", backgroundColor: props?.backgroundColor}}>
      <View style={{flexDirection: flexDirection, width: "100%", alignItems: "center"}}>
        {leftContent}
        <ScrollView
          horizontal
          contentContainerStyle={{flexGrow: 1, flexDirection: flexDirection}}
          showsHorizontalScrollIndicator={false}
        >
          {renderChildren(childContent)}
        </ScrollView>
        <RequiredSettingsButton textColor={textColor} backgroundColor={backgroundColor} />
      </View>

    </View>
	);

	// { base: '100%', lg: '768px', xl: '1080px' }
};
