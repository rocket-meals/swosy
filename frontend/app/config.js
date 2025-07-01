"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.studiFutterConfig = exports.swosyConfig = exports.devConfig = void 0;
exports.getVersion = getVersion;
exports.getBuildNumber = getBuildNumber;
exports.getIosBuildNumber = getIosBuildNumber;
exports.getCustomerConfig = getCustomerConfig;
function getVersion() {
    return "20.0.13";
}
function getBuildNumber() {
    return 144;
}
function getIosBuildNumber() {
    return getBuildNumber().toString();
}
exports.devConfig = {
    projectName: "Rocket Meals",
    projectSlug: "rocket-meals-dev",
    easUpdateId: "36f72583-5997-4602-8609-05f39444f2e7",
    easProjectId: "36f72583-5997-4602-8609-05f39444f2e7",
    appScheme: "app-rocket-meals",
    bundleIdIos: "de.baumgartner-software.rocket-meals-demo",
    bundleIdAndroid: "com.baumgartnersoftware.rocketmealsdev",
    baseUrl: "/rocket-meals",
    server_url: "https://test.rocket-meals.de/rocket-meals/api"
};
exports.swosyConfig = {
    projectName: "SWOSY 2.0",
    projectSlug: "rocket-meals-swosy",
    easUpdateId: "4147159f-d7b5-4db5-b6eb-f9988519950c",
    easProjectId: "4147159f-d7b5-4db5-b6eb-f9988519950c",
    appScheme: "app-rocket-meals-swosy",
    bundleIdIos: "de.baumgartner-software.swosy",
    bundleIdAndroid: "de.baumgartnersoftware.swosy",
    baseUrl: "/swosy",
    server_url: "https://swosy.rocket-meals.de/rocket-meals/api"
};
exports.studiFutterConfig = {
    projectName: "Studi|Futter",
    projectSlug: "rocket-meals-studi-futter",
    easUpdateId: "461671f9-774f-4bc4-80a8-5601313539b0",
    easProjectId: "461671f9-774f-4bc4-80a8-5601313539b0",
    appScheme: "app-rocket-meals-studi-futter",
    bundleIdIos: "de.stwh.app",
    bundleIdAndroid: "de.baumgartnersoftware.studifutter",
    baseUrl: "/studi-futter",
    server_url: "https://studi-futter.rocket-meals.de/rocket-meals/api"
};
function getCustomerConfig() {
    return exports.devConfig;
}
