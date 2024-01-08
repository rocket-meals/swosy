// @ts-nocheck
import React, {FunctionComponent} from 'react';
import {DrawerContentScrollView} from '@react-navigation/drawer';
import {View, Text} from "native-base";
import {ProjectLogo} from "../project/ProjectLogo";
import {ProjectName} from "../project/ProjectName";
import {MyThemedBox} from "../helper/MyThemedBox";
import {ExpandableDrawerItem} from "./ExpandableDrawerItem";
import {SafeAreaView} from "react-native";
import {RouteRegisterer} from "./RouteRegisterer";
import {ConfigHolder} from "../ConfigHolder";
import {Navigation} from "../navigation/Navigation";
import {LegalRequiredLinks} from "../screens/legalRequirements/LegalRequiredLinks";
import {TranslationKeys} from "../translations/TranslationKeys";
import {MyTouchableOpacity} from "../components/buttons/MyTouchableOpacity";
import {useSynchedDrawerConfig} from "../synchedstate/SynchedState";
import {DrawerButton} from "./../templates/DrawerButton";
import {Layout} from "../templates/Layout";
import {KitchenSafeAreaView} from "../components/KitchenSafeAreaView";

export const CustomDrawerContent: FunctionComponent = (props) => {

	let user = ConfigHolder.instance.getUser()

  const useTranslation = ConfigHolder.plugin.getUseTranslationFunction();
  const translation_home = useTranslation(TranslationKeys.home);

  let isSmallDevice = Layout.usesSmallDevice();

  const [drawerConfig, setDrawerConfig] = useSynchedDrawerConfig();
  let drawerPosition = drawerConfig?.drawerPosition || 'left';
  let flexDirection = drawerPosition === 'left' ? "row" : "row-reverse";

	function renderDrawerItems(){
		let output = [];

		let registeredMenusList = Navigation.menuGetRegisteredList();
		let sortedMenus = sortMenus(registeredMenusList);
		for(let i=0; i<sortedMenus.length; i++){
		  const menu = sortedMenus[i];
		  if(menu.key===Navigation.DEFAULT_MENU_KEY_ABOUT_US){ // Skip since we want to render them else where
		    continue;
      }
      if(menu.key===Navigation.DEFAULT_MENU_KEY_PRIVACY_POLICY){ // Skip since we want to render them else where
        continue;
      }
      if(menu.key===Navigation.DEFAULT_MENU_KEY_LICENSE){ // Skip since we want to render them else where
        continue;
      }

      output.push(<ExpandableDrawerItem key={menu?.key} menu={menu} level={0}/>);
    }

		return output;
	}

	function sortMenus(menus){
    return menus.sort((a, b) => {
      let positionA = a?.position || 0;
      let positionB = b?.position || 0;
      return positionB - positionA;
    })
  }

	function renderLegalRequirements(){
	  return (
      <MyThemedBox style={{flexDirection: "row", alignItems: "center"}}>
        <View style={{
          flex: 1,
          width: '100%',
          alignItems: "center", justifyContent: "center",
          flexDirection: 'row',
          flexWrap: 'wrap', // Enable wrapping of items
        }}>
          <LegalRequiredLinks />
        </View>
      </MyThemedBox>
    )
  }

	let bgColor = RouteRegisterer.getDrawerBackgroundColor();
	let customBackgroundStyle = {};
	if(!!bgColor){
		customBackgroundStyle = {backgroundColor: bgColor}
	}

	function renderDrawerCloseButton(){
	  if(isSmallDevice){
	    return(
        <View style={{width: "100%", flexDirection: flexDirection}}>
          <DrawerButton closeDrawer={true} backgroundColor={bgColor} />
        </View>
      )
    }
	  return null;
  }

	const padding = 18;



	return (
		<MyThemedBox style={[{height: "100%", overflow: "hidden"}, customBackgroundStyle]}>
			<KitchenSafeAreaView style={{height: "100%", width: "100%"}}>
        <MyTouchableOpacity
          key={"ProjectLogoItem"}
          style={{padding: padding}}
          accessibilityLabel={translation_home}
          onPress={() => {
            if(!user){
              Navigation.navigateTo(Navigation.DEFAULT_ROUTE_LOGIN)
            } else {
              Navigation.navigateHome()
            }
          }}
        >
          <View style={{flexDirection: "row", width: "100%"}} >
            <ProjectLogo rounded={true} />
              <View style={{width: "100%"}} >
                  <ProjectName themedColor={true} />
              </View>
          </View>
        </MyTouchableOpacity>
        <DrawerContentScrollView style={{paddingLeft: padding}} {...props}>
          {renderDrawerItems()}
        </DrawerContentScrollView>
				{renderLegalRequirements()}
        {renderDrawerCloseButton()}
			</KitchenSafeAreaView>
		</MyThemedBox>
	);
}
