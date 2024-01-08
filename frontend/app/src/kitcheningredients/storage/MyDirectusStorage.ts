// @ts-nocheck
import {Platform} from "react-native";

let MyDirectusStorage;

if(Platform.OS==="web"){
  MyDirectusStorage = require("./MyDirectusStorageWeb").MyDirectusStorageWeb;
} else {
  MyDirectusStorage = require("./MyDirectusStorageNative").MyDirectusStorageNative;
}

export { MyDirectusStorage }
