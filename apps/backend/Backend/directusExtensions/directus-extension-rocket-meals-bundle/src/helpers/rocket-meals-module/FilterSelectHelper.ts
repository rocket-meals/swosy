/**
 * FilterSelectHelper.ts – the logic of the dropdown `filter-select.vue` in the module
 * `Rocket Meals`: an option with icon or image, single or multiple selection where nothing
 * selected means "all".
 *
 * Plain logic without Vue or Directus app imports, so it can be unit tested in Node.
 */

export type FilterSelectValue = string | number;

export type FilterSelectOption<T extends FilterSelectValue = FilterSelectValue> = {
  value: T;
  text: string;
  /** A Directus icon name – Material icons and brand icons like `apple` or `google_play`. */
  icon?: string;
  /** A CSS colour of the icon, e.g. `var(--theme--success)`. */
  iconColor?: string;
  /** Shown instead of the icon, e.g. the picture of a canteen. */
  imageUrl?: string;
};

export class FilterSelectHelper {
  /** At most this many icons or images of the selection are shown in the closed dropdown. */
  public static readonly MAX_PREVIEW_OPTIONS = 3;

  /** The selected values as a list – also for a single selection and nothing selected. */
  static getSelectedValues<T extends FilterSelectValue>(modelValue: T | readonly T[] | null | undefined): T[] {
    if (modelValue === null || modelValue === undefined) {
      return [];
    }
    return Array.isArray(modelValue) ? [...(modelValue as readonly T[])] : [modelValue as T];
  }

  /** The options that are selected, in the order of the options. */
  static getSelectedOptions<T extends FilterSelectValue>(options: readonly FilterSelectOption<T>[], modelValue: T | readonly T[] | null | undefined): FilterSelectOption<T>[] {
    const selected = FilterSelectHelper.getSelectedValues(modelValue);
    return options.filter(option => selected.includes(option.value));
  }

  /** Adds or removes a value of a multiple selection, keeping the order of the options. */
  static toggle<T extends FilterSelectValue>(options: readonly FilterSelectOption<T>[], selected: readonly T[] | null | undefined, value: T): T[] {
    const current = selected ?? [];
    const next = current.includes(value) ? current.filter(entry => entry !== value) : [...current, value];
    return options.map(option => option.value).filter(entry => next.includes(entry));
  }

  /** The text of the closed dropdown: the selected options, `undefined` for nothing selected. */
  static getDisplayText<T extends FilterSelectValue>(options: readonly FilterSelectOption<T>[], modelValue: T | readonly T[] | null | undefined): string | undefined {
    const text = FilterSelectHelper.getSelectedOptions(options, modelValue)
      .map(option => option.text)
      .join(', ');
    return text || undefined;
  }
}
