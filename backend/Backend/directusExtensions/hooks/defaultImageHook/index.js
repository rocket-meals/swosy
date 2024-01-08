import {DefaultImageHelperHook} from "./DefaultImageHelperHook.js";


function registerHook(registerFunctions, context){
    let collection_names = ["foods", "news", "buildings"];
    let image_field_name = "image";

    DefaultImageHelperHook.registerHook(collection_names, image_field_name, registerFunctions, context);
}

export default registerHook.bind(null);