import { describe, expect, it } from '@jest/globals';
import { ExtendedPanelHelper } from '../ExtendedPanelHelper';
import { BackendTranslationKeys } from '../../translations/BackendTranslationKeys';

describe('ExtendedPanelHelper', () => {
  describe('panel name marker', () => {
    it('appends [Erweitert] to the panel name', () => {
      expect(ExtendedPanelHelper.NAME_MARKER).toBe('[Erweitert]');
      expect(ExtendedPanelHelper.buildPanelName('Liste')).toBe('Liste [Erweitert]');
    });

    it('does not append the marker twice', () => {
      expect(ExtendedPanelHelper.buildPanelName('Liste [Erweitert]')).toBe('Liste [Erweitert]');
    });

    it('recognises our own panels by the marker', () => {
      expect(ExtendedPanelHelper.isExtendedPanelName('Seite exportieren [Erweitert]')).toBe(true);
      expect(ExtendedPanelHelper.isExtendedPanelName('Liste')).toBe(false);
      expect(ExtendedPanelHelper.isExtendedPanelName(undefined)).toBe(false);
    });

    it('builds the German panel names from the catalogue', () => {
      const listName = ExtendedPanelHelper.translate(BackendTranslationKeys.extended_panel_list_name, 'de-DE');
      const exportName = ExtendedPanelHelper.translate(BackendTranslationKeys.extended_panel_page_export_name, 'de-DE');
      expect(ExtendedPanelHelper.buildPanelName(listName)).toBe('Liste [Erweitert]');
      expect(ExtendedPanelHelper.buildPanelName(exportName)).toBe('Seite exportieren [Erweitert]');
    });

    it('keeps the marker in every language and translates the rest', () => {
      const englishName = ExtendedPanelHelper.buildPanelName(ExtendedPanelHelper.translate(BackendTranslationKeys.extended_panel_list_name, 'en-US'));
      expect(englishName).toBe('List [Erweitert]');
      expect(ExtendedPanelHelper.isExtendedPanelName(englishName)).toBe(true);
    });

    it('falls back to German for an unknown language', () => {
      expect(ExtendedPanelHelper.translate(BackendTranslationKeys.extended_panel_list_name, 'xx-XX')).toBe('Liste');
      expect(ExtendedPanelHelper.translate(BackendTranslationKeys.extended_panel_list_name, undefined)).toBe('Liste');
    });
  });

  describe('getFieldsFromTemplate', () => {
    it('extracts every field once, including related fields', () => {
      expect(ExtendedPanelHelper.getFieldsFromTemplate('{{rating_average}}⭐ ({{ rating_amount }}) {{food.alias}} {{rating_average}}')).toEqual(['rating_average', 'rating_amount', 'food.alias']);
    });

    it('returns nothing for an empty template', () => {
      expect(ExtendedPanelHelper.getFieldsFromTemplate('')).toEqual([]);
      expect(ExtendedPanelHelper.getFieldsFromTemplate(null)).toEqual([]);
      expect(ExtendedPanelHelper.getFieldsFromTemplate('no fields here')).toEqual([]);
    });
  });

  describe('getCollectionEndpoint', () => {
    it('uses /items for own collections and the system endpoint for directus_ collections', () => {
      expect(ExtendedPanelHelper.getCollectionEndpoint('foods')).toBe('/items/foods');
      expect(ExtendedPanelHelper.getCollectionEndpoint('directus_users')).toBe('/users');
      expect(ExtendedPanelHelper.getCollectionEndpoint('directus_activity')).toBe('/activity');
    });
  });

  describe('buildListQuery', () => {
    const filter = { _and: [{ rating_average: { _gte: '4.5' } }] };

    it('builds the query like the built-in list panel', () => {
      expect(
        ExtendedPanelHelper.buildListQuery({
          primaryKeyField: 'id',
          displayTemplate: '{{rating_average}} {{alias}} (id:{{id}})',
          filter,
          sortField: 'rating_average',
          sortDirection: 'desc',
          limit: 10,
        })
      ).toEqual({
        fields: 'id,rating_average,alias',
        filter: JSON.stringify(filter),
        sort: '-rating_average',
        limit: 10,
      });
    });

    it('sorts ascending only when asked to', () => {
      expect(ExtendedPanelHelper.buildListQuery({ primaryKeyField: 'id', sortField: 'alias', sortDirection: 'asc' }).sort).toBe('alias');
      expect(ExtendedPanelHelper.buildListQuery({ primaryKeyField: 'id', sortField: 'alias' }).sort).toBe('-alias');
    });

    it('falls back to the primary key, an empty filter and the default limit', () => {
      expect(ExtendedPanelHelper.buildListQuery({ primaryKeyField: 'uuid' })).toEqual({
        fields: 'uuid',
        filter: '{}',
        sort: '-uuid',
        limit: ExtendedPanelHelper.DEFAULT_LIST_LIMIT,
      });
    });

    it('keeps a limit of 0 and -1 as given', () => {
      expect(ExtendedPanelHelper.buildListQuery({ primaryKeyField: 'id', limit: -1 }).limit).toBe(-1);
      expect(ExtendedPanelHelper.buildListQuery({ primaryKeyField: 'id', limit: 0 }).limit).toBe(0);
    });
  });

  describe('buildExportQuery', () => {
    const options = { primaryKeyField: 'id', displayTemplate: '{{alias}}', sortField: 'rating_average', limit: 10 };

    it('exports all items by default', () => {
      expect(ExtendedPanelHelper.buildExportQuery(options).limit).toBe(ExtendedPanelHelper.EXPORT_ALL_LIMIT);
      expect(ExtendedPanelHelper.buildExportQuery({ ...options, exportAllItems: true }).limit).toBe(-1);
    });

    it('keeps the panel limit when export of all items is switched off', () => {
      expect(ExtendedPanelHelper.buildExportQuery({ ...options, exportAllItems: false }).limit).toBe(10);
    });

    it('uses the fields of the display template unless export fields are set', () => {
      expect(ExtendedPanelHelper.buildExportQuery(options).fields).toBe('id,alias');
      expect(ExtendedPanelHelper.buildExportQuery({ ...options, exportFields: [] }).fields).toBe('id,alias');
      expect(ExtendedPanelHelper.buildExportQuery({ ...options, exportFields: [' alias ', 'food.alias', ''] }).fields).toBe('alias,food.alias');
    });
  });

  describe('buildExportFileName', () => {
    const date = new Date('2026-10-06T12:00:00Z');

    it('builds a safe file name with the date', () => {
      expect(ExtendedPanelHelper.buildExportFileName('Beliebteste Speisen', 'csv', date)).toBe('Beliebteste_Speisen_2026_10_06.csv');
    });

    it('drops the [Erweitert] marker and unsafe characters', () => {
      expect(ExtendedPanelHelper.buildExportFileName('Speisen / Mensa [Erweitert]', 'pdf', date)).toBe('Speisen_Mensa_2026_10_06.pdf');
    });

    it('still has a name when the title gives nothing', () => {
      expect(ExtendedPanelHelper.buildExportFileName('', 'png', date)).toBe('2026_10_06.png');
      expect(ExtendedPanelHelper.buildExportFileName(undefined, 'png', date)).toBe('2026_10_06.png');
    });
  });

  describe('getPageSlices', () => {
    it('splits a long image into page slices', () => {
      expect(ExtendedPanelHelper.getPageSlices(250, 100)).toEqual([
        { offset: 0, height: 100 },
        { offset: 100, height: 100 },
        { offset: 200, height: 50 },
      ]);
    });

    it('returns one slice when the image fits on one page', () => {
      expect(ExtendedPanelHelper.getPageSlices(80, 100)).toEqual([{ offset: 0, height: 80 }]);
    });

    it('returns no slices for empty sizes', () => {
      expect(ExtendedPanelHelper.getPageSlices(0, 100)).toEqual([]);
      expect(ExtendedPanelHelper.getPageSlices(100, 0)).toEqual([]);
    });
  });

  describe('export formats', () => {
    it('offers CSV with byte order mark first, so Excel shows umlauts correctly', () => {
      expect(ExtendedPanelHelper.EXPORT_FORMATS[0]).toMatchObject({ format: 'csv_utf8', extension: 'csv' });
      expect(ExtendedPanelHelper.EXPORT_FORMATS.map(format => format.format)).toEqual(['csv_utf8', 'json', 'xml', 'yaml']);
    });
  });
});
