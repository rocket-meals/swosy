import { FetchHelper } from './FetchHelper';

/*
 * Sample RSS response (fetched 2026-04-26, appId=1548108390 "Studi-Futter"):
 *
 * [
 *   { "id": "13527111308", "author": "Hilde381",                    "rating": "5", "version": "21.180.0", "title": "Eine App, die zeigt, was es zu essen gibt",   "content": "Grade das Event ist super! Sonst wird einem angezeigt, was es zu essen gibt" },
 *   { "id": "12844198362", "author": "R. Mllr",                     "rating": "1", "version": "2.0.137",  "title": "keine Bewertung der Speisen mehr möglich",     "content": "BITTE SCHNELLSTMÖGLICH FIXEN" },
 *   { "id": "12303225739", "author": "nervmichnichtalter183883",     "rating": "1", "version": "2.0.0",    "title": "Schlecht",                                     "content": "Die App war schon schlecht. Dann wurde sie aktualisiert und jetzt ist es noch langsamer. Unnötige Abläufe bevor irgendein Inhalt sichtbar ist. Um Gottes Willen stampft das ein und macht es neu" },
 *   { "id": "12151602894", "author": "profeeeee",                   "rating": "5", "version": "2.0.0",    "title": "App ist besser jetzt",                         "content": "Gutes Design, sehr übersichtlich und man kann jetzt Karte auslesen. Gelungen!" },
 *   { "id": "12143173152", "author": "Maximiliankai",               "rating": "1", "version": "2.0.0",    "title": "Häufig kann man die Speisekarte nicht laden.",  "content": "Häufig kann man die Speisekarte nicht laden. Zu oft!" },
 *   { "id": "9217989575",  "author": "Scarab167",                   "rating": "2", "version": "15.0.0",   "title": "Schwach Programmiert",                         "content": "Bei aller liebe, es ist eine Zweckmäßige App um zu gucken was man essen kann, aber sie ist dermaßen schlecht programmiert das könnte jeder Ersi besser. Von vorn bis hinten Hardcoded ohne Dynamik." },
 *   { "id": "8254273714",  "author": "Joe387Joe",                   "rating": "3", "version": "14.0.0",   "title": "Absturz bei aktueller Version",                "content": "Die aktuelle Version hat schon zweimal mein IPhone abstürzen lassen." },
 *   { "id": "7976295634",  "author": "Blacksunny06",                "rating": "1", "version": "13.0.0",   "title": "Unbrauchbar",                                  "content": "Schlecht programmiert, unübersichtlich und nicht funktionsfähig. Ich kann de facto die Mensa nicht nutzen, weil die App ihren Dienst nicht tut. Das ist eine absolute Frechheit. Ich wohne nicht in Hannover und so muss ich nun teuer woanders essen." },
 *   { "id": "7965539131",  "author": "meyhop",                      "rating": "1", "version": "13.0.0",   "title": "Nicht funktionsfähig",                         "content": "Man kann bei „Mensa To Stay" kein Essen zum Warenkorb hinzufügen." },
 *   { "id": "7965343017",  "author": "Der Mensator",                "rating": "1", "version": "13.0.0",   "title": "Absolut Frech",                                "content": "Eine unnötige App, da zu fast jeder Zeit schlangen in der Mensa sind. Was durch Luca App und 3G Nachweis kein Problem darstellen sollte.\nBitte verzichtet doch auf den Einsatz von solch einer überflüssigen und dazu noch mit Bugs übersäten Software…" },
 *   { "id": "7965340145",  "author": "Knoppers881",                 "rating": "1", "version": "13.0.0",   "title": "Wozu",                                         "content": "Es ist ja toll, dass es eine kostenlose App gibt, aber was bringt es, wenn sie so extrem schlecht umgesetzt ist? Ich weiß gar nicht wo ich anfangen soll. War sicher eine Menge Arbeit, aber man kann es kaum benutzen." },
 *   { "id": "7925587439",  "author": "Babykeem420",                 "rating": "2", "version": "13.0.0",   "title": "Geht bei mir nicht",                           "content": "Ich kann nie einen Zeitslot auswählen, wenn ich in das Fenster geleitet werde passiert einfach nichts🤷‍♂️" },
 *   { "id": "7907443068",  "author": "SeyphediasG4ming",            "rating": "1", "version": "13.0.0",   "title": "Wie übel schlecht",                            "content": "Ist diese App? Seid ihr absolute beginner Programmier oder was? Die Liste von bugs und schlechter UI/UX ist quasi endlos lang. Holt euch mal einen Profi bevor ihr so etwas released. Version 13.0? Also 13 major updates? Und die App ist immernoch so schlecht?" },
 *   { "id": "7894892242",  "author": "Fabi Wi.",                    "rating": "2", "version": "13.0.0",   "title": "Bitte fixen",                                  "content": "Bei To-Go-Bestellungen funktioniert alles einwandfrei.\nJedoch kann ich bei To-Stay—Bestellungen einfach keine Gerichte in den Warenkorb packen. Hier fehlt der Grüne Kreis zum hinzufügen." },
 *   { "id": "7876128199",  "author": "ploccoson",                   "rating": "1", "version": "12.0.0",   "title": "Kann nicht bestellen",                         "content": "Wunderbar, jetzt fehlt plötzlich das „+" und ich kann kein Essen mehr bestellen - ergo kein Essen für mich dieses Semester …" },
 *   { "id": "7866590268",  "author": "Mr. e-gitarre",               "rating": "3", "version": "12.0.0",   "title": "Veganer Filter",                               "content": "An sich eine gute Idee! Ich habe jedoch einen kleinen Fehler gefunden. Der vegane Filter ist leider als Unverträglichkeit konfiguriert (heißt: bei Auswahl des Filters werden die veganen Gerichte rot markiert und nach hinten gestellt). Eigentlich müsste das Gegenteil der Fall sein: der vegane Filter sollte die veganen Gerichte bevorzugt anzeigen. ;)" },
 *   { "id": "7857490612",  "author": "Rattige-Ursula",              "rating": "1", "version": "12.0.0",   "title": "Schlechte App",                                "content": "Bei 19/20 Versuchen lädt die App falsch. Man kann sich die Zeit aussuchen, zu der man kommen möchte, jedoch lädt die App nicht das Icon zur Bestellung in den Warenkorb. Demzufolge hat man einen Tisch ohne essen gebucht, was mir persönlich nichts bringt. Denn eine Mensa ohne Essen ist eine Mensa ohne essen." },
 *   { "id": "7824097128",  "author": "Jsvenja23",                   "rating": "1", "version": "11.0.0",   "title": "Essen bestellen",                              "content": "Ich soll mit dem + den Warenkorb aktivieren aber finde kein Plus und kann somit kein Essen auswählen … Hilfe" },
 *   { "id": "7776926801",  "author": "Babonski23",                  "rating": "1", "version": "11.0.0",   "title": "Man kann einfach nichts bestellen",            "content": "„Das plus aktiviert den Warenkorb". Ja nur ist bei mir bei keinem einzigen Gericht ein Plus. So ein Müll!" },
 *   { "id": "7722330073",  "author": "hfgjnbgfhj",                  "rating": "1", "version": "10.0.0",   "title": "Kein Warenkorb",                               "content": "Leider kann ich seit dem neuesten Update nichts in den Warenkorb tun. Das angebliche „+" ist nicht zu sehen. Schade! Ich hoffe ich bin nicht der einzige der jetzt nichts zu Essen bekommt." },
 *   { "id": "7708145838",  "author": "Drache;)",                    "rating": "1", "version": "10.0.0",   "title": "Update schlecht",                              "content": "Seit dem Update kann ich keine Gerichte mehr hinzufügen….tja" },
 *   { "id": "7690887016",  "author": "Minni61",                     "rating": "1", "version": "9.0.0",    "title": "Hakt und lädt sich tot",                       "content": "Habe jetzt an cirka 5 oder 6 unterschiedlichen Tagen versucht, essen zu bestellen, weil man sonst ja gar nicht mehr in der Mensa essen kann😡 leider hat sich die App an jeweils unterschiedlichen Stellen immer tot geladen, bis ich nach einigen Minuten dann keine Lust mehr hatte. Bestellen/reservieren konnte ich so bisher noch gar nichts, ergo: eigentlich null Sterne weil der eigentliche Zweck der App komplett verfehlt wurde. Ich lösch sie wieder und mache mir dann wohl selbst das Essen" },
 *   { "id": "7393824475",  "author": "Haukili",                     "rating": "3", "version": "8.0.0",    "title": "Coole App, Bedienung etwas unübersichtlich",   "content": "Ich fände eine Funktion cool, schnell über die Startseite auf die aktuelle Bestellung zugreifen zu können. Bisher habe ich nur den Weg über Mensa -> Mensa ToGo -> Aktuelle Bestellung gefunden." }
 * ]
 *
 * Note: SWOSY (appId=6667117575) returned no entries (feed without "entry" key) as of 2026-04-26.
 * The full raw response per entry contains: author, updated, im:rating, im:version, id, title, content,
 * link, im:voteSum, im:contentType, im:voteCount fields.
 */

export type AppleRssReviewEntry = {
  author: { name: { label: string }; uri: { label: string } };
  'im:version': { label: string };
  'im:rating': { label: string };
  id: { label: string };
  title: { label: string };
  content: { label: string; attributes: { type: string } };
  'im:voteSum': { label: string };
  'im:contentType': { label: string; attributes: { term: string; label: string } };
  'im:voteCount': { label: string };
  link: { attributes: { rel: string; href: string } };
};

export type AppleRssFeedResponse = {
  feed: {
    author: unknown;
    entry?: AppleRssReviewEntry[];
    updated: { label: string };
    rights: { label: string };
    title: { label: string };
    icon: { label: string };
    link: unknown[];
    id: { label: string };
  };
};

export class AppleAppStoreRssHelper {
  static async fetchReviews(appId: string, page = 1): Promise<AppleRssFeedResponse> {
    const url = `https://itunes.apple.com/de/rss/customerreviews/page=${page}/id=${appId}/sortBy=mostRecent/json`;
    const response = await FetchHelper.fetch(url, {
      headers: { 'Content-Type': 'application/json' },
    });
    const json = (await response.json()) as AppleRssFeedResponse;
    return json;
  }

  static getReviewId(entry: AppleRssReviewEntry): string {
    return entry.id.label;
  }

  static getReviewRating(entry: AppleRssReviewEntry): number {
    return parseInt(entry['im:rating'].label, 10);
  }

  static getReviewTitle(entry: AppleRssReviewEntry): string {
    return entry.title.label;
  }

  static getReviewBody(entry: AppleRssReviewEntry): string {
    return entry.content.label;
  }

  static getReviewAuthor(entry: AppleRssReviewEntry): string {
    return entry.author.name.label;
  }
}
