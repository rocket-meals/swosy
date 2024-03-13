import {ReactNode, useState} from 'react';
import {View} from '@/components/Themed';

type setActiveType = () => void

export type TabWrapperProps = {
  headers: ((active: boolean, setActive: setActiveType) => ReactNode)[],
  contents: ReactNode[],
  defaultActive?: number
}

export default function TabWrapper(props: TabWrapperProps) {
	const [activeTab, setActiveTab] = useState(props.defaultActive ?? 0);

	return (
		<View style={{flexDirection: 'column', flexGrow: 1}}>
			<View style={{flexDirection: 'row'}}>
				{props.headers.map((header, index) => {
					const isActive = activeTab === index;
					return (
						<View key={index} style={{flex: 1, justifyContent: 'center', alignItems: 'center'}} onTouchEnd={() => setActiveTab(index)}>
							{header(isActive, () => {
								setActiveTab(index);
							})}
						</View>
					)
				})}
			</View>
			<View style={{ flexGrow: 1 }}>
				{props.contents[activeTab]}
			</View>
		</View>
	)
}