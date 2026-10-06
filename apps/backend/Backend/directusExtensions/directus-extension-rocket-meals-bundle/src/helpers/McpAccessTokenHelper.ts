import { randomBytes } from 'node:crypto';
import { PrimaryKey } from '@directus/types';
import { McpAccessHelper } from 'repo-depkit-common';
import { MyDatabaseHelper } from './MyDatabaseHelper';

const HELPER_NAME = 'McpAccessTokenHelper';

const TOKEN_BYTES = 32;

/**
 * Statische Directus-Tokens für den MCP-Server (`<PUBLIC_URL>/mcp`).
 *
 * Gelesen wird das Token direkt aus `directus_users` über Knex: Die Services von Directus geben
 * das Feld `token` verdeckt (`**********`) zurück, die App muss aber das echte Token anzeigen
 * können. Geschrieben wird über den `UsersService` (Prüfung auf Eindeutigkeit, Hooks, Activity).
 */
export class McpAccessTokenHelper {
  constructor(private readonly myDatabaseHelper: MyDatabaseHelper) {}

  static generateToken(): string {
    return randomBytes(TOKEN_BYTES).toString('base64url');
  }

  async readToken(userId: PrimaryKey): Promise<string | null> {
    const row = await this.myDatabaseHelper.apiContext.database('directus_users').select('token').where('id', userId).first();
    const token = row?.token;
    return typeof token === 'string' && token.length > 0 ? token : null;
  }

  /** Gibt das vorhandene Token des Nutzers zurück oder erzeugt eines. */
  async getOrCreateToken(userId: PrimaryKey): Promise<string> {
    const existingToken = await this.readToken(userId);
    if (existingToken) {
      return existingToken;
    }
    const token = McpAccessTokenHelper.generateToken();
    await this.myDatabaseHelper.getUsersHelper().updateOne(userId, { token });
    return token;
  }

  /**
   * Legt den öffentlichen MCP-User an, falls es ihn noch nicht gibt, und gibt sein Token zurück.
   *
   * Der User hat **keine Rolle**: Directus gibt Nutzern ohne Rolle die Rechte der Public-Policy
   * (plus Policies, die direkt am User hängen – hier keine). Bekommt er doch eine Rolle, wird sie
   * wieder entfernt, damit das öffentlich angezeigte Token nie mehr darf als die Public-Policy.
   */
  async ensurePublicUserToken(): Promise<string> {
    const usersHelper = this.myDatabaseHelper.getUsersHelper();
    const existingUsers = await usersHelper.readByQuery({
      filter: { email: { _eq: McpAccessHelper.PUBLIC_USER_EMAIL } },
      fields: ['id', 'role', 'status'],
      limit: 1,
    });
    const existingUser = existingUsers[0];

    if (!existingUser) {
      const token = McpAccessTokenHelper.generateToken();
      await usersHelper.createOne({
        email: McpAccessHelper.PUBLIC_USER_EMAIL,
        first_name: McpAccessHelper.PUBLIC_USER_NAME,
        role: null,
        status: 'active',
        provider: 'default',
        token,
      });
      console.log(HELPER_NAME + ': created public MCP user ' + McpAccessHelper.PUBLIC_USER_NAME);
      return token;
    }

    if (existingUser.role || existingUser.status !== 'active') {
      await usersHelper.updateOne(existingUser.id, { role: null, status: 'active' });
    }

    return await this.getOrCreateToken(existingUser.id);
  }
}
