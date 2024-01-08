// @ts-nocheck

import type {PluginInterface} from "./PluginInterface";
import {App} from "./App";

export class ConfigHolder{

  static advancedSettings: any;
  // loadedHeaderInitialState;
  // loadedContentInitialState;


  static useCookiePolicy: boolean = true;
  static displayThemeFloater: boolean = false;
  static instance: App = null;
  static plugin: PluginInterface = null;
  static styleConfig = null;
  static config = null;
  static currentpackageJson = null;
  static currentpackageJsonLock = null;
  static thirdpartyLicense = null;
  static AppConfig = null;
  static CustomDirectusTypes: any = null;

  static authConfig = {
    autoLogin: true,
    startAsAnonymous: false,
    mail: {
      visible: true,
      registerVisible: false,
      position: 4
    },
    guest: {
      visible: true,
      position: 1
    },
    anonymous: {
      visible: true,
      callbackBefore: async (handleContinue, actionsheet) => {
        handleContinue();
        /**
        actionsheet.show({
          title: "Anonymous Proceed?",
          description: "Not all actions will be possible",
          onAccept: () => {
            handleContinue()
          }
        });
        */
      },
      position: 3
    },
    external: {
      visible: true,
      position: 2
    }
  }

}
