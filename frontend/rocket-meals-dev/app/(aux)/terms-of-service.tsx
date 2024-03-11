import {Custom_Wiki_Ids} from '@/states/SynchedWikis';
import {LegalScreenWithWiki} from '@/compositions/legal/LegalScreenWithWiki';

export default function LegalScreenTermsOfService() {
	return (
		<LegalScreenWithWiki custom_id={Custom_Wiki_Ids.terms_of_service} />
	);
}