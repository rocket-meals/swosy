/**
 * Kernlogik des upsert-endpoint, ohne Express und ohne Directus-Server testbar.
 *
 * Portiert aus https://github.com/freekrai/directus-extension-upsert (MIT, Copyright (c) 2023 Roger Stringer).
 * Abweichungen zum Original:
 * - Die Existenzprüfung läuft über `ItemsService.readByQuery` statt über eine rohe Knex-Abfrage.
 *   Damit gelten die Leserechte des Aufrufers, und `filter` kann keine Einträge aufspüren,
 *   die der Aufrufer nicht sehen darf.
 * - Fehler gehen an Directus statt als unbehandelte Promise-Rejection verloren.
 * - `data` enthält den Primärschlüssel des angelegten bzw. aktualisierten Eintrags.
 * - Dieselbe Logik steht Extensions über `ItemsServiceHelper.upsertByFilter` zur Verfügung.
 */

export type UpsertFilter = Record<string, unknown>;

export type UpsertRequestBody = {
  filter?: UpsertFilter;
  body?: Record<string, unknown>;
};

export type UpsertResponse = {
  success: boolean;
  msg: string;
  code: number;
  data: { id: string | number } | null;
};

/** Ausschnitt aus Directus' `ItemsService`, den der Upsert braucht. */
export type UpsertItemsService = {
  readByQuery: (query: { filter: Record<string, unknown>; fields: string[]; limit: number }) => Promise<Record<string, any>[]>;
  createOne: (data: Record<string, unknown>) => Promise<string | number>;
  updateOne: (key: string | number, data: Record<string, unknown>) => Promise<string | number>;
};

export class UpsertHandler {
  /**
   * Wandelt den Filter des Originals (`{ key: 'test2' }`, reine Gleichheit) in einen Directus-Filter um.
   * Werte, die schon ein Directus-Operator-Objekt sind (`{ key: { _eq: 'test2' } }`), bleiben unverändert.
   */
  static toDirectusFilter(filter: UpsertFilter): Record<string, unknown> {
    const conditions = Object.entries(filter).map(([field, value]) => {
      if (value === null) {
        return { [field]: { _null: true } };
      }
      if (typeof value === 'object' && !Array.isArray(value)) {
        return { [field]: value };
      }
      return { [field]: { _eq: value } };
    });
    return { _and: conditions };
  }

  /**
   * Sucht den ersten Eintrag, auf den `filter` passt, und aktualisiert ihn mit `data` – oder legt `data` neu an.
   * Wird vom Endpoint und von `ItemsServiceHelper.upsertByFilter` genutzt.
   */
  static async upsertByFilter(service: UpsertItemsService, primaryKeyField: string, filter: UpsertFilter, data: Record<string, unknown>): Promise<{ id: string | number; created: boolean }> {
    if (!filter || typeof filter !== 'object' || Object.keys(filter).length === 0) {
      throw new Error('upsertByFilter: filter must not be empty, otherwise any item would match.');
    }

    const existing = await service.readByQuery({
      filter: UpsertHandler.toDirectusFilter(filter),
      fields: [primaryKeyField],
      limit: 1,
    });
    const existingKey = existing[0]?.[primaryKeyField];

    if (existingKey !== undefined && existingKey !== null) {
      return { id: await service.updateOne(existingKey, data), created: false };
    }
    return { id: await service.createOne(data), created: true };
  }

  static async upsert(service: UpsertItemsService, primaryKeyField: string, requestBody: UpsertRequestBody | undefined): Promise<UpsertResponse> {
    const { filter = {}, body = {} } = requestBody || {};

    if (!filter || typeof filter !== 'object' || Object.keys(filter).length === 0) {
      return { success: false, msg: 'Missing filter', code: 400, data: null };
    }

    const { id, created } = await UpsertHandler.upsertByFilter(service, primaryKeyField, filter, body);
    if (created) {
      return { success: true, msg: 'Create Success', code: 201, data: { id } };
    }
    return { success: true, msg: 'Update Success', code: 200, data: { id } };
  }
}
