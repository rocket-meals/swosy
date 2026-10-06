<script setup lang="ts">
/**
 * `Liste [Erweitert]` – renders like Directus' list panel and adds an export button.
 *
 * The built-in list panel gets its rows from the Insights store via GraphQL. GraphQL needs the
 * primary key of the collection while the query is built, which a panel extension cannot look up
 * at that point – so this panel loads its rows itself via REST. The options arrive here with the
 * dashboard variables already filled in, and the panel reloads whenever the dashboard refreshes
 * (manually or via auto refresh), so it behaves like the built-in one.
 */
import { useApi, useStores } from '@directus/extensions-sdk';
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { ExtendedPanelHelper, type ExtendedPanelExportFormat, type ExtendedPanelSortDirection } from '../helpers/extended-panels/ExtendedPanelHelper';
import { BackendTranslationKeys } from '../helpers/translations/BackendTranslationKeys';

const props = withDefaults(
  defineProps<{
    id: string;
    dashboard: string;
    showHeader?: boolean;
    collection?: string;
    displayTemplate?: string;
    linkToItem?: boolean;
    filter?: Record<string, unknown> | null;
    sortField?: string | null;
    sortDirection?: ExtendedPanelSortDirection | null;
    limit?: number | null;
    exportAllItems?: boolean | null;
    exportFields?: string[] | null;
  }>(),
  {
    showHeader: false,
    displayTemplate: '',
    linkToItem: false,
    filter: null,
    sortField: null,
    sortDirection: 'desc',
    limit: null,
    exportAllItems: true,
    exportFields: null,
  }
);

const api = useApi();
const { useFieldsStore, useInsightsStore, useUserStore, useSettingsStore, useNotificationsStore } = useStores();
const fieldsStore = useFieldsStore();
const insightsStore = useInsightsStore();
const userStore = useUserStore();
const settingsStore = useSettingsStore();
const notificationsStore = useNotificationsStore();

const language = computed<string | undefined>(() => userStore.currentUser?.language ?? settingsStore.settings?.default_language ?? ExtendedPanelHelper.getUiLanguage());
const translate = (key: BackendTranslationKeys) => ExtendedPanelHelper.translate(key, language.value);

const rows = ref<Record<string, any>[]>([]);
const loading = ref(false);
const loadError = ref(false);
const exporting = ref(false);
const currentlyEditing = ref<number | string>();

const primaryKeyField = computed<string>(() => {
  if (!props.collection) {
    return 'id';
  }
  return fieldsStore.getPrimaryKeyFieldForCollection(props.collection)?.field ?? 'id';
});

const queryOptions = computed(() => ({
  collection: props.collection,
  primaryKeyField: primaryKeyField.value,
  displayTemplate: props.displayTemplate,
  filter: props.filter,
  sortField: props.sortField,
  sortDirection: props.sortDirection,
  limit: props.limit,
}));

const panelName = computed<string | undefined>(() => insightsStore.panels?.find((panel: { id: string }) => panel.id === props.id)?.name);

let latestRequest = 0;

async function loadRows() {
  if (!props.collection) {
    rows.value = [];
    return;
  }
  const request = ++latestRequest;
  loading.value = true;
  try {
    const response = await api.get(ExtendedPanelHelper.getCollectionEndpoint(props.collection), {
      params: ExtendedPanelHelper.buildListQuery(queryOptions.value),
    });
    if (request === latestRequest) {
      rows.value = response.data?.data ?? [];
      loadError.value = false;
    }
  } catch (error) {
    if (request === latestRequest) {
      rows.value = [];
      loadError.value = true;
    }
    console.error('[rocket-meals-list-extended] loading rows failed', error);
  } finally {
    if (request === latestRequest) {
      loading.value = false;
    }
  }
}

async function exportAs(exportFormat: ExtendedPanelExportFormat) {
  if (!props.collection || exporting.value) {
    return;
  }
  exporting.value = true;
  try {
    const query = ExtendedPanelHelper.buildExportQuery({
      ...queryOptions.value,
      exportAllItems: props.exportAllItems,
      exportFields: props.exportFields,
    });
    const response = await api.get(ExtendedPanelHelper.getCollectionEndpoint(props.collection), {
      params: { ...query, export: exportFormat.format },
      responseType: 'blob',
    });
    const fileName = ExtendedPanelHelper.buildExportFileName(panelName.value || props.collection, exportFormat.extension, new Date());
    downloadBlob(response.data as Blob, fileName);
  } catch (error) {
    console.error('[rocket-meals-list-extended] export failed', error);
    notificationsStore.add({ title: translate(BackendTranslationKeys.extended_panel_export_failed), type: 'error' });
  } finally {
    exporting.value = false;
  }
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function startEditing(item: Record<string, any>) {
  if (!props.linkToItem) {
    return;
  }
  currentlyEditing.value = item[primaryKeyField.value];
}

function cancelEdit() {
  currentlyEditing.value = undefined;
}

async function saveEdits(item: Record<string, any>) {
  if (!props.collection || currentlyEditing.value === undefined) {
    return;
  }
  try {
    await api.patch(`${ExtendedPanelHelper.getCollectionEndpoint(props.collection)}/${currentlyEditing.value}`, item);
  } catch (error) {
    console.error('[rocket-meals-list-extended] saving item failed', error);
  }
  await insightsStore.refresh(props.dashboard);
}

// Options changed (also when a dashboard variable changed) → reload.
watch(queryOptions, loadRows, { deep: true, immediate: true });

// Every refresh of the dashboard (button, auto refresh, saving) replaces the Insights data
// object. Our rows are not part of it, so that is the signal to reload them as well.
let refreshTimeout: ReturnType<typeof setTimeout> | undefined;
watch(
  () => insightsStore.data,
  () => {
    clearTimeout(refreshTimeout);
    refreshTimeout = setTimeout(loadRows, 50);
  }
);
onBeforeUnmount(() => clearTimeout(refreshTimeout));
</script>

<template>
  <div class="list-extended" :class="{ 'has-header': showHeader }">
    <div class="toolbar">
      <v-progress-circular v-if="loading" class="loading-indicator" indeterminate x-small />
      <v-menu show-arrow placement="bottom-end" :disabled="!collection || exporting">
        <template #activator="{ toggle }">
          <v-button v-tooltip="translate(BackendTranslationKeys.extended_panel_export)" :class="ExtendedPanelHelper.PAGE_EXPORT_EXCLUDE_CLASS" :aria-label="translate(BackendTranslationKeys.extended_panel_export)" :disabled="!collection" :loading="exporting" icon secondary x-small @click="toggle">
            <v-icon name="download" small />
          </v-button>
        </template>
        <v-list>
          <v-list-item v-for="exportFormat in ExtendedPanelHelper.EXPORT_FORMATS" :key="exportFormat.format" clickable @click="exportAs(exportFormat)">
            <v-list-item-icon><v-icon name="description" small /></v-list-item-icon>
            <v-list-item-content>{{ translate(exportFormat.labelKey) }}</v-list-item-content>
          </v-list-item>
        </v-list>
      </v-menu>
    </div>

    <div class="content">
      <div v-if="loadError" class="state type-note">
        <v-icon name="warning" small />
        {{ translate(BackendTranslationKeys.extended_panel_load_failed) }}
      </div>
      <div v-else-if="!loading && rows.length === 0" class="state type-note">
        {{ translate(BackendTranslationKeys.no_data_found) }}
      </div>
      <v-list v-else>
        <v-list-item v-for="row in rows" :key="row[primaryKeyField]" :clickable="linkToItem === true" @click="startEditing(row)">
          <render-template :item="row" :collection="collection" :template="displayTemplate" />
          <div class="spacer" />
        </v-list-item>
      </v-list>
    </div>

    <drawer-item v-if="collection" :active="currentlyEditing !== undefined" :collection="collection" :primary-key="currentlyEditing ?? '+'" @input="saveEdits" @update:active="cancelEdit" />
  </div>
</template>

<style scoped>
.list-extended {
  position: relative;
  --v-list-padding: 0;
  --v-list-border-radius: 0;
  --v-list-item-border-radius: 0;
  --v-list-item-padding: 0.3125rem;
  --v-list-item-margin: 0;

  display: flex;
  flex-direction: column;
  block-size: 100%;
  padding: 0 0.6875rem;
}

/* Floats in the top right corner so the list keeps the full height of the panel. */
.toolbar {
  position: absolute;
  inset-block-start: 0.4375rem;
  inset-inline-end: 0.6875rem;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.content {
  flex: 1;
  min-block-size: 0;
  overflow-y: auto;
}

.state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  block-size: 100%;
}

.v-list-item {
  block-size: 2.6875rem;
  border-block-start: var(--theme--border-width) solid var(--theme--border-color-subdued);
}

.v-list-item:last-child {
  border-block-end: var(--theme--border-width) solid var(--theme--border-color-subdued);
}
</style>
