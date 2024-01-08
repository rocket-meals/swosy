// @ts-nocheck
import React, {useState} from 'react';
import {Box, HStack, View,} from 'native-base';
import {ConfigHolder} from "../ConfigHolder";
import {useProjectColor} from "./useProjectColor";
import {HeaderWithActions} from "./HeaderWithActions";
import {RequiredNavigationBar} from "./RequiredNavigationBar";
import {CloneChildrenWithProps} from "../helper/CloneChildrenWithProps";
import {useThemedShade} from "../helper/MyThemedBox";

export const BaseLayout = ({
						   children,
						   navigation,
						   title,
               showbackbutton,
               header,
						   doclink,
              headerBackgroundColor,
              headerShadeLevel,
              useProjectHeaderBackgroundColor,
              headerTextColor,
						   navigateTo,
						   _status,
						   _hStack,
						   ...props
					   }: any) => {

  const [dimension, setDimenstion] = useState({width: undefined, height: undefined})
  const projectColor = useProjectColor();
  if(headerShadeLevel===undefined) {
    headerShadeLevel = 1;
  }
  const themedBackgroundColor = useThemedShade(headerShadeLevel);

  if(!headerBackgroundColor){
    if(useProjectHeaderBackgroundColor){
      headerBackgroundColor = projectColor;
    } else {
      headerBackgroundColor = themedBackgroundColor
    }
  }

  const childrenWithProps = CloneChildrenWithProps.passProps(children, {dimension: dimension});
  const rendered = childrenWithProps;

  function setDimensions(event){
    const {width, height} = event.nativeEvent.layout;
    // We can set the state to allow for reference through the state property, and will also change
    let adjustedHeight = undefined;
    if(!!height){
      adjustedHeight = parseInt(height); // since we have a small padding we want to remove the height
    }

    setDimenstion({width: width, height: adjustedHeight});
  }

	function renderBaseLayoutContent(){
	  let pluginRenderBaseLayoutContent = ConfigHolder.plugin.renderBaseLayoutContent;

	  return (
      pluginRenderBaseLayoutContent(
        <View style={{width: "100%", flex: 1, alignItems: "center"}} onLayout={props.onLayout}>
          {rendered}
        </View>
      )
    )
  }

  function renderHeadingContent(){
    if(header!==undefined){
      return header;
    } else {
      return(
        <HeaderWithActions
          backgroundColor={headerBackgroundColor}
          textColor={headerTextColor}
          title={title}
          showbackbutton={showbackbutton}
        />
      )
    }
  }

	return (
    <View style={{height: "100%", width: "100%", flexDirection: "column-reverse"}}>
      <RequiredNavigationBar textColor={headerTextColor} backgroundColor={headerBackgroundColor} />
      <View style={{flex: 1, width: "100%", height: "100%"}} onLayout={setDimensions} >
        <>
          <Box
            style={{paddingHorizontal: 0, margin: 0}}
            {...props}
            flex={1}
            px={0}
            mx="auto"
            pt={navigation ? '70px' : 0}
            width={"100%"}
            // style={{
            // 	backdropFilter: 'blur(10px)',
            // }}
          >
            <HStack
              left={0}
              top={0}
              right={0}
              px={0}
              zIndex={-1}
              {..._hStack}
            >
              <HStack py={0}
                // alignItems="flex-end"
                      alignItems="center"
                      w="100%"
              >
                {renderHeadingContent()}
              </HStack>
            </HStack>
            <View style={{width: "100%", flex: 1, alignItems: "center"}} >
              {renderBaseLayoutContent()}
            </View>

          </Box>
        </>
      </View>
    </View>
	);

	// { base: '100%', lg: '768px', xl: '1080px' }
};
