import {Text} from '@/components/Themed';
import {MySafeAreaViewThemed} from '@/components/MySafeAreaViewThemed';
import {MyScrollView} from '@/components/scrollview/MyScrollView';
import {useProfileLocaleForJsDate} from '@/states/SynchedProfile';
import {DateHelper, Weekday} from '@/helper/date/DateHelper';

export default function HomeScreen() {
	const locale = useProfileLocaleForJsDate()

	const date = DateHelper.getDefaultWeekdayDate(Weekday.SUNDAY);
	const testDate = new Date('December 25, 1995 23:15:30');

	return (
		<MySafeAreaViewThemed>
			<MyScrollView>
				<Text >{'locale: '+locale}</Text>
				<Text >{'date: '+date}</Text>
				<Text >{'testDate: '+testDate}</Text>
				<Text >{'DateHelper.getWeekdayTranslationByWeekday(Weekday.SUNDAY, locale): '+DateHelper.getWeekdayTranslationByWeekday(Weekday.SUNDAY, locale)}</Text>
			</MyScrollView>
		</MySafeAreaViewThemed>
	);
}
