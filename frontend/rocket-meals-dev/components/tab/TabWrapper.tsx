import {ReactNode, useState} from "react";
import {View} from "react-native";

export type TabWrapperProps = {
  headers: ((active: boolean) => ReactNode)[],
  contents: ReactNode[],
}

export default function TabWrapper(props: TabWrapperProps) {
  const [activeTab, setActiveTab] = useState(0);

  return (
      <View style={{display: "flex", flexDirection: "column"}}>
        <View style={{display: "flex", flexDirection: "row"}}>
          {props.headers.map((header, index) => {
            return (
                <View key={index} style={{flex: 1, display: "flex", justifyContent: "center", alignItems: "center"}} onTouchEnd={() => setActiveTab(index)}>
                  {header(activeTab === index)}
                </View>
            )
          })}
        </View>
        <View>
          {props.contents[activeTab]}
        </View>
      </View>
  )
}