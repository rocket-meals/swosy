import React, {FunctionComponent} from "react";
import {DrawerButton} from "./DrawerButton";
import {BackButton} from "./BackButton";

import {Heading, Text, View} from "native-base";
import {useSynchedDrawerConfig} from "../synchedstate/SynchedState";
import {Navigation} from "../navigation/Navigation";
import {useMyContrastColor} from "../theme/useMyContrastColor";
import {useProjectColor} from "./useProjectColor";
import {useThemedShade} from "../helper/MyThemedBox";
import {Layout} from "../templates/Layout";


export interface AppState{
	renderActions?: () => any;
	renderCustomTitle?: () => any;
	title?: any;
	renderCustomBottom?: () => any;
	showbackbutton?: boolean;
  backgroundColor?: string
  textColor?: string,
  headerShadeLevel?: number
  useProjectHeaderBackgroundColor?: boolean
}
export const HeaderWithActions: FunctionComponent<AppState> = (props) => {

  let isSmallDevice = Layout.usesSmallDevice();

  const projectColor = useProjectColor();
  let headerShadeLevel = props?.headerShadeLevel
  if(headerShadeLevel===undefined) {
    headerShadeLevel = 1;
  }
  const themedBackgroundColor = useThemedShade(headerShadeLevel);
  let headerBackgroundColor = props?.backgroundColor;

  if(!headerBackgroundColor){
    if(props?.useProjectHeaderBackgroundColor){
      headerBackgroundColor = projectColor;
    } else {
      headerBackgroundColor = themedBackgroundColor
    }
  }

  let headerTextColor = props?.textColor;
  if(!headerTextColor){
    headerTextColor = useMyContrastColor(headerBackgroundColor);
  }
	const textColor = headerTextColor

  const [drawerConfig, setDrawerConfig] = useSynchedDrawerConfig();
  let drawerPosition = drawerConfig?.drawerPosition || 'left';
  let flexDirection: "row" | "row-reverse" | "column" | "column-reverse" = drawerPosition === 'left' ? "row" : "row-reverse";
  let textAlign = drawerPosition === 'left' ? "left" : "right";

  const [history, setHistory] = Navigation.useNavigationHistory();

	const showBackButton = props?.showbackbutton

	function renderDrawerButton(){
		if(!showBackButton){
		  const isHidden = !isSmallDevice;
		  let additionalStyle = {};
		  if(isHidden){
		    additionalStyle["opacity"] = 0
		  }

			return(
				<View
					aria-hidden={isHidden ? "true" : "false"}
					importantForAccessibility={isHidden ? 'no' : 'auto'}
					accessibilityLabel={isHidden ? "" : "Menu"} style={additionalStyle}>
					<DrawerButton hidden={isHidden} color={textColor} />
				</View>
			)
		} else {
			return (
				<View accessibilityLabel={"Back"}>
					<BackButton color={textColor} />
				</View>
			)
		}
	}

	function renderTitle(){
		if(props?.renderCustomTitle){
			return props.renderCustomTitle();
		} else if(props?.title){
			return(
          <Heading
            textAlign={textAlign}
            style={{
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Text color={textColor}>{props?.title}</Text>
          </Heading>
			)
		}
	}

	function renderActions(){
		if(props?.renderActions){
			return props.renderActions();
		}
		return null;
	}

	function renderBottomRow(){
		if(props?.renderCustomBottom){
			return props.renderCustomBottom();
		}
	}

	function renderHeader(){
		return(
			<View style={{width: "100%", backgroundColor: headerBackgroundColor}}>
				<View style={{flexDirection: flexDirection, width: "100%", alignItems: "center"}}>
					{renderDrawerButton()}
					<View style={{flex: 1,justifyContent: "flex-start"}}>
						{renderTitle()}
					</View>
					<View style={{justifyContent: "flex-end", flexDirection: "row", alignItems: "center"}}>
						{renderActions()}
					</View>
          <View style={{width: 4}} />
				</View>
				<View style={{flexDirection: "row", width: "100%", alignItems: "center"}}>
					{renderBottomRow()}
				</View>
			</View>
		)
	}

	return(
		renderHeader()
	)
}
