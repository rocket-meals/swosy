/**
 * Begrenzt, wie viele Gast-Accounts eine IP in einem Zeitfenster anlegen darf.
 *
 * Bewusst nur im Speicher: Nach einem Neustart beginnt die Zählung neu, und keine IP landet in
 * der Datenbank. Für den Schutz gegen massenhaftes Anlegen reicht das.
 */
export class GuestAccountRateLimiter {
  static readonly DEFAULT_MAX_ACCOUNTS_PER_WINDOW = 5;
  static readonly DEFAULT_WINDOW_MS = 60 * 60 * 1000;

  private readonly timestampsByKey = new Map<string, number[]>();

  constructor(
    private readonly maxAccountsPerWindow: number = GuestAccountRateLimiter.DEFAULT_MAX_ACCOUNTS_PER_WINDOW,
    private readonly windowMs: number = GuestAccountRateLimiter.DEFAULT_WINDOW_MS
  ) {}

  /** Zählt einen Versuch für `key` und sagt, ob er noch im Limit liegt. */
  tryConsume(key: string, now: number = Date.now()): boolean {
    this.removeExpired(now);

    const timestamps = this.timestampsByKey.get(key) ?? [];
    if (timestamps.length >= this.maxAccountsPerWindow) {
      return false;
    }
    timestamps.push(now);
    this.timestampsByKey.set(key, timestamps);
    return true;
  }

  private removeExpired(now: number): void {
    const windowStart = now - this.windowMs;
    for (const [key, timestamps] of this.timestampsByKey) {
      const remaining = timestamps.filter(timestamp => timestamp > windowStart);
      if (remaining.length === 0) {
        this.timestampsByKey.delete(key);
      } else {
        this.timestampsByKey.set(key, remaining);
      }
    }
  }
}
