// define button type which has a icon for left and right side with family and name and color
// also allow to set a callback for the button
// also allow the content to be a component

import {Platform} from 'react-native';
import {MyTouchableOpacity} from '@/components/buttons/MyTouchableOpacity';
import {MyAccessibilityRoles} from '@/helper/accessibility/MyAccessibilityRoles';
import {CommonSystemActionHelper} from '@/helper/device/CommonSystemActionHelper';

export type MyExternalLinkProps = {
    _target?: string,
    href: string,
    children?: React.ReactNode,
    openInNewTab?: boolean,
    accessibilityLabel: string
}

// define the button component
export const MyExternalLink = ({_target, openInNewTab, href, accessibilityLabel, children}: MyExternalLinkProps) => {
	const onPress = () => {
		console.log('MyExternalLink onPress')
		if (Platform.OS !== 'web') {
			// Prevent the default behavior of linking to the default browser on native.
			//WebBrowser.openBrowserAsync(href);
			CommonSystemActionHelper.openExternalURL(href)
		} else {

		}
	}

	const button = (
		(
			<MyTouchableOpacity accessibilityRole={MyAccessibilityRoles.Link} style={{width: '100%'}} onPress={onPress} accessibilityLabel={accessibilityLabel}>
				{children}
			</MyTouchableOpacity>
		)
	)

	// TODO: Check if expo issue is fixed: https://github.com/expo/expo/issues/26566
	if (Platform.OS === 'web') {
		let used_target = _target || '_self'
		if (openInNewTab) {
			used_target = '_blank'
		}
		return (
			<a href={href} target={used_target} style={{ textDecoration: 'none' }}>
				{button}
			</a>
		)
	} else {
		return button
	}
}