import React, {useEffect, useState} from "react";
import {CookieInformation} from "../screens/legalRequirements/CookieInformation";
import {RequiredNavigationBar} from "./RequiredNavigationBar";
import {KeyboardAvoidingView, View} from "native-base";

import {Platform, StatusBar} from "react-native";
import {KitchenSafeAreaView} from "../components/KitchenSafeAreaView";

const EmptyTemplate = React.memo(({
                                    children,
                                    navigation,
                                    title,
                                    navigateTo,
                                    serverInfo,
                                    _status,
                                    _hStack,
                                    autoOpenCookies,
                                    ...props}: any) => {

/**
  const [rendered, setRendered] = useState([]);


  useEffect(() => {
    setTimeout(() => {
      const childrenWithProps = CloneChildrenWithProps.passProps(children, {dimension: dimension});
      setRendered(childrenWithProps);
    }, 0)
  }, []);
  */



  const paddingTop = Platform.OS === "android" ? StatusBar.currentHeight : 0
  const keyboardVerticalOffset = paddingTop;



  return(
    <KitchenSafeAreaView>
      <KeyboardAvoidingView
        keyboardVerticalOffset = {keyboardVerticalOffset} // adjust the value here if you need more padding
        style = {{height: "100%", width: "100%"}}
        behavior={Platform.OS === "ios" ? "padding" : "height"} >
        <View style={{height: "100%", width: "100%"}}>
            {children}
          <CookieInformation autoOpenCookies={autoOpenCookies} />
        </View>
      </KeyboardAvoidingView>
    </KitchenSafeAreaView>
  )
});

export { EmptyTemplate };
