import { definePanel } from '@directus/extensions-sdk';
import { ExtendedPanelHelper } from '../helpers/extended-panels/ExtendedPanelHelper';
import { BackendTranslationKeys } from '../helpers/translations/BackendTranslationKeys';
import PanelListExtended from './panel.vue';

/**
 * `Liste [Erweitert]` – Directus' list panel plus a download of the rows behind it.
 *
 * The options mirror the built-in list panel one to one (and reuse its `$t:` labels, which
 * Directus translates itself), so an existing list panel can be rebuilt with the same settings.
 * Added are only the export options. See `ExtendedPanelHelper` for the `[Erweitert]` marker.
 */
// Getters instead of plain strings: Directus re-reads these texts on every change of the UI
// language, see ExtendedPanelHelper.getUiLanguage.
const translate = (key: BackendTranslationKeys) => ExtendedPanelHelper.translate(key, ExtendedPanelHelper.getUiLanguage());

export default definePanel({
  id: 'rocket-meals-list-extended',
  get name() {
    return ExtendedPanelHelper.buildPanelName(translate(BackendTranslationKeys.extended_panel_list_name));
  },
  get description() {
    return translate(BackendTranslationKeys.extended_panel_list_description);
  },
  icon: 'format_list_bulleted',
  component: PanelListExtended,
  options: [
    {
      field: 'collection',
      type: 'string',
      name: '$t:collection',
      meta: {
        interface: 'system-collection',
        options: {
          includeSystem: true,
          includeSingleton: false,
        },
        width: 'half',
      },
    },
    {
      field: 'limit',
      type: 'integer',
      name: '$t:limit',
      schema: {
        default_value: ExtendedPanelHelper.DEFAULT_LIST_LIMIT,
      },
      meta: {
        interface: 'input',
        width: 'half',
      },
    },
    {
      field: 'sortField',
      type: 'string',
      name: '$t:sort_field',
      meta: {
        interface: 'system-field',
        options: {
          collectionField: 'collection',
          allowPrimaryKey: true,
          placeholder: '$t:primary_key',
        },
        width: 'half',
      },
    },
    {
      field: 'sortDirection',
      type: 'string',
      name: '$t:sort_direction',
      schema: {
        default_value: 'desc',
      },
      meta: {
        interface: 'select-dropdown',
        options: {
          choices: [
            { text: '$t:sort_asc', value: 'asc' },
            { text: '$t:sort_desc', value: 'desc' },
          ],
        },
        width: 'half',
      },
    },
    {
      field: 'displayTemplate',
      name: '$t:display_template',
      type: 'string',
      meta: {
        interface: 'system-display-template',
        width: 'half',
        options: {
          collectionField: 'collection',
          placeholder: '{{ field }}',
        },
      },
    },
    {
      field: 'linkToItem',
      name: '$t:list_panel_allow_edit',
      type: 'boolean',
      meta: {
        width: 'half',
        interface: 'toggle',
        required: true,
      },
      schema: {
        default_value: false,
      },
    },
    {
      field: 'filter',
      type: 'json',
      name: '$t:filter',
      meta: {
        interface: 'system-filter',
        options: {
          collectionField: 'collection',
          relationalFieldSelectable: false,
        },
      },
    },
    {
      field: 'exportAllItems',
      get name() {
        return translate(BackendTranslationKeys.extended_panel_option_export_all_items);
      },
      type: 'boolean',
      meta: {
        width: 'half',
        interface: 'toggle',
        get note() {
          return translate(BackendTranslationKeys.extended_panel_option_export_all_items_note);
        },
      },
      schema: {
        default_value: true,
      },
    },
    {
      field: 'exportFields',
      get name() {
        return translate(BackendTranslationKeys.extended_panel_option_export_fields);
      },
      type: 'csv',
      meta: {
        width: 'full',
        interface: 'tags',
        get note() {
          return translate(BackendTranslationKeys.extended_panel_option_export_fields_note);
        },
      },
    },
  ],
  minWidth: 12,
  minHeight: 6,
  skipUndefinedKeys: ['displayTemplate'],
});
