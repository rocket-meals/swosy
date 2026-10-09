<script setup lang="ts">
/**
 * A dropdown of the list filters in the module `Rocket Meals`. Unlike Directus' `v-select` every
 * option shows its icon or image (brand icons of the stores, pictures of the canteens), also with
 * multiple selection. With `multiple` every option has a checkbox and nothing selected means all:
 * the first entry (`placeholder`) clears the selection.
 */
import { computed } from 'vue';
import { FilterSelectHelper, type FilterSelectOption, type FilterSelectValue } from '../helpers/rocket-meals-module/FilterSelectHelper';

const props = withDefaults(
  defineProps<{
    modelValue?: FilterSelectValue | FilterSelectValue[] | null;
    items: readonly FilterSelectOption[];
    multiple?: boolean;
    /** Text and icon of "nothing selected", with `multiple` also the entry that clears the selection. */
    placeholder?: string;
    placeholderIcon?: string;
    disabled?: boolean;
  }>(),
  { modelValue: null, multiple: false, placeholder: undefined, placeholderIcon: undefined, disabled: false }
);

const emit = defineEmits<{ 'update:modelValue': [value: FilterSelectValue | FilterSelectValue[] | null] }>();

const selectedValues = computed(() => FilterSelectHelper.getSelectedValues(props.modelValue));
const displayText = computed(() => FilterSelectHelper.getDisplayText(props.items, props.modelValue) ?? props.placeholder ?? '');
const previewOptions = computed<FilterSelectOption[]>(() => {
  const selected = FilterSelectHelper.getSelectedOptions(props.items, props.modelValue).filter(option => option.icon || option.imageUrl);
  if (selected.length === 0) {
    return props.placeholderIcon ? [{ value: '', text: props.placeholder ?? '', icon: props.placeholderIcon }] : [];
  }
  return selected.slice(0, FilterSelectHelper.MAX_PREVIEW_OPTIONS);
});

function isSelected(option: FilterSelectOption) {
  return selectedValues.value.includes(option.value);
}

function select(option: FilterSelectOption) {
  if (props.multiple) {
    emit('update:modelValue', FilterSelectHelper.toggle(props.items, selectedValues.value, option.value));
  } else {
    emit('update:modelValue', option.value);
  }
}

function clear() {
  emit('update:modelValue', []);
}
</script>

<template>
  <v-menu attached :disabled="disabled" :close-on-content-click="!multiple">
    <template #activator="{ toggle, active }">
      <v-input :model-value="displayText" readonly clickable :disabled="disabled" :active="active" class="filter-select-input" @click="toggle">
        <template v-if="previewOptions.length > 0" #prepend>
          <span class="preview">
            <template v-for="option in previewOptions" :key="String(option.value)">
              <img v-if="option.imageUrl" class="option-image" :src="option.imageUrl" alt="" loading="lazy" />
              <v-icon v-else :name="option.icon" :style="option.iconColor ? { '--v-icon-color': option.iconColor } : undefined" />
            </template>
          </span>
        </template>
        <template #append>
          <v-icon name="expand_more" class="expand" :class="{ active }" />
        </template>
      </v-input>
    </template>

    <v-list class="list">
      <template v-if="multiple">
        <v-list-item clickable :active="selectedValues.length === 0" @click="clear">
          <v-list-item-icon>
            <v-icon :name="selectedValues.length === 0 ? 'check_box' : 'check_box_outline_blank'" class="checkbox" :class="{ checked: selectedValues.length === 0 }" />
          </v-list-item-icon>
          <v-list-item-icon v-if="placeholderIcon"><v-icon :name="placeholderIcon" /></v-list-item-icon>
          <v-list-item-content>{{ placeholder }}</v-list-item-content>
        </v-list-item>
        <v-divider />
      </template>

      <v-list-item v-for="option in items" :key="String(option.value)" clickable :active="isSelected(option)" @click="select(option)">
        <v-list-item-icon v-if="multiple">
          <v-icon :name="isSelected(option) ? 'check_box' : 'check_box_outline_blank'" class="checkbox" :class="{ checked: isSelected(option) }" />
        </v-list-item-icon>
        <v-list-item-icon v-if="option.imageUrl || option.icon">
          <img v-if="option.imageUrl" class="option-image" :src="option.imageUrl" alt="" loading="lazy" />
          <v-icon v-else :name="option.icon" :style="option.iconColor ? { '--v-icon-color': option.iconColor } : undefined" />
        </v-list-item-icon>
        <v-list-item-content>{{ option.text }}</v-list-item-content>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<style scoped>
.filter-select-input {
  cursor: pointer;
}

.filter-select-input :deep(input) {
  cursor: pointer;
}

.preview {
  display: inline-flex;
  gap: 0.25rem;
  align-items: center;
}

.option-image {
  display: block;
  inline-size: 1.5rem;
  block-size: 1.5rem;
  object-fit: cover;
  border-radius: 50%;
}

.expand {
  transition: transform var(--medium) var(--transition-out);
}

.expand.active {
  transform: scaleY(-1);
  transition-timing-function: var(--transition-in);
}

.checkbox {
  --v-icon-color: var(--theme--foreground-subdued);
}

.checkbox.checked {
  --v-icon-color: var(--theme--primary);
}

.list {
  --v-list-min-width: 12rem;
}
</style>
