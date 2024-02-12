import {Custom_Wiki_Ids} from "@/states/SynchedWikis";
import {LegalScreenWithWiki} from "@/compositions/legal/LegalScreenWithWiki";

export default function LegalScreenLicense() {

    return (
        <LegalScreenWithWiki custom_id={Custom_Wiki_Ids.license} />
    );
}
