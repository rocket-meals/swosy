import React, { useCallback, useMemo, useState } from 'react';
import { Keyboard, KeyboardTypeOptions } from 'react-native';

import SettingsListInput from '@/components/SettingsListInput';
import { useMyScrollViewModal } from '@/components/GlobalModal/useMyScrollViewModal';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKeys } from '@/locales/keys';

export type TextInputCheckResult = {
        isValid: boolean;
        value: string;
        errorMessage?: string;
};

type TextInputCheckOptions = {
        sanitize?: (value: string) => string;
        isValid?: (value: string) => boolean;
        errorMessage?: string;
};

export const checkTextInput = (value: string, options: TextInputCheckOptions = {}): TextInputCheckResult => {
        const sanitizedValue = options.sanitize ? options.sanitize(value) : value;
        const isValid = options.isValid ? options.isValid(sanitizedValue) : true;

        return {
                isValid,
                value: sanitizedValue,
                errorMessage: isValid ? undefined : options.errorMessage,
        };
};

type ModalTextInputConfig = {
        title: string;
        initialValue?: string;
        placeholder?: string;
        saveLabel?: string;
        onSave: (value: string) => void;
        keyboardType?: KeyboardTypeOptions;
        multiline?: boolean;
        numberOfLines?: number;
        textAlignVertical?: 'auto' | 'top' | 'bottom' | 'center';
        inputStyle?: object;
        submitOnDone?: boolean;
        validate?: (value: string) => TextInputCheckResult;
        disableSaveWhenUnchanged?: boolean;
};

type ModalTextInputContentProps = Omit<ModalTextInputConfig, 'title'> & {
        onClose: () => void;
};

const ModalTextInputContent: React.FC<ModalTextInputContentProps> = ({
        initialValue = '',
        placeholder,
        saveLabel,
        onSave,
        keyboardType,
        multiline = false,
        numberOfLines,
        textAlignVertical,
        inputStyle,
        submitOnDone,
        validate,
        disableSaveWhenUnchanged = true,
        onClose,
}) => {
        const [value, setValue] = useState(initialValue);

        const normalizedInitial = useMemo(() => {
                if (!validate) return initialValue;
                return validate(initialValue).value;
        }, [initialValue, validate]);

        const validation = useMemo(() => {
                if (!validate) {
                        return { isValid: true, value };
                }
                return validate(value);
        }, [validate, value]);

        const disableSave = useMemo(() => {
                if (!validation.isValid) return true;
                if (disableSaveWhenUnchanged) {
                        return validation.value === normalizedInitial;
                }
                return false;
        }, [disableSaveWhenUnchanged, normalizedInitial, validation.isValid, validation.value]);

        const handleSave = useCallback(() => {
                if (!validation.isValid) return;
                onSave(validation.value);
                onClose();
        }, [onClose, onSave, validation.isValid, validation.value]);

        return (
                <SettingsListInput
                        placeholder={placeholder != null ? placeholder : ''}
                        value={value}
                        onChangeText={setValue}
                        onSave={handleSave}
                        saveLabel={saveLabel != null ? saveLabel : ''}
                        disableSave={disableSave}
                        multiline={multiline}
                        numberOfLines={numberOfLines}
                        textAlignVertical={textAlignVertical}
                        inputStyle={inputStyle}
                        keyboardType={keyboardType}
                        submitOnDone={submitOnDone}
                />
        );
};

const useModalTextInput = () => {
        const { translate } = useLanguage();
        const { show: showScrollViewModal, close: closeScrollViewModal } = useMyScrollViewModal();

        const closeModal = useCallback(() => {
                Keyboard.dismiss();
                closeScrollViewModal();
        }, [closeScrollViewModal]);

        const openModal = useCallback(
                (config: ModalTextInputConfig) => {
                        showScrollViewModal({
                                title: config.title,
                                onClose: closeModal,
                                children: (
                                        <ModalTextInputContent
                                                initialValue={config.initialValue}
                                                placeholder={config.placeholder != null ? config.placeholder : config.title}
                                                saveLabel={
                                                        config.saveLabel != null
                                                                ? config.saveLabel
                                                                : translate(TranslationKeys.save)
                                                }
                                                onSave={config.onSave}
                                                keyboardType={config.keyboardType}
                                                multiline={config.multiline}
                                                numberOfLines={config.numberOfLines}
                                                textAlignVertical={config.textAlignVertical}
                                                inputStyle={config.inputStyle}
                                                submitOnDone={config.submitOnDone}
                                                validate={config.validate}
                                                disableSaveWhenUnchanged={config.disableSaveWhenUnchanged}
                                                onClose={closeModal}
                                        />
                                ),
                        });
                },
                [closeModal, showScrollViewModal, translate]
        );

        return { openModal, closeModal };
};

export default useModalTextInput;
