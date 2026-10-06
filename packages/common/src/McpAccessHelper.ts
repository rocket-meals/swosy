/**
 * Zugang zum eingebauten MCP-Server von Directus (`<Backend-URL>/mcp`).
 *
 * Der MCP-Server meldet sich mit einem statischen Directus-Token an – entweder als
 * `Authorization: Bearer <Token>` oder, wenn der MCP-Client keine Header setzen kann, als
 * Query-Parameter `?access_token=<Token>`.
 *
 * Es gibt zwei Arten von Tokens:
 * - **Öffentlich:** Der Directus-User `MCP_Public` wird auf jedem Server automatisch angelegt.
 *   Er hat keine Rolle und damit nur die Rechte der Public-Policy. Sein Token ist deshalb kein
 *   Geheimnis und auf allen Servern gleich (`PUBLIC_USER_TOKEN`) – die App zeigt es jedem an,
 *   ohne Anmeldung und ohne Anfrage an den Server.
 * - **Persönlich:** Ein angemeldeter Nutzer setzt sich selbst ein Token (Feld `token` an seinem
 *   `directus_users`-Eintrag, die Policy `User` darf es schreiben). Die App holt dafür einen
 *   Zufallsstring von Directus (`GET /utils/random/string`) und speichert ihn per
 *   `PATCH /users/me`. Damit sieht der MCP-Client genau, was der Nutzer auch in der App sieht.
 *   Directus liefert `token` beim Lesen nur verdeckt (`**********`) – ein Token lässt sich also
 *   nur direkt nach dem Erzeugen anzeigen, danach nur noch durch ein neues ersetzen.
 *
 * Den öffentlichen User legt der `mcp-public-user-hook` im Backend-Bundle beim Start an.
 */

export class McpAccessHelper {
  /** Name des öffentlichen MCP-Users, analog zum Gast-Nutzer. */
  static readonly PUBLIC_USER_NAME = 'MCP_Public';

  /** `example.com` ist reserviert (RFC 2606) – an diese Adresse geht nie eine Mail. */
  static readonly PUBLIC_USER_EMAIL = 'mcp-public@mcp.example.com';

  /**
   * Festes Token des öffentlichen MCP-Users, auf jedem Server dasselbe. Unbedenklich, weil der
   * User nur die Rechte der Public-Policy hat – dieselben Daten liefert die API auch ohne Token.
   */
  static readonly PUBLIC_USER_TOKEN = 'PUBLIC-TOKEN';

  static readonly MCP_PATH = '/mcp';

  static readonly TOKEN_QUERY_PARAMETER = 'access_token';

  static readonly AUTHORIZATION_HEADER_NAME = 'authorization';

  /** Länge eines persönlichen Tokens. */
  static readonly PERSONAL_TOKEN_LENGTH = 64;

  /** Directus-Endpoint für Zufallsstrings (nanoid), antwortet mit `{ data: string }`. */
  static readonly RANDOM_STRING_PATH = '/utils/random/string';

  /** Pfad zum Lesen und Schreiben des eigenen Tokens. */
  static readonly OWN_TOKEN_PATH = '/users/me?fields=token';

  static buildRandomStringPath(length: number = McpAccessHelper.PERSONAL_TOKEN_LENGTH): string {
    return McpAccessHelper.RANDOM_STRING_PATH + '?length=' + length;
  }

  /** Liest den String aus der Antwort von `GET /utils/random/string`, sonst `null`. */
  static parseRandomStringResponse(value: unknown): string | null {
    if (typeof value !== 'object' || value === null) {
      return null;
    }
    const data = (value as { data?: unknown }).data;
    return typeof data === 'string' && data.length > 0 ? data : null;
  }

  /**
   * Ob die Antwort von `GET /users/me?fields=token` ein Token enthält. Directus liefert ein
   * gesetztes Token verdeckt (`**********`), ein fehlendes als `null`.
   */
  static hasTokenInOwnUserResponse(value: unknown): boolean {
    if (typeof value !== 'object' || value === null) {
      return false;
    }
    const data = (value as { data?: unknown }).data;
    if (typeof data !== 'object' || data === null) {
      return false;
    }
    const token = (data as { token?: unknown }).token;
    return typeof token === 'string' && token.length > 0;
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
}
