import React, { ReactNode } from 'react';
import { Platform, View, Text, useWindowDimensions } from 'react-native';
import { BottomSheetFlatList, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useTheme } from '@/hooks/useTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ScrollViewModalContentProps } from 'repo-depkit-common-ui';

export interface MyScrollViewModalProps extends ScrollViewModalContentProps {
  closeSheet?: () => void;
  // For FlatList mode
  renderItem?: (info: { item: any; index: number }) => ReactNode;
  keyExtractor?: (item: any, index: number) => string;
  onClose?: () => void;
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
}) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();

  // On web browsers the safe-area bottom inset is 0 and the bottom-sheet scroll
  // area is clipped by browser chrome.  Add this ratio of the window height as an
  // extra bottom buffer so the user can always scroll to the very last item.
  const WEB_BOTTOM_PADDING_RATIO = 0.2;
  const extraBottomPadding = Platform.OS === 'web' ? windowHeight * WEB_BOTTOM_PADDING_RATIO : 0;

  const resolvedBackgroundColor = backgroundColor ?? theme.screen.background;

  // onClose must only fire when this component truly unmounts. The global modal
  // stack renders every stack item's MyScrollViewModal at the same tree position
  // (see ModalRenderer), so popping back to the previous modal re-renders the SAME
  // instance with the previous modal's props. With onClose in the effect deps, that
  // prop swap ran the cleanup with the just-popped modal's onClose (usually the
  // stack's close()) and closed the remaining modal too - e.g. the account-required
  // modal took the modal beneath it down with it despite showing the back chevron.
  const onCloseRef = React.useRef(onClose);
  React.useEffect(() => { onCloseRef.current = onClose; }, [onClose]);
  React.useEffect(() => () => { onCloseRef.current?.(); }, []);

  const headerComponent = (
    <>
      {title && (
        <View
          style={{ backgroundColor: resolvedBackgroundColor, paddingHorizontal: 20, paddingTop: 6, paddingBottom: 4 }}
        >
          <Text style={{ fontSize: 16, fontWeight: '600', color: theme.sheet.text }}>{title}</Text>
        </View>
      )}
      {ListHeaderComponent}
    </>
  );

  const footerComponent = ListFooterComponent || <View style={{ height: Math.max(24, insets.bottom + 16) + extraBottomPadding }} />;

  const contentStyle = { paddingBottom: 24 + insets.bottom + extraBottomPadding, paddingHorizontal: disableHorizontalPadding ? 0 : 20 };
  const scrollInsets = { bottom: insets.bottom };

  const containerStyle = { backgroundColor: resolvedBackgroundColor };

  if (useFlatList && renderItem && keyExtractor) {
    return (
      <BottomSheetFlatList
        data={data}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={headerComponent}
        ListFooterComponent={footerComponent}
        style={containerStyle}
        contentContainerStyle={contentStyle}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        scrollIndicatorInsets={scrollInsets}
      />
    );
  }

  return (
    <BottomSheetScrollView
      style={containerStyle}
      contentContainerStyle={contentStyle}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      scrollIndicatorInsets={scrollInsets}
    >
      {headerComponent}
      {children}
      {footerComponent}
    </BottomSheetScrollView>
  );
};

export default MyScrollViewModal;
