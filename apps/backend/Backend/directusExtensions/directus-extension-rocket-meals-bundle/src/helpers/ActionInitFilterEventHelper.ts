// https://docs.directus.io/extensions/hooks.html#available-events
export class ActionInitFilterEventHelper {
  static readonly INIT_APP_STARTED = 'app.after';
  static readonly INIT_APP_BEFORE = 'app.before';
  static readonly CLI_INIT_BEFORE = 'cli.before';
}
