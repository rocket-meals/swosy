/**
 * ExtendedPanelHelper.ts – shared logic of the Insights panels Rocket Meals ships itself.
 *
 * Directus' built-in panels (list, metric, charts, …) are part of the Directus app and cannot be
 * extended. Where a customer needs more – e.g. exporting the rows behind a list, or the whole
 * dashboard as a PDF – we ship our own panel extensions in this bundle. Every one of them carries
 * the marker `[Erweitert]` in its name (`Liste [Erweitert]`, `Seite exportieren [Erweitert]`), so
 * in the panel picker our panels are recognisable at a glance, the same way dashboards carry
 * `[System]` (see `DashboardNameHelper`).
 *
 * This file holds only plain logic without Vue or Directus app imports, so it can be unit tested
 * in Node. The panels themselves live in `src/list-extended-panel` and `src/page-export-panel`.
 */

// Not the package index: this file is bundled into the Directus app, see BackendTranslator.ts.
import { DashboardNameHelper } from 'repo-depkit-common/src/DashboardNameHelper';
import { FileNameHelper } from 'repo-depkit-common/src/FileNameHelper';
import { AppExtensionLanguageHelper } from '../app-extensions/AppExtensionLanguageHelper';
import { BackendTranslationKeys } from '../translations/BackendTranslationKeys';

export type ExtendedPanelSortDirection = 'asc' | 'desc';

/** The options of `Liste [Erweitert]` that decide which rows are shown and exported. */
export type ExtendedListQueryOptions = {
  primaryKeyField: string;
  displayTemplate?: string | null;
  filter?: Record<string, unknown> | null;
  sortField?: string | null;
  sortDirection?: ExtendedPanelSortDirection | null;
  limit?: number | null;
};

/** A REST query in the shape `GET /items/:collection` takes as URL parameters. */
export type ExtendedListRestQuery = {
  fields: string;
  filter: string;
  sort: string;
  limit: number;
};

/** A format the Directus REST API can export to via the `export` query parameter. */
export type ExtendedPanelExportFormat = {
  /** Value of the `export` query parameter. */
  format: 'csv_utf8' | 'json' | 'xml' | 'yaml';
  /** File extension of the downloaded file. */
  extension: string;
  /** Label key in the translation catalogue. */
  labelKey: BackendTranslationKeys;
};

export class ExtendedPanelHelper {
  /** The key inside the marker of our own panels. */
  public static readonly NAME_KEY = 'Erweitert';

  /** The marker of our own panels: `[Erweitert]`. */
  public static readonly NAME_MARKER = DashboardNameHelper.buildNameMarker(ExtendedPanelHelper.NAME_KEY);

  /** Same default as Directus' own list panel. */
  public static readonly DEFAULT_LIST_LIMIT = 5;

  /** `limit=-1` makes Directus return all rows instead of the first page. */
  public static readonly EXPORT_ALL_LIMIT = -1;

  /** Elements with this class are left out of the page export (e.g. the export buttons themselves). */
  public static readonly PAGE_EXPORT_EXCLUDE_CLASS = 'rocket-meals-page-export-exclude';

  /**
   * `csv_utf8` instead of `csv`: it starts with a byte order mark, so Excel opens umlauts
   * correctly instead of showing `HÃ¤hnchen`.
   */
  public static readonly EXPORT_FORMATS: readonly ExtendedPanelExportFormat[] = [
    { format: 'csv_utf8', extension: 'csv', labelKey: BackendTranslationKeys.extended_panel_export_format_csv },
    { format: 'json', extension: 'json', labelKey: BackendTranslationKeys.extended_panel_export_format_json },
    { format: 'xml', extension: 'xml', labelKey: BackendTranslationKeys.extended_panel_export_format_xml },
    { format: 'yaml', extension: 'yaml', labelKey: BackendTranslationKeys.extended_panel_export_format_yaml },
  ];

  /** `Liste` becomes `Liste [Erweitert]`. */
  static buildPanelName(baseName: string): string {
    return DashboardNameHelper.withNameMarker(baseName, ExtendedPanelHelper.NAME_KEY);
  }

  static isExtendedPanelName(name: string | null | undefined): boolean {
    return DashboardNameHelper.hasNameMarker(name, ExtendedPanelHelper.NAME_KEY);
  }

  /**
   * Translates a key for a language as Directus or the browser reports it (`de-DE`, `en-US`, …).
   * Unknown languages fall back to German, like everywhere else in the backend.
   */
  static translate(key: BackendTranslationKeys, language?: string | null): string {
    return AppExtensionLanguageHelper.translate(key, language);
  }

  /** See {@link AppExtensionLanguageHelper.getUiLanguage}. */
  static getUiLanguage(): string | undefined {
    return AppExtensionLanguageHelper.getUiLanguage();
  }

  /** `{{ rating_average }} ({{food.alias}})` → `['rating_average', 'food.alias']`. */
  static getFieldsFromTemplate(template: string | null | undefined): string[] {
    const fields: string[] = [];
    if (!template) {
      return fields;
    }
    const matches = template.match(/{{\s*[^{}]+?\s*}}/g) ?? [];
    for (const match of matches) {
      const field = match.slice(2, -2).trim();
      if (field.length > 0 && !fields.includes(field)) {
        fields.push(field);
      }
    }
    return fields;
  }

  /** REST endpoint of a collection: `/items/foods`, but `/users` for `directus_users`. */
  static getCollectionEndpoint(collection: string): string {
    const systemPrefix = 'directus_';
    if (collection.startsWith(systemPrefix)) {
      return `/${collection.substring(systemPrefix.length)}`;
    }
    return `/items/${collection}`;
  }

  /**
   * The query behind `Liste [Erweitert]`, built exactly like Directus' own list panel builds it:
   * primary key plus the fields of the display template, sorted descending unless told otherwise.
   */
  static buildListQuery(options: ExtendedListQueryOptions): ExtendedListRestQuery {
    const fields = [options.primaryKeyField];
    for (const field of ExtendedPanelHelper.getFieldsFromTemplate(options.displayTemplate)) {
      if (!fields.includes(field)) {
        fields.push(field);
      }
    }

    const sortField = options.sortField || options.primaryKeyField;
    const sort = options.sortDirection === 'asc' ? sortField : `-${sortField}`;

    const limit = options.limit === undefined || options.limit === null ? ExtendedPanelHelper.DEFAULT_LIST_LIMIT : options.limit;

    return {
      fields: fields.join(','),
      filter: JSON.stringify(options.filter ?? {}),
      sort,
      limit,
    };
  }

  /** The same query, but for the download: optionally all rows and optionally other fields. */
  static buildExportQuery(options: ExtendedListQueryOptions & { exportAllItems?: boolean | null; exportFields?: string[] | null }): ExtendedListRestQuery {
    const query = ExtendedPanelHelper.buildListQuery(options);
    const exportFields = (options.exportFields ?? []).map(field => field.trim()).filter(field => field.length > 0);
    return {
      ...query,
      fields: exportFields.length > 0 ? exportFields.join(',') : query.fields,
      limit: options.exportAllItems === false ? query.limit : ExtendedPanelHelper.EXPORT_ALL_LIMIT,
    };
  }

  /** `Beliebteste Speisen [Erweitert]` exported on 2026-10-06 → `Beliebteste_Speisen_2026_10_06.csv`. */
  static buildExportFileName(name: string | null | undefined, extension: string, date: Date): string {
    const isoDate = date.toISOString().slice(0, 10);
    const nameWithoutMarker = DashboardNameHelper.withoutNameMarker(name, ExtendedPanelHelper.NAME_KEY);
    return FileNameHelper.buildSafeFileName({
      name: `${nameWithoutMarker} ${isoDate}`,
      extension,
      fallbackName: FileNameHelper.toSafeFileNameBase(`export ${isoDate}`),
    });
  }

  /**
   * Splits an image of `imageHeight` px into page slices of `sliceHeight` px each, so a long
   * dashboard ends up on several PDF pages instead of being squeezed onto one.
   */
  static getPageSlices(imageHeight: number, sliceHeight: number): { offset: number; height: number }[] {
    const slices: { offset: number; height: number }[] = [];
    if (imageHeight <= 0 || sliceHeight <= 0) {
      return slices;
    }
    for (let offset = 0; offset < imageHeight; offset += sliceHeight) {
      slices.push({ offset, height: Math.min(sliceHeight, imageHeight - offset) });
    }
    return slices;
  }
}
