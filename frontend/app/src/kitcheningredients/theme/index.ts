import {extendTheme} from 'native-base';

const sidebarWidth = 320;

export default class BaseThemeGenerator {

  static getBaseTheme(initialColorMode) {
    let baseTheme = extendTheme(undefined);

    let defaultButton = baseTheme.components.Button;
    defaultButton.defaultProps._dark = {
      backgroundColor: "#A9A9A9"
    };
    defaultButton.defaultProps._light = {
      backgroundColor: "#172940FF"
    }

    return extendTheme({
      sidebarWidth: sidebarWidth + "px",
      breakpoints: {
        'base': 0 + sidebarWidth,
        'sm': 480 + sidebarWidth,
        'md': 768 + sidebarWidth,
        'lg': 992 + sidebarWidth,
        'xl': 1280 + sidebarWidth, // +280 from MenuWidth
      },
      components: {
        Text: {
          defaultProps: {
            fontSize: 'md',
            selectable: true,
          },
        },
        Button: {...defaultButton},
      },
      colors: {
        slateGray: {
          50: '#f3f2f2',
          100: '#d8d8d8',
          200: '#bebebe',
          300: '#a3a3a3',
          400: '#898989',
          500: '#6f6f6f',
          600: '#565656',
          700: '#3e3e3e',
          800: '#252525',
          900: '#0d0c0d',
        },
      },
      Pressable: {
        cursor: 'pointer',
      },

      config: {
        // Changing initialColorMode to 'dark'
        initialColorMode: initialColorMode,
      },
    });
  }
}
