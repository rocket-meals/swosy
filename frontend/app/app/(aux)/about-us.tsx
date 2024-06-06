import {Custom_Wiki_Ids} from '@/states/SynchedWikis';
import {LegalScreenWithWiki} from '@/compositions/legal/LegalScreenWithWiki';

export default function LegalScreenAboutUs() {
	return (
		<LegalScreenWithWiki custom_id={Custom_Wiki_Ids.about_us} />
	);
}