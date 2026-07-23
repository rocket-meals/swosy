import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import styles from './styles';
import { useTheme } from '@/hooks/useTheme';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKeys } from '@/locales/keys';
import { useAppSelector } from '@/redux/hooks';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import SingleLineInput from '@/components/SingleLineInput/SingleLineInput';
import type { FormFieldStatusProps, AffixProps } from 'repo-depkit-common-ui';

export interface DropdownSheetProps extends FormFieldStatusProps, AffixProps {
  closeSheet: () => void;
  options: string[];
  allowCustomValues: boolean;
  value: string;
  onSelectOption: (val: string) => void;
  onSelectCustom: (val: string) => void; // will pass current custom text
  onDeselect: () => void;
}

const ensureStringArray = (options: string[]): string[] => {
  const uniqueValues = new Set<string>();
  options.forEach(option => {
    if (option && option.trim().length > 0) {
      uniqueValues.add(option.trim());
    }
  });
  return Array.from(uniqueValues);
};

type DropdownSheetTheme = ReturnType<typeof useTheme>['theme'];

const renderDeselectRow = (
  active: boolean,
  isDisabled: boolean | undefined,
  primaryColor: string,
  theme: DropdownSheetTheme,
  translate: (key: TranslationKeys) => string,
  handleDeselect: () => void,
) => {
  return (
    <TouchableOpacity
      key="deselect"
      style={[styles.optionRow, { backgroundColor: active ? primaryColor : theme.screen.iconBg }]}
      onPress={handleDeselect}
      disabled={isDisabled}
      onPressIn={() => console.log('[DropdownSheet] deselect pressed')}
    >
      <Text style={[styles.optionLabel, { color: active ? theme.activeText : theme.screen.text }]}>
        {translate(TranslationKeys.deselect)}
      </Text>
      <MaterialCommunityIcons name={active ? 'checkbox-marked' : 'checkbox-blank-outline'} size={24} color={active ? theme.activeText : theme.screen.icon} />
    </TouchableOpacity>
  );
};

const renderCustomRow = (
  customSelected: boolean,
  isDisabled: boolean | undefined,
  primaryColor: string,
  theme: DropdownSheetTheme,
  translate: (key: TranslationKeys) => string,
  handleSelectCustom: () => void,
) => {
  return (
    <TouchableOpacity
      key="custom"
      style={[styles.optionRow, { backgroundColor: customSelected ? primaryColor : theme.screen.iconBg }]}
      onPress={handleSelectCustom}
      disabled={isDisabled}
      onPressIn={() => console.log('[DropdownSheet] select custom pressed')}
    >
      <Text style={[styles.optionLabel, { color: customSelected ? theme.activeText : theme.screen.text }]}>
        {translate(TranslationKeys.enter_custom_value)}
      </Text>
      <MaterialCommunityIcons name={customSelected ? 'checkbox-marked' : 'checkbox-blank-outline'} size={24} color={customSelected ? theme.activeText : theme.screen.icon} />
    </TouchableOpacity>
  );
};

const renderCustomInputRow = (
  customValue: string,
  error: string | undefined,
  isDisabled: boolean | undefined,
  prefix: AffixProps['prefix'],
  suffix: AffixProps['suffix'],
  onCustomValueChange: (val: string) => void,
) => {
  return (
    <View key="customInput" style={{ width: '100%', marginBottom: 2 }}>
      <SingleLineInput
        id="custom"
        value={customValue}
        onChange={(_, val) => {
          onCustomValueChange(val);
          console.log('[DropdownSheet] custom input changed to', val);
        }}
        error={error || ''}
        isDisabled={!!isDisabled}
        custom_type="string"
        insideBottomSheet
        prefix={prefix}
        suffix={suffix}
        autoFocus
      />
    </View>
  );
};

const renderOptionRow = (
  optionValue: string,
  index: number,
  isSelected: boolean,
  isDisabled: boolean | undefined,
  primaryColor: string,
  theme: DropdownSheetTheme,
  handleSelectOption: (option: string) => void,
) => {
  return (
    <TouchableOpacity
      key={`option-${optionValue}-${index}`}
      style={[styles.optionRow, { backgroundColor: isSelected ? primaryColor : theme.screen.iconBg }]}
      onPress={() => handleSelectOption(optionValue)}
      disabled={isDisabled}
      onPressIn={() => console.log('[DropdownSheet] option pressed', optionValue)}
    >
      <Text style={[styles.optionLabel, { color: isSelected ? theme.activeText : theme.screen.text }]}>{optionValue}</Text>
      <MaterialCommunityIcons name={isSelected ? 'checkbox-marked' : 'checkbox-blank-outline'} size={24} color={isSelected ? theme.activeText : theme.screen.icon} />
    </TouchableOpacity>
  );
};

const DropdownSheet: React.FC<DropdownSheetProps> = ({ closeSheet, options, allowCustomValues, value, onSelectOption, onSelectCustom, onDeselect, isDisabled, prefix, suffix, error }) => {
  const { theme } = useTheme();
  const { translate } = useLanguage();
  const { primaryColor } = useAppSelector(state => state.settings);

  const normalizedOptions = useMemo(() => ensureStringArray(options), [options]);
  const initialIsCustom = allowCustomValues && value.trim().length > 0 && !normalizedOptions.includes(value.trim());
  const [customSelected, setCustomSelected] = useState<boolean>(initialIsCustom);
  const [customValue, setCustomValue] = useState<string>(initialIsCustom ? value : '');

  useEffect(() => {
    if (!customSelected) return;
    // keep customValue in sync when value changes externally while custom is selected
    if (allowCustomValues && value.trim().length > 0 && !normalizedOptions.includes(value.trim())) {
      setCustomValue(value);
    }
  }, [value, customSelected, allowCustomValues, normalizedOptions]);

  const handleDeselect = () => {
    setCustomSelected(false);
    onDeselect();
    closeSheet();
  };

  const handleSelectCustom = () => {
    if (!allowCustomValues) return;
    setCustomSelected(true);
    // ensure customValue displayed (might be blank to allow typing)
    if (value.trim().length > 0 && !normalizedOptions.includes(value.trim())) {
      setCustomValue(value);
      onSelectCustom(value);
    } else {
      setCustomValue('');
      onSelectCustom('');
    }
  };

  const handleSelectOption = (option: string) => {
    setCustomSelected(false);
    onSelectOption(option);
    closeSheet();
  };

  console.log('[DropdownSheet] mount value=', value, ' options=', normalizedOptions);

  type Row = { kind: 'deselect' } | { kind: 'custom' } | { kind: 'customInput' } | { kind: 'option'; value: string };
  const listItems: Row[] = useMemo(() => {
    const rows: Row[] = [{ kind: 'deselect' }];
    if (allowCustomValues) {
      rows.push({ kind: 'custom' });
      if (customSelected) {
        rows.push({ kind: 'customInput' });
      }
    }
    rows.push(...normalizedOptions.map((v): Row => ({ kind: 'option', value: v })));
    return rows;
  }, [normalizedOptions, allowCustomValues, customSelected]);

  const handleCustomValueChange = (val: string) => {
    setCustomValue(val);
    onSelectCustom(val);
  };

  return (
    <View style={{ gap: 10 }}>
      {listItems.map((item, index) => {
        if (item.kind === 'deselect') {
          const active = !customSelected && value.trim().length === 0;
          return renderDeselectRow(active, isDisabled, primaryColor, theme, translate, handleDeselect);
        }
        if (item.kind === 'custom') {
          return renderCustomRow(customSelected, isDisabled, primaryColor, theme, translate, handleSelectCustom);
        }
        if (item.kind === 'customInput') {
          return renderCustomInputRow(customValue, error, isDisabled, prefix, suffix, handleCustomValueChange);
        }
        // option
        const isSelected = !customSelected && value === item.value;
        return renderOptionRow(item.value, index, isSelected, isDisabled, primaryColor, theme, handleSelectOption);
      })}
    </View>
  );
};

export default DropdownSheet;
