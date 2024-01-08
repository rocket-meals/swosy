/**
 * This file handles Web-App Builds
 * If you want to adapt the iOS and Android Entryfile open: index.js
 */

import * as SplashScreen from 'expo-splash-screen';
import {Platform} from "react-native";
import codePush from "react-native-code-push";

import {registerRootComponent} from 'expo';
import {App, ConfigHolder, MyDirectusStorage} from './src/kitcheningredients'
import Project from "./src/project/Project";
import nativebaseConfig from "./nativebase.config";
import styleConfig from "./styleConfig.json";
import config from "./config.json";
import currentpackageJson from "./package.json";
import currentpackageJsonLock from "./package-lock.json";
import thirdpartyLicense from "./thirdpartyLicense.json"
import AppConfig from "./app.config"
import {CodePushWrapper} from "./src/project/codepush/CodePushWrapper";

ConfigHolder.storage = new MyDirectusStorage();
ConfigHolder.plugin = new Project()
ConfigHolder.nativebaseConfig = nativebaseConfig
ConfigHolder.styleConfig = styleConfig
ConfigHolder.config = config
ConfigHolder.currentpackageJson = currentpackageJson
ConfigHolder.currentpackageJsonLock = currentpackageJsonLock
ConfigHolder.thirdpartyLicense = thirdpartyLicense
ConfigHolder.AppConfig = AppConfig

ConfigHolder.useCookiePolicy = false;

ConfigHolder.displayThemeFloater = false;

ConfigHolder.authConfig.mail.visible = true;
ConfigHolder.authConfig.mail.registerVisible = false;
ConfigHolder.authConfig.external.visible = true;
ConfigHolder.authConfig.anonymous.visible = true;
ConfigHolder.authConfig.autoLogin = true;

async function main() {
    let isIOS = Platform.OS === "ios";
    console.log("Platform: " + Platform.OS);

    const codepushConfig = config.codepush || {};
    let codepushActive = codepushConfig.active || false;
    //codepushActive = false;

    const deploymentType = codepushConfig.deploymentType || null;
    const deploymentKeys = codepushConfig.keys || {};
    let deploymentKeysForOS = isIOS ? deploymentKeys["ios"] : deploymentKeys["android"];
    if (!deploymentKeysForOS) {
        deploymentKeysForOS = {};
    }
    let deploymentKey = null;
    if (!!deploymentType) {
        deploymentKey = deploymentKeysForOS[deploymentType];
    }

    console.log("codepushActive: " + codepushActive);
    console.log("deploymentType: " + deploymentType);
    console.log("deploymentKey: " + deploymentKey);

    if (!!codepushActive && !!deploymentType && !!deploymentKey) { //if codepush is used
        const FREQUENCY = codePush.CheckFrequency.ON_APP_RESUME
        const codePushOptions = {
            deploymentKey: deploymentKey,
            checkFrequency: FREQUENCY,
            updateDialog: true,
            installMode: codePush.InstallMode.ON_NEXT_RESUME, // codePush.InstallMode.IMMEDIATE, //
        }

        // registerRootComponent calls AppRegistry.registerComponent('main', () => App);
        // It also ensures that whether you load the app in the Expo client or in a native build,
        // the environment is set up appropriately
        SplashScreen.preventAutoHideAsync();

        registerRootComponent(codePush(codePushOptions)(CodePushWrapper));

        // For CodePush Debugging
        //registerRootComponent(CodePushDebugger);
    } else {
        // registerRootComponent calls AppRegistry.registerComponent('main', () => App);
        // It also ensures that whether you load the app in the Expo client or in a native build,
        // the environment is set up appropriately
        registerRootComponent(App);
    }
}

main();

//registerRootComponent(App);
