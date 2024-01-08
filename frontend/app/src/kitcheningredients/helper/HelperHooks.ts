import {useColorMode, useTheme} from "native-base";

export const useThemeTextColor = (invert?: boolean, useDarkTheme?) => {
  const theme = useTheme();
  const { colorMode, toggleColorMode } = useColorMode();

  let darkModeTextColor = theme["colors"]["lightText"]; //darkText is used in lightmode !
  let lightModeTextColor = theme["colors"]["darkText"];

  let darkMode = colorMode!=="light";
  if(invert){
    darkMode = !darkMode;
  }

  if(useDarkTheme===true){
    darkMode = true;
  }
  if(useDarkTheme===false){
    darkMode = false;
  }

  let textColor = darkMode ? darkModeTextColor : lightModeTextColor;

  return textColor;
}
