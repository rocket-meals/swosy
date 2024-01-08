import {useColorModeValue, useToken} from "native-base";
import {ConfigHolder, useMyContrastColor, useProjectColor, useThemedShade} from "../../kitcheningredients";

export class ColorHelper{

    static darkenColor(color, percent){
        // The color should be a string in the format of "#RRGGBB"
        // percent should be a decimal between 0 and 1

        const num = parseInt(color.slice(1), 16),
            amt = Math.round(2.55 * percent),
            R = (num >> 16) + amt,
            B = ((num >> 8) & 0x00FF) + amt,
            G = (num & 0x0000FF) + amt;

        const newColor = 0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (B<255?B<1?0:B:255)*0x100 + (G<255?G<1?0:G:255);

        return "#" + newColor.toString(16).slice(1);
    }

    static useProjectColor(){
        return useProjectColor();
    }

    static useContrastColor(color){
        return useMyContrastColor(color);
    }

    static useDefaultDarkenColor(color){
        return ColorHelper.darkenColor(color, 10);
    }

    static useDarkenProjectColor(){
        let projectColor = ColorHelper.useProjectColor();
        return ColorHelper.useDefaultDarkenColor(projectColor);
    }

    static useBackgroundColor(){
        return useThemedShade(0);
    }

}
