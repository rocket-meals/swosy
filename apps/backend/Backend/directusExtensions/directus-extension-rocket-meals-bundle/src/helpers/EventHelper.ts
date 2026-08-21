// Error: Could not find a declaration file for module ../helpers/EventHelper.
// /Users/nilsbaumgartner/Documents/GitHub/rocket-meals/backend/Backend/directusExtensions/directus-extension-rocket-meals-bundle/src/helpers/EventHelper.js

// create declaration file for module
export class EventHelper {
  static readonly USERS_DELETE_EVENT = 'users.delete';
  static readonly USERS_CREATE_EVENT = 'users.create';
  static readonly USERS_LOGIN_EVENT = 'auth.login';
  static readonly SERVER_START_EVENT = 'server.start';
  // System collections emit their events without the "directus_" prefix, e.g. "dashboards.update".
  static readonly DASHBOARDS_CREATE_EVENT = 'dashboards.create';
  static readonly DASHBOARDS_UPDATE_EVENT = 'dashboards.update';
  static readonly DASHBOARDS_DELETE_EVENT = 'dashboards.delete';
  static readonly PANELS_CREATE_EVENT = 'panels.create';
  static readonly PANELS_UPDATE_EVENT = 'panels.update';
  static readonly PANELS_DELETE_EVENT = 'panels.delete';
}
