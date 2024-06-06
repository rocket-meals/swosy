import {useState} from 'react';
import {Heading, Text, View} from '@/components/Themed';
import {MySafeAreaView} from '@/components/MySafeAreaView';
import {MyScrollView} from '@/components/scrollview/MyScrollView';
import {SimpleDatePicker} from '@/components/datePicker/SimpleDatePicker';

export default function ButtonTestScreen() {
	const [selectedDate, setSelectedDate] = useState<Date>(new Date());

	return (
		<MySafeAreaView>
			<MyScrollView>
				<Heading>{'Calendar Test'}</Heading>
				<Text>{'Selected Date: '+selectedDate.toISOString()}</Text>
				<View style={{height: 20}} />
				<Text>{'Click next to open Date Picker'}</Text>
				<View>
					<SimpleDatePicker currentDate={selectedDate}
						onSelectDate={(date: Date) => {
							setSelectedDate(date);
						}}
					/>
				</View>
			</MyScrollView>
		</MySafeAreaView>
	);
}
