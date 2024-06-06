import React, {useState} from 'react';
import {View} from '@/components/Themed';

type setActiveType = () => void

export type TabProps = {
	header: (isActive: boolean, setActive: setActiveType) => React.ReactNode
	content: React.ReactNode[]
};

export type TabWrapperProps = {
  tabs: TabProps[],
  defaultActive?: number
}

export default function TabWrapper(props: TabWrapperProps) {
	const [activeTab, setActiveTab] = useState(props.defaultActive ?? 0);

	return (
		<View style={{flexDirection: 'column', flexGrow: 1}}>
			<View style={{flexDirection: 'row'}}>
				{props.tabs.map((tab, index) => {
					const isActive = activeTab === index;

					const onPress = () => setActiveTab(index);
					return (
						<View key={index} style={{flex: 1, justifyContent: 'center', alignItems: 'center'}} >
							{tab.header(isActive, onPress)}
						</View>
					)
				})}
			</View>
			<View style={{ flexGrow: 1 }}>
				{props.tabs[activeTab].content}
			</View>
		</View>
	)
}