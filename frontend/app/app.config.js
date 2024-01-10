function getBackendURL(){
    let backendUrlForSwosy = "https://swosy.rocket-meals.de/rocket-meals/api"


    let fallbackBackendUrl = "http://127.0.0.1/rocketmeals/api"; // For local testing
    fallbackBackendUrl = "https://rocket-meals.de/demo/api"; // For demo purpose
    //fallbackBackendUrl = "https://studi-futter.rocket-meals.de/backend/api"; // For demo purpose

    let backendUrl = process.env.BACKEND_URL

    let customBackendUrl = process.env.CUSTOM_BACKEND_URL;
    if(!!customBackendUrl && customBackendUrl!==""){
        backendUrl = customBackendUrl
    }

    if(!backendUrl){
        backendUrl = fallbackBackendUrl
    }
    return backendUrl;
}

export default {
    extra: {
        BACKEND_URL: getBackendURL(),
        BASE_PATH: process.env.BASE_PATH || "rocketmeals/app/",
    },
        "scheme": "de.rocketmeals.demo", // npx uri-scheme list // npx uri-scheme remove de.rocketmeals.demo // npx uri-scheme add <Your SCHEME>
        "experienceId": '@baumgartnersoftware/rocketmealsdemo', // visit the README.md for this section: PushNotification
        "name": "rocketmealsdemo",
        "slug": "rocketmealsdemo",
        "version": "1.0.2",
        "orientation": "portrait",
        "icon": "./assets/icon.png",
        "splash": {
            "image": "./assets/splash.png",
            "resizeMode": "contain",
            "backgroundColor": "#ffffff"
        },
        "updates": {
            "fallbackToCacheTimeout": 0
        },
        "assetBundlePatterns": ["**/*"],
        "ios": {
            "supportsTablet": true,
            "bundleIdentifier": "de.rocketmeals.demo"
        },
        "android": {
            "googleServicesFile": "./google-services.json",
            "adaptiveIcon": {
                "foregroundImage": "./assets/adaptive-icon.png",
                "backgroundColor": "#FFFFFF"
            },
            "package": "de.rocketmeals.demo"
        },
        "web": {
            "favicon": "./assets/favicon.png",
            "description": "A sample application that showcases various components that come built-in with NativeBase v3."
        },
        "description": ""
}
