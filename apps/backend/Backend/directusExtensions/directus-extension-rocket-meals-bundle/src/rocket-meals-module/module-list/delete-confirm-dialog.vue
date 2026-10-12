<script setup lang="ts">
/**
 * Asks before deleting items of the module `Rocket Meals`: how many, that their chat messages go
 * with them and that it cannot be undone. Used by the lists (selected items) and the detail pages.
 */
import { useAppExtensionTranslate } from '../../helpers/app-extensions/useAppExtensionTranslate';
import { BackendTranslationKeys } from '../../helpers/translations/BackendTranslationKeys';

defineProps<{ modelValue: boolean; count: number; loading?: boolean }>();
const emit = defineEmits<{ 'update:modelValue': [open: boolean]; confirm: [] }>();

const { translate } = useAppExtensionTranslate();
</script>

<template>
  <v-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)" @esc="emit('update:modelValue', false)">
    <v-card>
      <v-card-title>{{ translate(BackendTranslationKeys.rocket_meals_module_delete_confirm_title) }}</v-card-title>
      <v-card-text>{{ translate(BackendTranslationKeys.rocket_meals_module_delete_confirm_text, { count }) }}</v-card-text>
      <v-card-actions>
        <v-button secondary @click="emit('update:modelValue', false)">{{ translate(BackendTranslationKeys.cancel) }}</v-button>
        <v-button kind="danger" :loading="loading" @click="emit('confirm')">{{ translate(BackendTranslationKeys.delete) }}</v-button>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
