import {MySafeAreaView} from "@/components/MySafeAreaView";
import {WikiComponentByCustomId} from "@/compositions/wikis/WikiComponentByCustomId";
import {FunctionComponent} from "react";
import {ScrollViewWithGradient} from "@/components/scrollview/ScrollViewWithGradient";

interface AppState {
    custom_id: string
}
export const LegalScreenWithWiki: FunctionComponent<AppState> = ({custom_id}) => {

    return (
        <MySafeAreaView>
            <ScrollViewWithGradient style={{
                paddingHorizontal: 20,
                paddingVertical: 10
            }}>
                <WikiComponentByCustomId custom_id={custom_id} />
            </ScrollViewWithGradient>
        </MySafeAreaView>
    );
}