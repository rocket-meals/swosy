import Server from '@/constants/ServerUrl';
import { ServerAPI } from '@/redux/actions/Auth/Auth';

/**
 * `fetch` gegen das eigene Backend – mit dem Token des angemeldeten Nutzers.
 *
 * Jede Stelle, die Directus direkt anspricht (Dateien hoch- und herunterladen, eine eigene
 * Route wie `/form-pdf-preview`), brauchte bisher dieselben drei Zeilen: Token holen,
 * Server-Adresse davorsetzen, `Authorization`-Kopf bauen. Drei Zeilen, die an einer Stelle
 * vergessen still einen 401 erzeugen. Deshalb stehen sie hier einmal.
 *
 * Bewusst **kein** `Content-Type` als Vorgabe: Ein Upload schickt `FormData`, und dessen
 * Kopfzeile darf nur die Laufzeit selbst setzen – sie trägt die Grenze zwischen den Teilen.
 * Wer JSON schickt, gibt den Kopf wie bei `fetch` selbst mit.
 *
 * Die Antwort kommt zurück, wie `fetch` sie liefert: Ein 4xx ist kein Fehler, den diese
 * Funktion wirft, sondern eine Antwort mit `ok === false` – wie der Aufrufer darauf reagiert,
 * weiß nur er.
 */
export async function authorizedFetch(pathOrUrl: string, init: RequestInit = {}): Promise<Response> {
	const token = await ServerAPI.getClient().getToken();

	const url = pathOrUrl.startsWith('http') ? pathOrUrl : `${Server.ServerUrl}${pathOrUrl}`;
	const headers: Record<string, string> = { ...((init.headers as Record<string, string> | undefined) ?? {}) };
	if (token) {
		headers.Authorization = `Bearer ${token}`;
	}

	return await fetch(url, { ...init, headers });
}
