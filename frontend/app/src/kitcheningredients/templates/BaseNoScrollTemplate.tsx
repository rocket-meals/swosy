import React, {FunctionComponent} from "react";
import {BaseLayout} from "./BaseLayout";
import ServerAPI from "../ServerAPI";
import {View, Text} from "native-base";
import {CloneChildrenWithProps} from "../helper/CloneChildrenWithProps";
import {NavigatorHelper} from "./../navigation/NavigatorHelper";
import {Platform, StatusBar} from "react-native";
import {EmptyTemplate} from "./EmptyTemplate";
import {KitchenSkeleton} from "../project/KitchenSkeleton";
import {ConfigHolder} from "../ConfigHolder";

export interface BaseNoScrollTemplateProps{
  title?: string,
  header?: JSX.Element,
  serverInfo?: any,
  autoOpenCookies?: boolean,
  headerBackgroundColor?: string,
  headerShadeLevel?: number,
  useProjectHeaderBackgroundColor?: boolean,
  headerTextColor?: string,
}

const BaseNoScrollTemplate: FunctionComponent<BaseNoScrollTemplateProps> = React.memo(({
                                                                                         children,
                                                                                         title,
                                                                                         header,
                                                                                         headerBackgroundColor,
                                                                                         headerShadeLevel,
                                                                                         useProjectHeaderBackgroundColor,
                                                                                         headerTextColor,
                                                                                         _status,
                                                                                         _hStack,
                                                                                         ...props
                                                                                       }: any) => {

  const params = props?.route?.params;
  const serverInfo = ServerAPI.tempStore.serverInfo;

  let loadedHeaderInitialState = ConfigHolder.advancedSettings?.loadedHeaderInitialState || true;
  let loadedContentInitialState = ConfigHolder.advancedSettings?.loadedContentInitialState;

  const [renderHeader, setRenderHeader] = React.useState(loadedHeaderInitialState);
  const [renderContent, setRenderContent] = React.useState(loadedContentInitialState);
  const [showLoader, setShowLoader] = React.useState(false);

  const childrenWithProps = CloneChildrenWithProps.passProps(children, {...props});

  let showbackbutton = params?.showbackbutton;
  if(NavigatorHelper.getHistory()?.length<=1){
    showbackbutton = false;
  }

  React.useEffect(() => {
    setTimeout(() => {
      setRenderHeader(true);
    }, 1)
    setTimeout(() => {
      setShowLoader(true);
    }, 1000)
  }, []);

  React.useEffect(() => {
    if(renderHeader && !renderContent) {
      setTimeout(() => {
        setRenderContent(true);
      }, 0)
    }
  }, [renderHeader]);

  const paddingTop = Platform.OS === "android" ? StatusBar.currentHeight : 0
  const keyboardVerticalOffset = paddingTop;

  let renderedContent = null;
  if(showLoader){
    renderedContent = (
      <KitchenSkeleton />
    )
  }
  if(renderContent){
    renderedContent = childrenWithProps
  }

  let renderedHeader = undefined;
  if(renderHeader){
    renderedHeader = header;
  }

  return (
    <EmptyTemplate autoOpenCookies={props?.autoOpenCookies}>
      <View flex={1} flexDirection={"row"}>
        <BaseLayout
          title={title}
          serverInfo={serverInfo}
          headerBackgroundColor={headerBackgroundColor}
          headerShadeLevel={headerShadeLevel}
          useProjectHeaderBackgroundColor={useProjectHeaderBackgroundColor}
          headerTextColor={headerTextColor}
          header={renderedHeader}
          showbackbutton={showbackbutton} >
          <View style={{width: "100%", height: "100%"}} >
            {renderedContent}
          </View>
        </BaseLayout>
      </View>
    </EmptyTemplate>
  )
});

export { BaseNoScrollTemplate };
