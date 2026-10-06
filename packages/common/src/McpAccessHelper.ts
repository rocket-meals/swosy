/**
 * Zugang zum eingebauten MCP-Server von Directus (`<Backend-URL>/mcp`).
 *
 * Der MCP-Server meldet sich mit einem statischen Directus-Token an – entweder als
 * `Authorization: Bearer <Token>` oder, wenn der MCP-Client keine Header setzen kann, als
 * Query-Parameter `?access_token=<Token>`.
 *
 * Es gibt zwei Arten von Tokens:
 * - **Öffentlich:** Der Directus-User `MCP_Public` wird auf jedem Server automatisch angelegt.
 *   Er hat keine Rolle und damit nur die Rechte der Public-Policy – sein Token ist kein Geheimnis
 *   und wird jedem angezeigt, auch ohne Anmeldung.
 * - **Persönlich:** Ein angemeldeter Nutzer kann sich ein eigenes Token erzeugen lassen (Feld
 *   `token` an seinem `directus_users`-Eintrag). Damit sieht der MCP-Client genau, was der
 *   Nutzer auch in der App sehen darf.
 *
 * Beide liefert der Endpoint `mcp-access` im Backend-Bundle.
 */

export type McpAccessTokenResponse = {
  token: string;
};

export type McpAccessTokenStatus = {
  has_token: boolean;
};

export class McpAccessHelper {
  /** Pfad des Endpoints im Backend-Bundle. */
  static readonly ENDPOINT_ID = 'mcp-access';

  /** `GET` – Token des öffentlichen MCP-Users, ohne Anmeldung. */
  static readonly ROUTE_PUBLIC_TOKEN = '/public-token';

  /** `GET` – ob der angemeldete Nutzer schon ein Token hat. `POST` – Token holen, bei Bedarf erzeugen. */
  static readonly ROUTE_MY_TOKEN = '/my-token';

  /** Name des öffentlichen MCP-Users, analog zum Gast-Nutzer. */
  static readonly PUBLIC_USER_NAME = 'MCP_Public';

  /** `example.com` ist reserviert (RFC 2606) – an diese Adresse geht nie eine Mail. */
  static readonly PUBLIC_USER_EMAIL = 'mcp-public@mcp.example.com';

  static readonly MCP_PATH = '/mcp';

  static readonly TOKEN_QUERY_PARAMETER = 'access_token';

  static readonly AUTHORIZATION_HEADER_NAME = 'authorization';

  static getEndpointPath(route: string): string {
    return '/' + McpAccessHelper.ENDPOINT_ID + route;
  }

  /** `https://host/backend` → `https://host/backend/mcp` */
  static buildServerUrl(backendUrl: string): string {
    let base = backendUrl.trim();
    while (base.endsWith('/')) {
      base = base.slice(0, -1);
    }
    return base + McpAccessHelper.MCP_PATH;
  }

  /** Für MCP-Clients, die keine Header setzen können: das Token steckt in der URL. */
  static buildServerUrlWithToken(backendUrl: string, token: string): string {
    return McpAccessHelper.buildServerUrl(backendUrl) + '?' + McpAccessHelper.TOKEN_QUERY_PARAMETER + '=' + encodeURIComponent(token);
  }

  static buildAuthorizationHeaderValue(token: string): string {
    return 'Bearer ' + token;
  }

  static isValidTokenResponse(value: unknown): value is McpAccessTokenResponse {
    if (typeof value !== 'object' || value === null) {
      return false;
    }
    const token = (value as { token?: unknown }).token;
    return typeof token === 'string' && token.length > 0;
  }

  static isValidTokenStatus(value: unknown): value is McpAccessTokenStatus {
    if (typeof value !== 'object' || value === null) {
      return false;
    }
    return typeof (value as { has_token?: unknown }).has_token === 'boolean';
  }
}
