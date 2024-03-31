import {SettingsRowSyncBooleanSwitch} from '@/components/settings/SettingsRowSyncBooleanSwitch';
import {PersistentStore} from '@/helper/syncState/PersistentStore';
import React from 'react';
import {SettingsRowLogout} from '@/components/settings/SettingsRowLogout';
import {SettingsRowDrawerPosition} from '@/compositions/settings/SettingsRowDrawerPosition';
import {SettingsRowProfileNickname} from '@/compositions/settings/SettingsRowProfileNickname';
import {SettingsRowUser} from '@/compositions/settings/SettingsRowUser';
import {SettingsRowProfileCanteen} from '@/compositions/settings/SettingsRowProfileCanteen';
import {MySafeAreaView} from '@/components/MySafeAreaView';
import {ScrollViewWithGradient} from '@/components/scrollview/ScrollViewWithGradient';
import {SettingsRowProfileLanguage} from '@/compositions/settings/SettingsRowProfileLanguage';
import {IconNames} from '@/constants/IconNames';
import {SettingsRowFirstDayOfWeek} from '@/compositions/settings/SettingsRowFirstDayOfWeek';
import {SettingsRowColorScheme} from '@/compositions/settings/SettingsRowColorScheme';
import {SettingsRowProfileEatingHabits} from '@/compositions/settings/SettingsRowEatingHabits';
import {SettingsRowGroup} from '@/components/settings/SettingsRowGroup';
import {SettingsRowSpacer} from '@/components/settings/SettingsRowSpacer';
import {SettingsRowUserDelete} from '@/compositions/settings/SettingsRowUserDelete';
import {SettingsRowServerConfiguration} from '@/compositions/settings/SettingsRowServerConfiguration';
import {SettingsRowPriceGroup} from '@/compositions/settings/SettingsRowPriceGroup';
import {SettingsRowAppUpdate} from "@/compositions/settings/SettingsRowAppUpdate";
import {SettingsRowAccountBalance} from "@/compositions/settings/SettingsRowAccountBalance";
import {SettingsRowDataAccess} from "@/compositions/settings/SettingsRowDataAccess";

export default function SettingsScreen() {
	return (
		<MySafeAreaView>
			<ScrollViewWithGradient>
				<SettingsRowSpacer />
				<SettingsRowGroup>
					<SettingsRowUser />
					<SettingsRowProfileNickname />
					<SettingsRowProfileLanguage />
					<SettingsRowProfileCanteen />
					<SettingsRowProfileEatingHabits />
					<SettingsRowPriceGroup />
					<SettingsRowAccountBalance />
				</SettingsRowGroup>
				<SettingsRowGroup>
					<SettingsRowColorScheme />
					<SettingsRowDrawerPosition />
					<SettingsRowFirstDayOfWeek />
				</SettingsRowGroup>
				<SettingsRowGroup>
					<SettingsRowLogout />
				</SettingsRowGroup>
				<SettingsRowGroup>
					<SettingsRowSyncBooleanSwitch labelLeft={'Debug'} leftIcon={IconNames.debug_icon} accessibilityLabel={'Debug'} variable={PersistentStore.debug} />
					<SettingsRowSyncBooleanSwitch labelLeft={'Demo'} leftIconOn={IconNames.demo_icon_on} leftIconOff={IconNames.demo_icon_off} accessibilityLabel={'Demo'} variable={PersistentStore.demo} />
					<SettingsRowSyncBooleanSwitch labelLeft={'Performance'} leftIconOn={IconNames.performance_icon_on} leftIconOff={IconNames.performance_icon_off} accessibilityLabel={'Performance'} variable={PersistentStore.performance} />
					<SettingsRowSyncBooleanSwitch labelLeft={'Developer'} leftIconOn={IconNames.demo_icon_on} leftIconOff={IconNames.demo_icon_off} accessibilityLabel={'Developer'} variable={PersistentStore.develop} />
					<SettingsRowServerConfiguration />
                    <SettingsRowAppUpdate />
				</SettingsRowGroup>
				<SettingsRowGroup>
					<SettingsRowUserDelete />
					<SettingsRowDataAccess />
				</SettingsRowGroup>
			</ScrollViewWithGradient>
		</MySafeAreaView>
	);
}