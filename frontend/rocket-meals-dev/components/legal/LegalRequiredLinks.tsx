import React from 'react';
import {LegalRequiredLink} from '@/components/legal/LegalRequiredLink';
import {TranslationKeys, useTranslation} from '@/helper/translations/Translation';
import {Text, View} from '@/components/Themed';
import {useSynchedWikiByCustomId} from "@/states/SynchedWikis";

export const LegalRequiredLinks = (props: any) => {
	const translation_privacy_policy = useTranslation(TranslationKeys.privacy_policy);
	const wiki_privacy_policy = useSynchedWikiByCustomId("privacy-policy");
	const translation_about_us = useTranslation(TranslationKeys.about_us);
	const wiki_about_us = useSynchedWikiByCustomId("about-us");
	const translation_license = useTranslation(TranslationKeys.license);
	const wiki_license = useSynchedWikiByCustomId("license");
	const translation_cookie_policy = useTranslation(TranslationKeys.cookie_policy);
	const wiki_cookie_policy = useSynchedWikiByCustomId("cookie-policy");
	const translation_accessibility = useTranslation(TranslationKeys.accessibility);
	const wiki_accessibility = useSynchedWikiByCustomId("accessibility");

	const content = [];
	content.push(<LegalRequiredLink externalHref={wiki_about_us?.url} internalHref={'/(aux)/about-us'} text={translation_about_us} />);
	content.push(<LegalRequiredLink internalHref={'/(aux)/privacy-policy'} text={translation_privacy_policy} />);
	content.push(<LegalRequiredLink internalHref={'/(aux)/license'} text={translation_license} />);
	content.push(<LegalRequiredLink internalHref={'/(aux)/cookie-policy'} text={translation_cookie_policy} />);
	content.push(<LegalRequiredLink internalHref={'/(aux)/accessibility'} text={translation_accessibility} />);

	function renderSpacer(key: string) {
		return (
			<View key={key} style={{flexDirection: 'row', margin: 5}}>
				<Text style={{fontSize: 12}}>{' | '}</Text>
			</View>
		)
	}

	const renderedContent = [];
	for (let i = 0; i < content.length; i++) {
		const last = i === content.length - 1;
		const first = i === 0;
		if (first) {
			renderedContent.push(renderSpacer('legalRequiredLinksSpacerFirst-'+i));
		}
		renderedContent.push(<View key={'legalRequiredLinks-'+i} style={{flexDirection: 'row', padding: 5}}>{content[i]}</View>);
		if (!last) {
			renderedContent.push(renderSpacer('legalRequiredLinksSpacerLast-'+i));
		}
	}

	return (
		<View style={{width: '100%', padding: 10, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center'}}>
			{renderedContent}
		</View>
	)
}
