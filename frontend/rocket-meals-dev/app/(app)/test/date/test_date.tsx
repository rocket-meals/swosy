import {Text, View} from '@/components/Themed';
import {MySafeAreaView} from "@/components/MySafeAreaView";
import {MyScrollView} from "@/components/scrollview/MyScrollView";
import {useProfileLocaleForJsDate} from "@/states/SynchedProfile";
import {DateHelper, Weekday} from "@/helper/date/DateHelper";

export default function HomeScreen() {

    const locale = useProfileLocaleForJsDate()

    let date = DateHelper.getDefaultWeekdayDate(Weekday.SUNDAY);
    let testDate = new Date("December 25, 1995 23:15:30");

  return (
      <MySafeAreaView>
          <MyScrollView>
              <Text >{"locale: "+locale}</Text>
              <Text >{"date: "+date}</Text>
              <Text >{"testDate: "+testDate}</Text>
              <Text >{"DateHelper.getWeekdayTranslationByWeekday(Weekday.SUNDAY, locale): "+DateHelper.getWeekdayTranslationByWeekday(Weekday.SUNDAY, locale)}</Text>
          </MyScrollView>
      </MySafeAreaView>
  );
}
