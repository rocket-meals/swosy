import { Platform, TextInput } from 'react-native';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';

/**
 * Text input for use inside bottom-sheet modals (useMyScrollViewModal).
 *
 * Plain react-native TextInputs are invisible to @gorhom/bottom-sheet's
 * keyboard tracking, so the sheet does not lift above the keyboard when they
 * gain focus. BottomSheetTextInput registers with the sheet and triggers its
 * keyboard avoidance (see BaseBottomSheet in common-ui), matching the
 * behaviour of the SettingsList text input modals. On web the sheet handles
 * no keyboard, so the plain TextInput is used there.
 */
const ModalTextInput = Platform.OS === 'web' ? TextInput : BottomSheetTextInput;

export default ModalTextInput;
