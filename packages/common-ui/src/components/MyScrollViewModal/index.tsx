import React, { ReactNode } from 'react';
import { Platform, View, Text, useWindowDimensions } from 'react-native';
import { BottomSheetFlatList, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useTheme } from '../../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ScrollViewModalContentProps } from './types';

export type { ScrollViewModalContentProps } from './types';

export interface MyScrollViewModalProps extends ScrollViewModalContentProps {
	closeSheet?: () => void;
	renderItem?: (info: { item: any; index: number }) => ReactNode;
	keyExtractor?: (item: any, index: number) => string;
	onClose?: () => void;
	stickyHeaderComponent?: ReactNode;
}

const MyScrollViewModal: React.FC<MyScrollViewModalProps> = ({
	title,
	children,
	useFlatList = false,
	backgroundColor,
	data = [],
	renderItem,
	keyExtractor,
	ListHeaderComponent,
	ListFooterComponent,
	showsVerticalScrollIndicator = true,
	keyboardShouldPersistTaps = 'handled',
	onClose,
	disableHorizontalPadding = false,
	stickyHeaderComponent,
}) => {
	const { theme } = useTheme();
	const insets = useSafeAreaInsets();
	const { height: windowHeight } = useWindowDimensions();

	const WEB_BOTTOM_PADDING_RATIO = 0.2;
	const extraBottomPadding = Platform.OS === 'web' ? windowHeight * WEB_BOTTOM_PADDING_RATIO : 0;

	const resolvedBackgroundColor = backgroundColor ?? theme.screen.background;

	const onCloseRef = React.useRef(onClose);
	React.useEffect(() => { onCloseRef.current = onClose; }, [onClose]);
	React.useEffect(() => () => { onCloseRef.current?.(); }, []);

	// SCROLL FIX 6 (native: reset scroll offset when the modal content changes)
	// The modal stack renders only the top-most item inside ONE BaseBottomSheet
	// (see ModalRenderer). All stack items render a MyScrollViewModal at the
	// same tree position, so React does NOT remount it when the content is
	// swapped (editor -> category picker -> back) — it re-renders the SAME
	// instance (and the same native scroll view, which keeps its content
	// offset) with the new children. The sticky header element inside the
	// content however IS remounted, and React Native's ScrollViewStickyHeader
	// only positions itself from scroll events: until the first scroll event
	// it assumes offset 0. With the carried-over offset the header is
	// therefore translated off-screen and stays invisible until the user
	// scrolls. Fix: whenever the content (children) changes, scroll back to
	// the top — this keeps native offset and sticky-header state consistent
	// (both 0) and makes every modal content start at the top instead of
	// inheriting the previous content's offset. A mount effect cannot work
	// here because the component never remounts between contents. Web is
	// untouched (no stickyHeaderIndices there, see SCROLL FIX 4).
	const scrollableRef = React.useRef<any>(null);
	React.useEffect(() => {
		if (Platform.OS === 'web') return;
		const node = scrollableRef.current;
		if (!node) return;
		if (typeof node.scrollTo === 'function') {
			node.scrollTo({ x: 0, y: 0, animated: false });
		} else if (typeof node.scrollToOffset === 'function') {
			node.scrollToOffset({ offset: 0, animated: false });
		}
	}, [children]);

	const titleElement = title ? (
		<View
			key="__title"
			style={{ backgroundColor: resolvedBackgroundColor, paddingHorizontal: 20, paddingTop: 6, paddingBottom: 4 }}
		>
			<Text style={{ fontSize: 16, fontWeight: '600', color: theme.sheet.text }}>{title}</Text>
		</View>
	) : null;

	const footerComponent = ListFooterComponent || <View style={{ height: Math.max(24, insets.bottom + 16) + extraBottomPadding }} />;

	const contentStyle = { paddingBottom: 24 + insets.bottom + extraBottomPadding, paddingHorizontal: disableHorizontalPadding ? 0 : 20 };
	const scrollInsets = { bottom: insets.bottom };

	const containerStyle = { backgroundColor: resolvedBackgroundColor };

	// SCROLL FIX (gorhom v5): Do NOT put flex:1 on the outer wrapper View or on the
	// BottomSheetScrollView/BottomSheetFlatList's style prop.  When the wrapper carries
	// flex:1 it expands unconstrained inside the BottomSheet content container, causing
	// gorhom to calculate contentHeight == containerHeight and therefore disable
	// scrolling entirely.  Letting gorhom manage the scroll-view height via its own
	// BottomSheetContext is the correct pattern.
	// NOTE FOR INSIDERS: Every scroll-related change in this modal stack must be
	// documented here (and in MyAvatarEditor's header comment) so future maintainers
	// understand the full history of attempted fixes.
	//
	// SCROLL FIX (web): On web the gorhom height-calculation issue above does NOT
	// apply (web uses a regular CSS-based scroll container).  But without flex:1 on the
	// outer View and the BottomSheetScrollView, the scroll view expands to its full
	// content height inside the fixed-height BottomSheet and never needs to scroll.
	// We therefore apply flex:1 on web only so that the scroll view is height-
	// constrained to the remaining space inside the sheet and scrolling is possible.
	const webFlex = Platform.OS === 'web' ? { flex: 1 } : {};
	if (useFlatList && renderItem && keyExtractor) {
		const flatListHeader = (
			<>
				{titleElement}
				{stickyHeaderComponent}
				{ListHeaderComponent}
			</>
		);
		return (
			<View style={[containerStyle, webFlex]}>
				<BottomSheetFlatList
					ref={scrollableRef}
					style={webFlex}
					data={data}
					keyExtractor={keyExtractor}
					renderItem={renderItem}
					ListHeaderComponent={flatListHeader}
					ListFooterComponent={footerComponent}
					contentContainerStyle={contentStyle}
					showsVerticalScrollIndicator={showsVerticalScrollIndicator}
					keyboardShouldPersistTaps={keyboardShouldPersistTaps}
					scrollIndicatorInsets={scrollInsets}
				/>
			</View>
		);
	}

	// On web, stickyHeaderIndices breaks scrolling in BottomSheetScrollView (the
	// sticky element interferes with the web scroll-height calculation, causing the
	// scroll container to believe there is nothing to scroll).  The web layout engine
	// (CSS flexbox / fixed height) correctly constrains the scroll view even when the
	// sticky header is a *sibling* View outside the scroll view — unlike native where
	// a sibling view confuses gorhom's height calculation (see SCROLL FIX 1).
	// Solution: on web render stickyHeaderComponent outside the scroll view; on native
	// keep the stickyHeaderIndices approach (SCROLL FIX 3).
	const renderStickyOutside = Platform.OS === 'web' && !!stickyHeaderComponent;

	// Build the children array for BottomSheetScrollView so that stickyHeaderIndices
	// can reference the correct index.  stickyHeaderComponent is placed INSIDE the
	// scroll view (not as a sibling) so gorhom accounts for its height when computing
	// the scrollable range — see SCROLL FIX 3 in MyAvatarEditor.
	const scrollParts: React.ReactNode[] = [];
	const computedStickyIndices: number[] = [];

	if (titleElement) {
		scrollParts.push(titleElement);
	}
	if (stickyHeaderComponent && !renderStickyOutside) {
		computedStickyIndices.push(scrollParts.length);
		scrollParts.push(<View key="__sticky">{stickyHeaderComponent}</View>);
	}
	if (ListHeaderComponent) {
		scrollParts.push(<View key="__listHeader">{ListHeaderComponent}</View>);
	}
	scrollParts.push(<View key="__children">{children}</View>);
	scrollParts.push(<View key="__footer">{footerComponent}</View>);

	return (
		<View style={[containerStyle, webFlex]}>
			{renderStickyOutside && <View>{stickyHeaderComponent}</View>}
			<BottomSheetScrollView
				ref={scrollableRef}
				style={webFlex}
				contentContainerStyle={contentStyle}
				showsVerticalScrollIndicator={showsVerticalScrollIndicator}
				keyboardShouldPersistTaps={keyboardShouldPersistTaps}
				scrollIndicatorInsets={scrollInsets}
				stickyHeaderIndices={computedStickyIndices.length > 0 ? computedStickyIndices : undefined}
			>
				{scrollParts}
			</BottomSheetScrollView>
		</View>
	);
};

export default MyScrollViewModal;
