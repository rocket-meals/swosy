import React, {FunctionComponent} from 'react';
import {SimpleDatePickerComponent} from './SimpleDatePickerComponent';
import {TranslationKeys, useTranslation} from '@/helper/translations/Translation';
import {DateHelper} from '@/helper/date/DateHelper';
import {useProfileLocaleForJsDate} from '@/states/SynchedProfile';
import {useProjectColor, useProjectColorContrast} from '@/states/ProjectInfo';
import {useTextContrastColor} from '@/components/Themed';
import {MyButton} from '@/components/buttons/MyButton';
import {IconNames} from '@/constants/IconNames';
import {useSynchedFirstWeekday} from '@/states/SynchedFirstWeekday';
import {useModalGlobalContext} from "@/components/rootLayout/RootThemeProvider";

export interface SimpleDatePickerProps {
    currentDate: Date,
    onSelectDate?: (date: Date) => void,
    onCancel?: () => Promise<boolean>,
    renderDate?: ((dateToRender: Date | null, referenceDate: Date | null, emptyRow: boolean) => any) | undefined,
    accessibilityLabel?: string,
    children?: React.ReactNode
}
export const SimpleDatePicker: FunctionComponent<SimpleDatePickerProps> = (props) => {
	const [firstDayOfWeek, setFirstDayOfWeek] = useSynchedFirstWeekday();

	const translation_select = useTranslation(TranslationKeys.select);
	const translation_date = useTranslation(TranslationKeys.date);
	const selectDateTranslation = translation_select + ': ' + translation_date;
	const yearTranslation = useTranslation(TranslationKeys.year);
	const monthTranslation = useTranslation(TranslationKeys.month);
	const selectedTranslation = useTranslation(TranslationKeys.selected);
	const translation_edit = useTranslation(TranslationKeys.edit);

	const currentDateFromProps = props?.currentDate;
	const currentDate = currentDateFromProps ? new Date(currentDateFromProps) : new Date(); // make a copy if currentDateFromProps is a hookValue and to remove side effects
	const formatedSelectedDate = DateHelper.formatOfferDateToReadable(new Date(currentDate), true);
	const defaultAccessibilityLabel = translation_edit + ': ' + translation_date + ': ' + formatedSelectedDate;
	const accessibilityLabel = props?.accessibilityLabel || defaultAccessibilityLabel;

	const weekStartsAtDay = firstDayOfWeek

	const locale = useProfileLocaleForJsDate();

	const textColor = useTextContrastColor()

	const selectedDateColor = useProjectColor();
	const selectedTextColor = useProjectColorContrast();

	const weekdayBackgroundColor = useProjectColor();
	const weekdayTextColor = useProjectColorContrast();

	const [modalConfig, setModalConfig] = useModalGlobalContext();

	const onSelectDate = (date: Date) => {
		if (props.onSelectDate) {
			props.onSelectDate(date);
		}
		setModalConfig(null)
	}

	const onPress = () => {
		setModalConfig({
			title: selectDateTranslation,
			label: selectDateTranslation,
			accessibilityLabel: selectDateTranslation,
			key: 'datePicker',
			renderAsContentInsteadItems: (key: string, hide: () => void) => {
				return(
					<SimpleDatePickerComponent
						currentDate={props.currentDate}
						textColor={textColor}
						selectedTextColor={selectedTextColor}
						selectedDateColor={selectedDateColor}
						weekdayBackgroundColor={weekdayBackgroundColor}
						weekdayTextColor={weekdayTextColor}
						weekStartsAtDay={weekStartsAtDay}
						onSelectDate={onSelectDate}
						renderDate={props.renderDate}
						locale={locale}
						yearTranslation={yearTranslation}
						monthTranslation={monthTranslation}
						selectedTranslation={selectedTranslation}
					/>
				)
			}
		})
	}

	return (
		<>
			<MyButton useTransparentBorderColor={true} tooltip={accessibilityLabel} useOnlyNecessarySpace={true} leftIcon={IconNames.calendar_icon} accessibilityLabel={accessibilityLabel} onPress={onPress} />
		</>
	)
}
