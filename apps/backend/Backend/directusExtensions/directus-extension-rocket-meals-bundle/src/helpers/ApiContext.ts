import type { ApiExtensionContext, ExtensionsServices } from '@directus/types';

// https://github.com/directus/directus/blob/main/api/src/services/index.ts
/**
 * All available services in Directus
 * [
 *   'ActivityService',       'AssetsService',
 *   'AuthenticationService', 'AuthorizationService',
 *   'CollectionsService',    'DashboardsService',
 *   'ExportService',         'ExtensionReadError',
 *   'ExtensionsService',     'FieldsService',
 *   'FilesService',          'FlowsService',
 *   'FoldersService',        'GraphQLService',
 *   'ImportService',         'ItemsService',
 *   'MailService',           'MetaService',
 *   'NotificationsService',  'OperationsService',
 *   'PanelsService',         'PayloadService',
 *   'PermissionsService',    'PresetsService',
 *   'RelationsService',      'RevisionsService',
 *   'RolesService',          'SchemaService',
 *   'ServerService',         'SettingsService',
 *   'SharesService',         'SpecificationService',
 *   'TFAService',            'TranslationsService',
 *   'UsersService',          'UtilsService',
 *   'VersionsService',       'WebSocketService',
 *   'WebhooksService'
 * ]
 */

type Services = {
  SharesService: ExtensionsServices['SharesService'];
  AssetsService: ExtensionsServices['AssetsService'];
  ActivityService: any;
  CollectionsService: any;
  FilesService: any;
  ItemsService: any;
  PermissionsService: any;
  FieldsService: ExtensionsServices['FieldsService'];
  RelationsService: any;
  RolesService: any;
  ServerService: any;
  SettingsService: any;
  UsersService: any;
  MailService: ExtensionsServices['MailService'];
};

export type ApiContext = {
  services: Services; // https://docs.directus.io/extensions/hooks.html
} & Omit<ApiExtensionContext, 'services'>;
