export class DockerDirectusHelper {
  static readonly DIRECTUS_CONTAINER_NAME = 'rocket-meals-directus';

  // Health-Check-Funktion für Directus
  public static getDirectusServerUrl(): string {
    const directusUrl = `http://${DockerDirectusHelper.DIRECTUS_CONTAINER_NAME}:${process.env.DIRECTUS_PORT || '8055'}`;
    return `${directusUrl}`;
  }

  public static getDataPathToDirectusSyncData(): string {
    return '/rocket-meals/' + DockerDirectusHelper.getRelativePathToDirectusSyncFromProjectRoot();
  }

  public static getRelativePathToDirectusSyncFromProjectRoot(): string {
    return 'data/directus-sync-data';
  }
}
