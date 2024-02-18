import Color from 'tinycolor2';
import {useIsDarkTheme} from "@/states/ColorScheme";
import {useMemo} from "react";
import {useViewBackgroundColor} from "@/components/Themed";

// TODO: memorize this function to reduce computation load and improve performance
/**
 * Calculates the contrast ratio between two colors based on their luminance.
 * The function uses the WCAG formula for contrast ratio, which is (L1 + 0.05) / (L2 + 0.05),
 * where L1 is the luminance of the lighter color and L2 is the luminance of the darker color.
 * Luminance is calculated using the provided `Color` library function `getLuminance()`.
 *
 * @param {string | undefined} foreground - The foreground color in any CSS color format.
 * @param {string} background - The background color in any CSS color format.
 * @returns {number} - The contrast ratio between the foreground and background colors.
 */
export function getContrastRatio(foreground: string | undefined, background: string): number {
  const lumA = Color(foreground).getLuminance();
  const lumB = Color(background).getLuminance();
  return (Math.max(lumA, lumB) + 0.05) / (Math.min(lumA, lumB) + 0.05);
}

export function getColorAsHex(color: string | undefined): string | undefined {
  if (!color) {
    return undefined;
  }
  return Color(color).toHexString();
}

export function useLighterOrDarkerColorForSelection(color: string | undefined): string {
    return getLighterOrDarkerColorByContrast(color, ContrastThresholdSelectedItems.MaternaLandNiedersachsen);
}

function getLighterOrDarkerColorByContrast(color: string | undefined, contrastRatio: number): string {
    return useMemo(() => {
        if (!color) {
            return "transparent";
        }
        const backgroundColor = Color(color);
        const isDark = backgroundColor.isDark();
        let modifiedColor = backgroundColor.clone();
        let step = 0.1; // Adjust step to be more precise
        let currentContrastRatio = getContrastRatio(modifiedColor.toHexString(), color);

        // Loop until the contrast ratio is met or improved
        while (currentContrastRatio < contrastRatio) {
            if(isDark){
                modifiedColor = modifiedColor.lighten(step);
            } else {
                modifiedColor = modifiedColor.darken(step);
            }
            currentContrastRatio = getContrastRatio(modifiedColor.toHexString(), color);
        }

        return modifiedColor.toHexString();
    }, [color, contrastRatio]); // Only recompute if color or contrastRatio changes
}

export enum ContrastThresholdSelectedItems {
    MaternaLandNiedersachsen = 1.9,
}

enum ContrastThreshold {
    MaternaLandNiedersachsen = 4.5,
    WCAG_AA = 3.0,
    WCAG_AAA = 7.0,
}

/**
 * Determines the most readable contrast color (either dark or light text) based on the provided background color.
 * The function first checks for a custom contrast color set in `ConfigHolder.plugin.customContrastColor`.
 * If not found, it calculates the contrast ratios for dark and light text against the background color.
 * The function adheres to contrast thresholds defined by Materna Land Niedersachsen and W3C WCAG AA.
 * It selects the text color (dark or light) that provides the best readability based on the current color mode (dark or light)
 * and the contrast thresholds.
 *
 * @param {string | undefined} trueBg - The background color for which the contrast color is to be calculated.
 * @param isDarkMode
 * @param contrastThreshold {number}
 * @returns {string} - The hex color code of the most readable contrast color (either dark or light text).
 */
function useMyContrastColorByColorMode(trueBg: string | undefined, isDarkMode: boolean, contrastThreshold: ContrastThreshold): string {

  let trueDarkText = '#000000';
  let trueLightText = '#FFFFFF';

  const darkTextConstrast = getContrastRatio(trueBg, trueDarkText);
  const lightTextConstrast = getContrastRatio(trueBg, trueLightText);

  /**
  if(darkTextConstrast >= lightTextConstrast){
      return trueDarkText;
  }
  return trueLightText;
      */

  // if dark mode, return light text if contrast is good enough
  if(isDarkMode && lightTextConstrast >= contrastThreshold){
    return trueLightText;
  }
  // if light mode, return dark text if contrast is good enough
  if(!isDarkMode && darkTextConstrast >= contrastThreshold){
    return trueDarkText;
  }
  // otherwise return the text color with the highest contrast
  return darkTextConstrast > lightTextConstrast ? trueDarkText : trueLightText;
}

/**
 * Custom hook that returns the most readable contrast color for a given background color,
 * taking into account the current theme mode (dark or light).
 * It delegates the decision of contrast color to `useMyContrastColorByColorMode` function
 * based on the value of `isDarkTheme`.
 *
 * @param {string | undefined} trueBg - The background color for which the contrast color is to be calculated.
 * @returns {string} - The hex color code of the most readable contrast color, suitable for the current theme mode.
 */
export function useMyContrastColor(trueBg: string | undefined) {
    const isDarkTheme = useIsDarkTheme();
    const viewBackgroundColor = useViewBackgroundColor()
    if(trueBg==="transparent"){
        trueBg = viewBackgroundColor;
    }
    return useMyContrastColorByColorMode(trueBg, isDarkTheme, ContrastThreshold.MaternaLandNiedersachsen);
}