import Color from 'tinycolor2';
import {useIsDarkTheme} from "@/helper/sync_state_helper/custom_sync_states/ColorScheme";

// TODO: memorize this function to reduce computation load and improve performance
export function getContrastRatio(foreground: string | undefined, background: string) {
  const lumA = Color(foreground).getLuminance();
  const lumB = Color(background).getLuminance();
  return (Math.max(lumA, lumB) + 0.05) / (Math.min(lumA, lumB) + 0.05);
}

function useMyContrastColorByColorMode(trueBg: string | undefined, isDarkMode: boolean) {

  let trueDarkText = '#000000';
  let trueLightText = '#FFFFFF';
  let contrastThreshold = 4.5;
  // contrastThreshold = 4.5; // Materna Land Niedersachsen
  // contrastThreshold =  3.0; // WCAG AA

  const darkTextConstrast = getContrastRatio(trueBg, trueDarkText);
  const lightTextConstrast = getContrastRatio(trueBg, trueLightText);

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

export function useMyContrastColor(trueBg: string | undefined) {
    const isDarkTheme = useIsDarkTheme();
    return useMyContrastColorByColorMode(trueBg, isDarkTheme);
}