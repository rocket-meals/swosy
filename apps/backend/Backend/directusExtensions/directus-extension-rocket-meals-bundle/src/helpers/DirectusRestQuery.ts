/**
 * DirectusRestQuery.ts – the URL parameters `GET /items/:collection` of the Directus REST API takes.
 * Objects (filter, aggregate) are sent as JSON strings. The pages of the module and the panels pick
 * the parameters they use from here, so a parameter is typed once.
 *
 * Types only, no Vue or Directus app imports.
 */

export type DirectusRestQuery = {
  fields?: string;
  filter?: string;
  sort?: string;
  limit?: number;
  page?: number;
  aggregate?: string;
  groupBy?: string;
  meta?: string;
};
