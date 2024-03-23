import {useSynchedAppTranslationsDict} from '@/states/SynchedTranslations';
import {TranslationEntry, useDirectusTranslation} from '@/helper/translations/DirectusTranslationUseFunction';

type GetTranslationFunction = ((key: string) => string) | string;

interface TranslationKey {
    key: string,
    getTranslation: GetTranslationFunction
}

function createTranslationKey(key: string, getTranslation: GetTranslationFunction): TranslationKey {
	return {
		key: key,
		getTranslation: getTranslation
	}
}

export function useTranslation(key: TranslationKey): string {
	const [translationsDict, setTranslationsDict, lastUpdateTranslations, updateTranslationsFromServer] = useSynchedAppTranslationsDict()
	let fallback_text = key.getTranslation;
	if (typeof key.getTranslation === 'string') {
		fallback_text = key.getTranslation;
	} else {
		fallback_text = key.getTranslation(key.key);
	}

	let translations: TranslationEntry[] = [];
	if (translationsDict) {
		const app_translation = translationsDict[key.key];
		if (app_translation) {
			translations = app_translation.translations as TranslationEntry[];
		}
	}
	const usedTranslation = useDirectusTranslation(translations, 'text', false, fallback_text);
	return usedTranslation;
}

export function useTranslations(keys: TranslationKey[]): string[] {
	const translations: string[] = [];
	for (let i = 0; i < keys.length; i++) {
		translations.push(useTranslation(keys[i]));
	}
	return translations;
}

export class TranslationKeys {
	static sidebar_menu = createTranslationKey('sidebar_menu', 'Menü');
	static profile_and_settings = createTranslationKey('profile_and_settings', 'Profil und Einstellungen');
	static profile = createTranslationKey('profile', 'Profil')
	static nickname = createTranslationKey('nickname', 'Spitzname')
	static account = createTranslationKey('account', 'Account')
	static anonymous = createTranslationKey('anonymous', 'Anonym')
	static reset = createTranslationKey('reset', 'Zurücksetzen')
	static confirm = createTranslationKey('confirm', 'Bestätigen')
	static are_you_sure_to_delete_your_account = createTranslationKey('are_you_sure_to_delete_your_account', 'Sind Sie sicher, dass Sie Ihren Account löschen möchten?');

	static sort = createTranslationKey('sort', 'Sortieren');
	static sort_option_none = createTranslationKey('none', 'Keine');
	static sort_option_alphabetical = createTranslationKey('alphabetical', 'Alphabetisch');
	static sort_option_favorite = createTranslationKey('favorite', 'Favorit');
	static sort_option_intelligent = createTranslationKey('intelligent', 'Intelligent');

	static new = createTranslationKey('new', 'Neu');

	static attention = createTranslationKey('attention', 'Achtung!');
	static anonymous_limitations = createTranslationKey('anonymous_limitations', 'Wir respektieren deine Privatsphäre und bieten dir die Möglichkeit, die App anonym zu nutzen. Einige Funktionen wie Pushnachrichten, Synchronisation und andere Funktionen sind jedoch nicht verfügbar, da hierfür ein Account benötigt wird.');

	static not_useable = createTranslationKey('not_useable', 'Nicht nutzbar');

	static no_foodoffers_found_for_selection = createTranslationKey('no_foodoffers_found_for_selection', 'Keine Angebote gefunden.');

	static error = createTranslationKey("error", "Fehler");

	static description = createTranslationKey('description', 'Beschreibung');
	static information = createTranslationKey('information', 'Informationen');

	static no_data_currently_calculating = createTranslationKey('no_data_currently_calculating', 'Keine Daten, werden gerade berechnet');

	static food_feedbacks = createTranslationKey('food_feedbacks', 'Essensbewertungen');
	static to_the_forum = createTranslationKey('to_the_forum', 'Zum Forum');
	static reset_rating = createTranslationKey('reset_rating', 'Bewertung zurücksetzen');
	static set_rating_to = createTranslationKey('set_rating_to', 'Bewertung auf');
	static set_rate_as_favorite = createTranslationKey('set_rate_as_favorite', 'Bewertung als Favorit');
	static set_rate_as_not_favorite = createTranslationKey('set_rate_as_not_favorite', 'Bewertung nicht als Favorit');

	static open_navitation_to_location = createTranslationKey('open_navitation_to_location', 'Navigation zum Standort öffnen');
	static coordinates = createTranslationKey('coordinates', 'Koordinaten');
	static copy_url = createTranslationKey('copy_url', 'URL kopieren');
	static copy = createTranslationKey('copy', 'Kopieren');
	static copied = createTranslationKey('copied', 'Kopiert');
	static year_of_construction = createTranslationKey('year_of_construction', 'Baujahr');
	static unknown = createTranslationKey('unknown', 'Unbekannt');

	static animation = createTranslationKey('animation', 'Animation');
	static allergene = createTranslationKey('allergene', 'Allergene');
	static notification = createTranslationKey('notification', 'Benachrichtigung');

	static price_group = createTranslationKey('price_group', 'Preisgruppe');
	static price_group_student = createTranslationKey('price_group_student', 'Student');
	static price_group_employee = createTranslationKey('price_group_employee', 'Mitarbeiter');
	static price_group_guest = createTranslationKey('price_group_guest', 'Gast');

	static under_construction = createTranslationKey('under_construction', 'In Arbeit');
	static no_permission = createTranslationKey('no_permission', 'Keine Berechtigung');
	static please_create_an_account = createTranslationKey('please_create_an_account', 'Bitte erstelle einen Account');
	static create_account = createTranslationKey('create_account', 'Account erstellen');

	static washing_machine = createTranslationKey('washing_machine', 'Waschmaschine');
	static washing_machines = createTranslationKey('washing_machines', 'Waschmaschinen');
	static washingmachine_state_finished = createTranslationKey('washingmachine_state_finished', 'Waschen beendet');
	static washingmachine_state_running = createTranslationKey('washingmachine_state_running', 'Wäscht gerade');
	static washingmachine_estimate_finished_at = createTranslationKey("washingmachine_estimate_finished", "Voraussichtlich fertig um");
	static washingmachine_state_unknown = createTranslationKey('translation_washingmachine_unknown', 'Waschmaschine unbekannt');

	static active = createTranslationKey('active', 'Aktiv');
	static activate = createTranslationKey('activate', 'Aktiveren');
	static inactive = createTranslationKey('inactive', 'Inaktiv');
	static deactivate = createTranslationKey('deactivate', 'Deaktivieren');

	static import = createTranslationKey('import', 'Importieren');
	static event = createTranslationKey('event', 'Veranstaltung');
	static create = createTranslationKey('create', 'Erstellen');

	static delete = createTranslationKey('delete', 'Löschen');
	static location = createTranslationKey('location', 'Ort');
	static title = createTranslationKey('title', 'Titel');
	static weekday = createTranslationKey('weekday', 'Wochentag');
	static startTime = createTranslationKey('startTime', 'Startzeit');
	static endTime = createTranslationKey('endTime', 'Endzeit');
	static color = createTranslationKey('color', 'Farbe');
	static cancel = createTranslationKey('cancel', 'Abbrechen');
	static for_example = createTranslationKey('for_example', 'z.B.');

	static courseTimetableDescriptionEmpty = createTranslationKey('courseTimetableDescriptionEmpty', 'Du hast noch keinen **Stundenplan**?\n\nMit unserer Stundenplanfunktion kannst du dein Studium und deine Mahlzeiten wie ein Profi planen. Wenn du ein Profil hast, synchronisieren wir deinen Stundenplan automatisch.\n\n*Hinweis: Wir analysieren Profile mit Stundenplänen, um überfüllte Essensschlangen zu vermeiden - wir geben diese Daten nicht an Dritte weiter.*\n[Mehr darüber](https://nilsbaumgartner.de/homepage/2023/01/15/speiseprognose/)');

	static nothing_found = createTranslationKey('nothing_found', 'Nichts gefunden');

	static seemsEmpty = createTranslationKey('seemsEmpty', 'Es scheint leer zu sein');
	static noFeedbacksFound = createTranslationKey('noFeedbacksFound', 'Kein Feedback gefunden');
	static somethingWentWrong = createTranslationKey('somethingWentWrong', 'Etwas ist schief gelaufen');

	static date = createTranslationKey('date', 'Datum');
	static year = createTranslationKey('year', 'Jahr');
	static month = createTranslationKey('month', 'Monat');
	static selected = createTranslationKey('selected', 'Ausgewählt');

	static next = createTranslationKey('next', 'Weiter');
	static previous = createTranslationKey('previous', 'Zurück');

	static businesshours = createTranslationKey('businesshours', 'Geschäftszeiten');
	static until = createTranslationKey('until', "bis");

	static day = createTranslationKey('day', 'Tag');
	static today = createTranslationKey('today', 'Heute');
	static tomorrow = createTranslationKey('tomorrow', 'Morgen');
	static yesterday = createTranslationKey('yesterday', 'Gestern');

	static nutrition = createTranslationKey('nutrition', 'Nährwerte');
	static nutrition_disclaimer = createTranslationKey('nutrition_disclaimer', 'Bei der Angabe von der Nährwerte handelt es sich um Durchschnittswerte pro Portion. Änderungen vorbehalten.');
	static nutrition_calories = createTranslationKey('nutrition_calories', 'Kalorien');
	static nutrition_protein = createTranslationKey('nutrition_protein', 'Protein');
	static nutrition_fat = createTranslationKey('nutrition_fat', 'Fett');
	static nutrition_carbohydrate = createTranslationKey('nutrition_carbohydrate', 'Kohlenhydrate');
	static nutrition_fiber = createTranslationKey('nutrition_fiber', 'Ballaststoffe');
	static nutrition_sugar = createTranslationKey('nutrition_sugar', 'Zucker');
	static nutrition_sodium = createTranslationKey('nutrition_sodium', 'Natrium');
	static nutrition_saturated_fat = createTranslationKey('nutrition_saturated_fat', 'Gesättigte Fettsäuren');

	static about_us = createTranslationKey('about_us', 'Über uns');
	static license = createTranslationKey('license', 'Lizenz');
	static accessibility = createTranslationKey('accessibility', 'Barrierefreiheit');
	static terms_and_conditions = createTranslationKey('terms_and_conditions', 'Nutzungsbedingungen');
	static cookie_policy = createTranslationKey('cookie_policy', 'Cookie-Richtlinie');
	static privacy_policy = createTranslationKey('privacy_policy', 'Datenschutzerklärung');

	static okay = createTranslationKey('okay', 'Okay');

	static currently_logged_in_as = createTranslationKey('currently_logged_in_as', 'Angemeldet als');
	static if_you_want_to_login_with_this_account_please_press = createTranslationKey('if_you_want_to_login_with_this_account_please_press', 'Wenn Sie sich mit diesem Konto anmelden möchten, drücken Sie bitte');
	static logout = createTranslationKey('logout', 'Abmelden');
	static logout_confirm_message = createTranslationKey('logout_confirm_message', 'Möchten Sie sich wirklich abmelden?');
	static register = createTranslationKey('register', 'Registrieren');
	static sign_in = createTranslationKey('sign_in', 'Anmelden');
	static continue = createTranslationKey('continue', 'Fortfahren');
	static is_currently_authenticated_remember_this_account = createTranslationKey('is_currently_authenticated_remember_this_account', 'Dieses Konto merken');
	static forgot_password = createTranslationKey('forgot_password', 'Passwort vergessen?');

	static navigate_to = createTranslationKey('navigate_to', 'Navigiere zu');
	static open_drawer = createTranslationKey('open_drawer', 'Seitenleiste öffnen')
	static navigate_back = createTranslationKey('navigate_back', 'Zurück navigieren');

	static canteen = createTranslationKey('canteen', 'Mensa');

	static news = createTranslationKey('news', 'News');
	static read_more = createTranslationKey('read_more', 'Mehr lesen');

	static course_timetable = createTranslationKey('course_timetable', 'Stundenplan');

	static eating_habits = createTranslationKey('eating_habits', 'Essgewohnheiten');
	static markings = createTranslationKey('markings', 'Kennzeichnungen');
	static markings_disclaimer = createTranslationKey("markings_disclaimer", "Diese Angaben sind ohne Gewähr. Es gilt die Kennzeichnung vor Ort.")

	static forecast = createTranslationKey('forecast', 'Prognose');
	static utilization = createTranslationKey('utilization', 'Auslastung');
	static opens_at = createTranslationKey('opend_at', 'Öffnet um');
	static closed_after = createTranslationKey('closed_after', 'Geschlossen ab');

	static food_details = createTranslationKey('food_details', 'Gericht Details');

	static show_login_with_username_and_password = createTranslationKey('show_login_with_username_and_password', 'Mitarbeiter-Login');
	static email = createTranslationKey('email', 'E-Mail');
	static password = createTranslationKey('password', 'Passwort');
	static show = createTranslationKey('show', 'Anzeigen');
	static hide = createTranslationKey('hide', 'Verbergen');
	static confirm_password = createTranslationKey('confirm_password', 'Passwort bestätigen');
	static continue_as_anonymous = createTranslationKey('continue_as_anonymous', 'Anonym fortfahren');
	static sign_in_with = createTranslationKey('sign_in_with', 'Fortfahren mit');

	static home = createTranslationKey('home', 'Startseite');
	static canteens = createTranslationKey('canteens', 'Mensa');

	static buildings = createTranslationKey('buildings', 'Gebäude');

	static housing = createTranslationKey('housing', 'Wohnen');

	static settings = createTranslationKey('settings', 'Einstellungen');

	static switch = createTranslationKey('switch', 'Umschalten');
	static edit = createTranslationKey('edit', 'Bearbeiten');
	static save = createTranslationKey('save', 'Speichern');
	static button_disabled = createTranslationKey('button_disabled', 'Knopf deaktiviert');
	static select = createTranslationKey('select', 'Auswählen');
	static upload = createTranslationKey('upload', 'Hochladen');

	static camera = createTranslationKey('camera', 'Kamera');
	static gallery = createTranslationKey('gallery', 'Galerie');

	static image = createTranslationKey('image', 'Bild');

	static language = createTranslationKey('language', 'Sprache');

	static drawer_config_position = createTranslationKey('drawer_config_position', 'Position des Menüs');
	static drawer_config_position_left = createTranslationKey('drawer_config_position_left', 'Links');
	static drawer_config_position_right = createTranslationKey('drawer_config_position_right', 'Rechts');
	static drawer_config_position_system = createTranslationKey('drawer_config_position_system', 'System');

	static first_day_of_week = createTranslationKey('first_day_of_week', 'Erster Tag der Woche');
	static first_day_of_week_system = createTranslationKey('first_day_of_week_system', 'System');

	static color_scheme = createTranslationKey('color_scheme', 'Farbschema');
	static color_scheme_light = createTranslationKey('color_scheme_light', 'Hell');
	static color_scheme_dark = createTranslationKey('color_scheme_dark', 'Dunkel');
	static color_scheme_system = createTranslationKey('color_scheme_system', 'System');

	static by_continuing_you_agree_to_terms_and_conditions_and_privacy_policy = createTranslationKey('by_continuing_you_agree_to_terms_and_conditions_and_privacy_policy', 'Mit dem Fortfahren stimmen Sie den Nutzungsbedingungen und der Datenschutzerklärung zu');

	static cookie_policy_consent = createTranslationKey('cookie_policy_consent', 'Einwilligung zur Cookie-Richtlinie');
	static cookie_policy_details = createTranslationKey('cookie_policy_details', 'Details zur Cookie-Richtlinie');
	static cookie_policy_about = createTranslationKey('cookie_policy_about', 'Über die Cookie-Richtlinie');
	static cookie_policy_button_accept_all = createTranslationKey('cookie_policy_button_accept_all', 'Alle Cookies akzeptieren');
	static cookie_policy_button_deny_all = createTranslationKey('cookie_policy_button_deny_all', 'Alle Cookies ablehnen');
	static cookie_policy_button_allow_selected = createTranslationKey('cookie_policy_button_allow_selected', 'Ausgewählte Cookies zulassen');
	static cookie_policy_consent_date = createTranslationKey('cookie_policy_consent_date', 'Datum der Zustimmung zur Cookie-Richtlinie');
	static cookie_policy_policy_date_updated = createTranslationKey('cookie_policy_policy_date_updated', 'Datum der letzten Aktualisierung der Cookie-Richtlinie');
	static cookie_policy_details_name = createTranslationKey('cookie_policy_details_name', 'Name des Cookies');
	static cookie_policy_group_necessary = createTranslationKey('cookie_policy_group_necessary', 'Notwendige Cookies');
	static cookie_policy_details_provider = createTranslationKey('cookie_policy_details_provider', 'Anbieter des Cookies');
	static cookie_policy_details_purpose = createTranslationKey('cookie_policy_details_purpose', 'Zweck des Cookies');
	static cookie_policy_details_expiry = createTranslationKey('cookie_policy_details_expiry', 'Ablaufdatum des Cookies');
	static cookie_policy_details_expiry_persistent = createTranslationKey('cookie_policy_details_expiry_persistent', 'Persistente Cookies');
	static cookie_policy_details_type = createTranslationKey('cookie_policy_details_type', 'Art des Cookies');
	static cookie_policy_provider_we = createTranslationKey('cookie_policy_provider_we', 'Wir als Cookie-Anbieter');
	static cookies = createTranslationKey('cookies', 'Cookies');

	// TODO: Not translated online in the demo, maybe use different translations at all for that
	static KEY_AUTH_REFRESH_TOKEN = createTranslationKey('KEY_AUTH_REFRESH_TOKEN', 'Speichert den Refresh-Token');
	static KEY_AUTH_EXPIRES = createTranslationKey('KEY_AUTH_EXPIRES', 'Speichert die Lebensdauer des Authentifizierungs-Tokens');
	static KEY_AUTH_EXPIRES_DATE = createTranslationKey('KEY_AUTH_EXPIRES_DATE', 'Speichert das Ablaufdatum des Authentifizierungs-Tokens');
	static KEY_AUTH_ACCESS_TOKEN = createTranslationKey('KEY_AUTH_ACCESS_TOKEN', 'Speichert den Authentifizierungs-Token');
	static CACHED_SERVER_INFO = createTranslationKey('CACHED_SERVER_INFO', 'Speichert die Server-Informationen');
	static CACHED_THEME = createTranslationKey('CACHED_THEME', 'Speichert das aktuelle Theme');
	static CACHED_USER = createTranslationKey('CACHED_USER', 'Speichert den aktuellen Benutzer');
	static IS_ANONYMOUS = createTranslationKey('IS_ANONYMOUS', 'Speichert ob der Benutzer ein Gast ist');
	static COOKIE_CONFIG = createTranslationKey('COOKIE_CONFIG', 'Speichert die Cookie-Einstellungen');
	static required_for_functionality_of_the_app = createTranslationKey('required_for_functionality_of_the_app', 'Erforderlich für die grundlegende Funktionalität der Applikation');
}
