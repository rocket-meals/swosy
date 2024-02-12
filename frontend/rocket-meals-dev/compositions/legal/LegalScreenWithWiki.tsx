import {MySafeAreaView} from "@/components/MySafeAreaView";
import {MyScrollView} from "@/components/scrollview/MyScrollView";
import {WikiComponentByCustomId} from "@/compositions/wikis/WikiComponentByCustomId";
import {FunctionComponent} from "react";

interface AppState {
    custom_id: string
}
export const LegalScreenWithWiki: FunctionComponent<AppState> = ({custom_id}) => {

    return (
        <MySafeAreaView>
            <MyScrollView style={{
                paddingHorizontal: 20,
                paddingVertical: 10
            }}>
                <WikiComponentByCustomId custom_id={custom_id} />
            </MyScrollView>
        </MySafeAreaView>
    );
}