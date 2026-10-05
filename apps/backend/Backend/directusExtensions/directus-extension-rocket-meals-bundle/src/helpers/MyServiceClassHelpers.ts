import type { ExtensionsServices } from '@directus/types';

// Instance types of the Directus services, taken from the public typings in @directus/types
// (since Directus 11.10 the services handed to extensions are typed there; importing
// the classes from '@directus/api/dist/services' is no longer supported).
export type AssetsService = InstanceType<ExtensionsServices['AssetsService']>;
export type SharesService = InstanceType<ExtensionsServices['SharesService']>;
export type FieldsService = InstanceType<ExtensionsServices['FieldsService']>;
export type MailService = InstanceType<ExtensionsServices['MailService']>;
