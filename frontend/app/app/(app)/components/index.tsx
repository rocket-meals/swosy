import {MyScrollView} from '@/components/scrollview/MyScrollView';
import {MySafeAreaView} from '@/components/MySafeAreaView';
import {SettingsRowGroup} from "@/components/settings/SettingsRowGroup";
import {SettingsRowNavigateWithText} from "@/components/settings/SettingsRowNavigate";

export default function HomeScreen() {
	return (
		<MySafeAreaView>
			<MyScrollView>
				<SettingsRowGroup>
					<SettingsRowNavigateWithText labelLeft={"Icon"} route={"/(app)/components/icon"} />
					<SettingsRowNavigateWithText labelLeft={"Image Directus"} route={"/(app)/components/imageDirectus"} />
					<SettingsRowNavigateWithText labelLeft={"Markdown"} route={"/(app)/components/markdown"} />
					<SettingsRowNavigateWithText labelLeft={"Screenshot/Print"} route={"/(app)/components/screenshot"} />
				</SettingsRowGroup>
			</MyScrollView>
		</MySafeAreaView>
	);
}
