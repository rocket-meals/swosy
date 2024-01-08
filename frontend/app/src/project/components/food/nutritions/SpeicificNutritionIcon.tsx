// @ts-nocheck
import React, {FunctionComponent, useEffect, useState} from "react";

import calories from "./icons/NutritionIconCaloriesSvg";
import carbohydrate from "./icons/NutritionIconCarbohydrateSvg";
import fat from "./icons/NutritionIconFatSvg";
import protein from "./icons/NutritionIconProteinSvg";
import salt from "./icons/NutritionIconSaltSvg";
import fiber from "./icons/NutritionIconFiberSvg";
import saturatedFat from "./icons/NutritionIconSaturatedFatSvg";
import sugar from "./icons/NutritionIconSugarSvg";


import {CrossNativeBaseSvg} from "../../CrossNativeBaseSvg";

export interface AppState{
    nutritionkey: string,
    contentSpacer?: any
}
export const SpeicificNutritionIcon: FunctionComponent<AppState> = (props) => {

    let svg = null;

    switch (props.nutritionkey){
        case "calories_kcal": svg = calories; break;
        case "sugar_g": svg = sugar; break;
        case "fiber_g": svg = fiber; break;
        case "protein_g": svg = protein; break;
        case "sodium_g": svg = salt; break;
        case "carbohydrate_g": svg = carbohydrate; break;
        case "saturated_fat_g": svg = saturatedFat; break;
        case "fat_g": svg = fat; break;
    }

  return (
      <CrossNativeBaseSvg svg={svg} contentSpacer={props?.contentSpacer} />
  )
}
