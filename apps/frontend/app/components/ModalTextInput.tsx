import { Platform, TextInput } from 'react-native';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';

/**
 * Text input for use inside bottom-sheet modal content (anything shown via
 * useMyScrollViewModal / showScrollViewModal or rendered inside a @gorhom
 * BottomSheet).
 *
 * Plain react-native TextInputs are invisible to @gorhom/bottom-sheet's
 * keyboard tracking, so the sheet does not lift above the keyboard when they
 * gain focus. BottomSheetTextInput registers with the sheet and triggers its
 * keyboard avoidance (see BaseBottomSheet in common-ui). On web the sheet
 * handles no keyboard, so the plain TextInput is used there.
 *
 * Only use this inside sheet content — BottomSheetTextInput throws when
 * rendered outside a BottomSheet on native.
 */
const ModalTextInput = Platform.OS === 'web' ? TextInput : BottomSheetTextInput;

export default ModalTextInput;
