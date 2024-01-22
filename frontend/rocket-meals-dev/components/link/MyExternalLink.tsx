// define button type which has a icon for left and right side with family and name and color
// also allow to set a callback for the button
// also allow the content to be a component

import {Platform} from "react-native";
import * as WebBrowser from "expo-web-browser";
import {MyTouchableOpacity} from "@/components/buttons/MyTouchableOpacity";

export type MyExternalLinkProps = {
    _target?: string,
    href: string,
    children?: React.ReactNode
    accessibilityLabel: string
}

// define the button component
export const MyExternalLink = ({_target, href, accessibilityLabel, children}: MyExternalLinkProps) => {

    const onPress = () => {
        if (Platform.OS !== 'web') {
            // Prevent the default behavior of linking to the default browser on native.
            WebBrowser.openBrowserAsync(href);
        }
    }

    let button = (
        (
            <MyTouchableOpacity style={{width: "100%"}} onPress={onPress} accessibilityLabel={accessibilityLabel}>
                {children}
            </MyTouchableOpacity>
        )
    )

    // TODO: Check if expo issue is fixed: https://github.com/expo/expo/issues/26566
    if(Platform.OS === "web"){
        return(
            <a href={href} target={_target} style={{ textDecoration: 'none' }}>
                {button}
            </a>
        )
    } else {
        return button
    }

}