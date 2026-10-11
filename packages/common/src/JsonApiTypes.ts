/**
 * Shapes of the JSON:API format (https://jsonapi.org/format/), which both the App Store Connect API
 * and the Stud.IP REST API answer in.
 */

/** A resource object of a JSON:API document. `TRelationships` types the relationships an API sends. */
export type JsonApiResource<TRelationships = Record<string, { data?: { type: string; id: string } | null }>> = {
  type: string;
  id: string;
  attributes?: Record<string, unknown>;
  relationships?: TRelationships;
};
