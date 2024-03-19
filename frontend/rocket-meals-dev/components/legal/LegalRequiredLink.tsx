import React from 'react';
import {AllRoutes, router} from 'expo-router';
import {Text, View} from '@/components/Themed';
import {MyTouchableOpacity} from '@/components/buttons/MyTouchableOpacity';
import {MyExternalLink} from "@/components/link/MyExternalLink";

export type LegalRequiredInternalLinkProps = {
	externalHref?: string | null | undefined,
    internalHref: AllRoutes,
    text: string,
}
export const LegalRequiredLink = (props: LegalRequiredInternalLinkProps) => {

	let onPress = undefined
	if (props.internalHref) {
		onPress = () => {
			// @ts-ignore
			router.push(props.internalHref)
		}
	}
	if(props.externalHref) {
		onPress = undefined;
	}

	return (
		<View style={{flexDirection: 'row'}}>
			<MyExternalLink openInNewTab={true} href={props?.externalHref} accessibilityLabel={props.text} onPress={onPress}
			>
				<Text style={{fontSize: 12}}>{props.text}</Text>
			</MyExternalLink>
		</View>
	)
}
