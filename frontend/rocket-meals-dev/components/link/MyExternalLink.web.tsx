// define button type which has a icon for left and right side with family and name and color
// also allow to set a callback for the button
// also allow the content to be a component

import {MyTouchableOpacity} from "@/components/buttons/MyTouchableOpacity";
import {Platform} from "react-native";
import * as WebBrowser from "expo-web-browser";
import {MyExternalLinkProps} from "@/components/link/MyExternalLink";


// define the button component
export const MyExternalLink = ({_target, href, accessibilityLabel, children}: MyExternalLinkProps) => {

    // TODO: Check if expo issue is fixed: https://github.com/expo/expo/issues/26566
    const onPress = () => {
        if (Platform.OS !== 'web') {
            // Prevent the default behavior of linking to the default browser on native.
            WebBrowser.openBrowserAsync(href);
        }
    }

    return(
        <a href={href} target={_target}>
            <MyTouchableOpacity onPress={onPress} accessibilityLabel={accessibilityLabel}>
                {children}
            </MyTouchableOpacity>
        </a>
    )


}