import {ApiExtensionContext} from "@directus/extensions";
import {ItemsService} from "./ItemsServiceCreator";

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
    ActivityService: any,
    CollectionsService: any,
    FilesService: any,
    ItemsService: any,
    PermissionsService: ItemsService<any>, // https://github.com/directus/directus/blob/main/api/src/services/permissions.ts
    RelationsService: any,
    RolesService: any,
    ServerService: any,
    UsersService: any,
    WebhooksService: any
}



export type ApiContext = ApiExtensionContext & {
    services: Services, // https://docs.directus.io/extensions/hooks.html
}
