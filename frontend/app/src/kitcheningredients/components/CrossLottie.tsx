// @ts-nocheck
import React, {useEffect, useState} from "react";
import {Platform} from "react-native";

let LottiePlatformSpecific;

if(Platform.OS==="web"){
  LottiePlatformSpecific = require("./LottieWeb").LottieWeb;
} else {
  LottiePlatformSpecific = require("./LottieNative").LottieNative;
}

export const CrossLottie = (props) => {

    return <LottiePlatformSpecific {...props} />

}
