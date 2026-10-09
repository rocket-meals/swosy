<script setup lang="ts">
/** Asks for the input of a new run (JSON or empty) before starting a workflow by hand. */
import { ref, watch } from 'vue';
import { useAppExtensionTranslate } from '../../helpers/app-extensions/useAppExtensionTranslate';
import { WorkflowsPageHelper } from '../../helpers/rocket-meals-module/WorkflowsPageHelper';
import { BackendTranslationKeys } from '../../helpers/translations/BackendTranslationKeys';

const props = defineProps<{
  modelValue: boolean;
  workflowName: string;
  /** Prefilled text, e.g. the template of the workflow or the input of an earlier run. */
  initialInput: string;
}>();

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void;
  (event: 'start', input: string | null): void;
}>();

const { translate } = useAppExtensionTranslate();

const inputText = ref(props.initialInput);
const invalid = ref(false);

watch(
  () => [props.modelValue, props.initialInput] as const,
  ([open, initialInput]) => {
    if (open) {
      inputText.value = initialInput;
      invalid.value = false;
    }
  }
);

function close() {
  emit('update:modelValue', false);
}

function start() {
  const parsed = WorkflowsPageHelper.parseInput(inputText.value);
  if (!parsed.ok) {
    invalid.value = true;
    return;
  }
  emit('start', parsed.input);
  close();
}
</script>

<template>
  <v-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)" @esc="close">
    <v-card>
      <v-card-title>{{ translate(BackendTranslationKeys.rocket_meals_module_workflows_start_dialog_title, { name: workflowName }) }}</v-card-title>
      <v-card-text>
        <p class="type-note hint">{{ translate(BackendTranslationKeys.rocket_meals_module_workflows_input_hint) }}</p>
        <div class="type-label label">{{ translate(BackendTranslationKeys.rocket_meals_module_workflows_input_label) }}</div>
        <v-textarea v-model="inputText" class="input" @update:model-value="invalid = false" />
        <v-notice v-if="invalid" type="danger" class="invalid">{{ translate(BackendTranslationKeys.rocket_meals_module_workflows_input_invalid) }}</v-notice>
      </v-card-text>
      <v-card-actions>
        <v-button secondary @click="close">{{ translate(BackendTranslationKeys.cancel) }}</v-button>
        <v-button @click="start">
          <v-icon name="play_arrow" left />
          {{ translate(BackendTranslationKeys.rocket_meals_module_workflows_start) }}
        </v-button>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.hint {
  margin-block-end: 1rem;
}

.label {
  margin-block-end: 0.5rem;
}

.input :deep(textarea) {
  min-block-size: 8rem;
  font-family: var(--theme--fonts--monospace--font-family, monospace);
}

.invalid {
  margin-block-start: 0.75rem;
}
</style>
