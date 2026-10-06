<script setup lang="ts">
/**
 * `Seite exportieren [Erweitert]` – downloads the dashboard this panel sits on as PDF or PNG.
 *
 * The dashboard is rendered to an image in the browser (`html-to-image`, which lets the browser
 * itself draw the DOM, so charts, themes and fonts look exactly like on screen). For the PDF the
 * image is laid out on A4 landscape pages (`jspdf`), split over several pages when the dashboard
 * is longer than one. The tile of this panel itself is left out of the export.
 */
import { useStores } from '@directus/extensions-sdk';
import { toCanvas } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { computed, ref } from 'vue';
import { ExtendedPanelHelper } from '../helpers/extended-panels/ExtendedPanelHelper';
import { useAppExtensionTranslate } from '../helpers/app-extensions/useAppExtensionTranslate';
import { BackendTranslationKeys } from '../helpers/translations/BackendTranslationKeys';
import { BackendTranslator } from '../helpers/translations/BackendTranslator';

type PageExportFormat = 'pdf' | 'png';

const props = defineProps<{
  id: string;
  dashboard: string;
  showHeader?: boolean;
}>();

const { useInsightsStore, useNotificationsStore } = useStores();
const insightsStore = useInsightsStore();
const notificationsStore = useNotificationsStore();

// Same language as the Directus UI, see useAppExtensionTranslate.
const { language, translate } = useAppExtensionTranslate();

const root = ref<HTMLElement>();
const exporting = ref(false);

const dashboardName = computed<string>(() => insightsStore.dashboards?.find((dashboard: { id: string }) => dashboard.id === props.dashboard)?.name ?? '');

/** Pixel density of the rendered image – sharp in the PDF without becoming huge. */
const PIXEL_RATIO = 2;
/** A4 landscape in pt, with a margin around the content. */
const PDF_MARGIN = 24;
/** Height of the title line above the dashboard image, in CSS px. */
const TITLE_HEIGHT = 56;
/** Set on the dashboard while it is rendered, see the unscoped style block below. */
const EXPORTING_CLASS = 'rocket-meals-page-exporting';

function getBackgroundColor(element: HTMLElement): string {
  let current: HTMLElement | null = element;
  while (current) {
    const color = getComputedStyle(current).backgroundColor;
    if (color && color !== 'transparent' && color !== 'rgba(0, 0, 0, 0)') {
      return color;
    }
    current = current.parentElement;
  }
  return '#ffffff';
}

/** Draws the dashboard name and the export date above the dashboard image. */
function addTitle(dashboardCanvas: HTMLCanvasElement, backgroundColor: string, textColor: string): HTMLCanvasElement {
  const titleHeight = TITLE_HEIGHT * PIXEL_RATIO;
  const canvas = document.createElement('canvas');
  canvas.width = dashboardCanvas.width;
  canvas.height = dashboardCanvas.height + titleHeight;
  const context = canvas.getContext('2d');
  if (!context) {
    return dashboardCanvas;
  }
  context.fillStyle = backgroundColor;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = textColor;
  context.textBaseline = 'middle';
  context.font = `600 ${20 * PIXEL_RATIO}px ${getComputedStyle(document.body).fontFamily}`;
  const title = [dashboardName.value, BackendTranslator.formatDate(new Date(), language.value)].filter(part => part.length > 0).join(' · ');
  context.fillText(title, 16 * PIXEL_RATIO, titleHeight / 2);
  context.drawImage(dashboardCanvas, 0, titleHeight);
  return canvas;
}

async function renderDashboard(): Promise<{ canvas: HTMLCanvasElement; backgroundColor: string }> {
  const workspace = root.value?.closest<HTMLElement>('.v-workspace');
  if (!workspace) {
    throw new Error('dashboard workspace not found');
  }
  // Leave out the tile of this panel – nobody needs the export button in the export.
  const ownTile = root.value?.closest('.v-workspace-tile');
  const backgroundColor = getBackgroundColor(workspace);
  // Scrollbars of scrollable panels would end up in the image as light bars.
  workspace.classList.add(EXPORTING_CLASS);
  let dashboardCanvas: HTMLCanvasElement;
  try {
    dashboardCanvas = await toCanvas(workspace, {
      pixelRatio: PIXEL_RATIO,
      backgroundColor,
      filter: node => node !== ownTile && !(node instanceof HTMLElement && node.classList.contains(ExtendedPanelHelper.PAGE_EXPORT_EXCLUDE_CLASS)),
    });
  } finally {
    workspace.classList.remove(EXPORTING_CLASS);
  }
  return {
    canvas: addTitle(dashboardCanvas, backgroundColor, getComputedStyle(workspace).color || '#000000'),
    backgroundColor,
  };
}

function downloadDataUrl(dataUrl: string, fileName: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

/** `rgb(12, 14, 20)` → `[12, 14, 20]`; white if the browser reports something else. */
function toRgb(color: string): [number, number, number] {
  const [red, green, blue] = (color.match(/\d+(\.\d+)?/g) ?? []).map(Number);
  if (red === undefined || green === undefined || blue === undefined) {
    return [255, 255, 255];
  }
  return [red, green, blue];
}

function savePdf(canvas: HTMLCanvasElement, backgroundColor: string, fileName: string) {
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const [red, green, blue] = toRgb(backgroundColor);
  const contentWidth = pageWidth - 2 * PDF_MARGIN;
  const scale = contentWidth / canvas.width;
  const sliceHeight = Math.floor((pageHeight - 2 * PDF_MARGIN) / scale);

  ExtendedPanelHelper.getPageSlices(canvas.height, sliceHeight).forEach((slice, index) => {
    const sliceCanvas = document.createElement('canvas');
    sliceCanvas.width = canvas.width;
    sliceCanvas.height = slice.height;
    sliceCanvas.getContext('2d')?.drawImage(canvas, 0, slice.offset, canvas.width, slice.height, 0, 0, canvas.width, slice.height);
    if (index > 0) {
      pdf.addPage();
    }
    // Page in the colour of the dashboard, so a dark theme gets no white frame.
    pdf.setFillColor(red, green, blue);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
    pdf.addImage(sliceCanvas.toDataURL('image/jpeg', 0.92), 'JPEG', PDF_MARGIN, PDF_MARGIN, contentWidth, slice.height * scale);
  });

  pdf.save(fileName);
}

async function exportPage(format: PageExportFormat) {
  if (exporting.value) {
    return;
  }
  exporting.value = true;
  try {
    const { canvas, backgroundColor } = await renderDashboard();
    const fileName = ExtendedPanelHelper.buildExportFileName(dashboardName.value, format, new Date());
    if (format === 'pdf') {
      savePdf(canvas, backgroundColor, fileName);
    } else {
      downloadDataUrl(canvas.toDataURL('image/png'), fileName);
    }
  } catch (error) {
    console.error('[rocket-meals-page-export] export failed', error);
    notificationsStore.add({ title: translate(BackendTranslationKeys.extended_panel_export_failed), type: 'error' });
  } finally {
    exporting.value = false;
  }
}
</script>

<template>
  <div ref="root" class="page-export" :class="{ 'has-header': showHeader }">
    <v-menu show-arrow placement="bottom" :disabled="exporting">
      <template #activator="{ toggle }">
        <v-button :loading="exporting" :disabled="exporting" @click="toggle">
          <v-icon name="download" left />
          {{ translate(BackendTranslationKeys.extended_panel_page_export_button) }}
        </v-button>
      </template>
      <v-list>
        <v-list-item clickable @click="exportPage('pdf')">
          <v-list-item-icon><v-icon name="picture_as_pdf" small /></v-list-item-icon>
          <v-list-item-content>{{ translate(BackendTranslationKeys.extended_panel_page_export_format_pdf) }}</v-list-item-content>
        </v-list-item>
        <v-list-item clickable @click="exportPage('png')">
          <v-list-item-icon><v-icon name="image" small /></v-list-item-icon>
          <v-list-item-content>{{ translate(BackendTranslationKeys.extended_panel_page_export_format_png) }}</v-list-item-content>
        </v-list-item>
      </v-list>
    </v-menu>
    <span v-if="exporting" class="type-note">{{ translate(BackendTranslationKeys.extended_panel_page_export_running) }}</span>
  </div>
</template>

<style scoped>
.page-export {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  block-size: 100%;
  padding: 0.75rem;
}
</style>

<style>
/* Unscoped on purpose: applies to every panel of the dashboard while it is being exported. */
.rocket-meals-page-exporting,
.rocket-meals-page-exporting * {
  scrollbar-width: none;
}
</style>
