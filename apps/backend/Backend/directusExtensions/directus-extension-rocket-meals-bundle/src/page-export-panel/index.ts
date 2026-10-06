import { definePanel } from '@directus/extensions-sdk';
import { ExtendedPanelHelper } from '../helpers/extended-panels/ExtendedPanelHelper';
import { BackendTranslationKeys } from '../helpers/translations/BackendTranslationKeys';
import PanelPageExport from './panel.vue';

/**
 * `Seite exportieren [Erweitert]` – a button on a dashboard that downloads the whole dashboard
 * as a PDF (or PNG). It has no options and no data of its own; place it anywhere on the dashboard.
 * See `ExtendedPanelHelper` for the `[Erweitert]` marker.
 */
// Getters instead of plain strings: Directus re-reads these texts on every change of the UI
// language, see ExtendedPanelHelper.getUiLanguage.
const translate = (key: BackendTranslationKeys) => ExtendedPanelHelper.translate(key, ExtendedPanelHelper.getUiLanguage());

export default definePanel({
  id: 'rocket-meals-page-export',
  get name() {
    return ExtendedPanelHelper.buildPanelName(translate(BackendTranslationKeys.extended_panel_page_export_name));
  },
  get description() {
    return translate(BackendTranslationKeys.extended_panel_page_export_description);
  },
  icon: 'picture_as_pdf',
  component: PanelPageExport,
  options: [],
  minWidth: 8,
  minHeight: 3,
});
