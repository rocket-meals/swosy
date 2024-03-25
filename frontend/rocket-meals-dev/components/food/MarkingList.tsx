import {useSynchedMarkingsDict} from '@/states/SynchedMarkings';
import {View, Text, useViewBackgroundColor} from '@/components/Themed';
import {useProfileLanguageCode} from '@/states/SynchedProfile';
import React, {FunctionComponent, useEffect, useMemo, useRef} from 'react';
import MarkingListItem from "@/components/food/MarkingListItem";
import {MyAccessibilityRoles} from "@/helper/accessibility/MyAccessibilityRoles";
import {Markings} from "@/helper/database/databaseTypes/types";
import {Animated, Easing, ListRenderItemInfo} from "react-native";
import {MyGridFlatList} from "@/components/grid/MyGridFlatList";
import {ViewStyle} from "react-native/Libraries/StyleSheet/StyleSheetTypes";
import {StyleProp} from "react-native/Libraries/StyleSheet/StyleSheet";
import {useLighterOrDarkerColorForSelection} from "@/helper/color/MyContrastColor";
import {ActionsheetItem, ActionsheetItemText, ActionsheetVirtualizedList} from "@gluestack-ui/themed";


export const LoadingRectThemed = (props: {
	width: string | number;
	height: string | number;
	style?: StyleProp<ViewStyle>;
}) => {
	const backgroundColor = useViewBackgroundColor()
	const darkerBackgroundColor = useLighterOrDarkerColorForSelection(backgroundColor)
	return <LoadingRect width={props.width} height={props.height} style={[{backgroundColor: darkerBackgroundColor}, props.style]} />
};


const LoadingRect = (props: {
	width: string | number;
	height: string | number;
	style?: StyleProp<ViewStyle>;
}) => {
	const pulseAnim = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		const sharedAnimationConfig = {
			duration: 1000,
			useNativeDriver: true,
		};
		Animated.loop(
			Animated.sequence([
				Animated.timing(pulseAnim, {
					...sharedAnimationConfig,
					toValue: 1,
					easing: Easing.out(Easing.ease),
				}),
				Animated.timing(pulseAnim, {
					...sharedAnimationConfig,
					toValue: 0,
					easing: Easing.in(Easing.ease),
				}),
			])
		).start();

		return () => {
			// cleanup
			pulseAnim.stopAnimation();
		};
	}, []);

	const opacityAnim = pulseAnim.interpolate({
		inputRange: [0, 1],
		outputRange: [0.05, 0.15],
	});

	return (
		<Animated.View
			style={[
				{ width: props.width, height: props.height },
				{ opacity: opacityAnim },
				props.style,
			]}
		/>
	);
};

export const MarkingList = ({...props}) => {
	const [markingsDict, setMarkingsDict] = useSynchedMarkingsDict();
	const [loading, setLoading] = React.useState(true);
	const useLazyLoading = true;

	/**

	useEffect(() => {
		// small delay to prevent flickering
		setTimeout(() => {
			setLoading(false)
		}, 250);
		// when component unloads, set loading to true
		return () => {
			setLoading(true)
		}
	}, [])

	if(loading && useLazyLoading){
		return <LoadingRectThemed width={'100%'} height={50} style={{marginBottom: 10}} />
	}
		*/

	let usedDict = markingsDict || {}
	const all_marking_keys = Object.keys(usedDict);

	return <MarkingListSelective markingIds={all_marking_keys} />
}

export const MarkingListSelective: FunctionComponent<{markingIds: string[]}> = ({...props}) => {
	const [markingsDict, setMarkingsDict] = useSynchedMarkingsDict();
	const [showActionsheet, setShowActionsheet] = React.useState(false)
	const handleClose = () => setShowActionsheet(!showActionsheet)
	/**
	const data = React.useMemo(
		() =>
			Array(50)
				.fill(0)
				.map((_, index) => "Item" + index),
		[]
	)
		*/

	const data: DataItem[] = []
	if (markingsDict && props.markingIds) {
		for (let i=0; i<props.markingIds.length; i++) {
			const canteen_key = props.markingIds[i];
			const marking = markingsDict[canteen_key]
			if(!!marking){
				data.push({key: canteen_key, data: marking})
			}
		}
	}


	const getItem = (_data, index) => ({
		id: _data[index].key,
		title: _data[index].key,
	})
	const getItemCount = (_data) => _data.length
	const Item = React.useCallback(
		({ title }) => {
			return (
				<MarkingListItem markingId={title} />
			)
		},
		[handleClose]
	)
	return (
		<ActionsheetVirtualizedList
			height={"100%"}
			data={data}
			initialNumToRender={1}
			renderItem={({ item }) => <Item title={item.title} />}
			keyExtractor={(item) => item.id}
			getItemCount={getItemCount}
			getItem={getItem}
		/>
	)

/**
	const [markingsDict, setMarkingsDict] = useSynchedMarkingsDict();
	type DataItem = { key: string; data: Markings }
	const data: DataItem[] = []
	if (markingsDict && props.markingIds) {
		for (let i=0; i<props.markingIds.length; i++) {
			const canteen_key = props.markingIds[i];
			const marking = markingsDict[canteen_key]
			if(!!marking){
				data.push({key: canteen_key, data: marking})
			}
		}
	}

	const renderMarking = (info: ListRenderItemInfo<DataItem>) => {
		const {item, index} = info;
		const marking = item.data;
		const marking_key = marking.id

		return (
			<MarkingListItem markingId={marking.id} />
		);
	}

	return <MyGridFlatList data={data} renderItem={renderMarking} amountColumns={1} />

		*/
}