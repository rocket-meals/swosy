type GetTranslationFunction = ((key: string) => string) | string;

interface TranslationKey {
    key: string,
    getTranslation: GetTranslationFunction
}

function createTranslationKey(key: string, getTranslation: GetTranslationFunction): TranslationKey{
    return {
        key: key,
        getTranslation: getTranslation
    }
}

export function useTranslation(key: TranslationKey): string{
    // TODO: Implement Directus Translation API

    if(typeof key.getTranslation === "string"){
        return key.getTranslation;
    }
    return key.getTranslation(key.key);
}

export class TranslationKeys {
  static sidebar_menu = createTranslationKey("sidebar_menu", "Menü");
  static profile_and_settings = createTranslationKey("profile_and_settings", "Profil und Einstellungen");
  static profile = createTranslationKey("profile", "Profil")
  static nickname = createTranslationKey("nickname", "Spitzname")
  static user = createTranslationKey("user", "Nutzer")

  static about_us = createTranslationKey("about_us", "Über uns");
  static license = createTranslationKey("license", "Lizenz");
  static accessibility = createTranslationKey("accessibility", "Barrierefreiheit");
  static terms_and_conditions = createTranslationKey("terms_and_conditions", "Nutzungsbedingungen");
  static cookie_policy = createTranslationKey("cookie_policy", "Cookie-Richtlinie");
  static privacy_policy = createTranslationKey("privacy_policy", "Datenschutzerklärung");

  static currently_logged_in_as = createTranslationKey("currently_logged_in_as", "Angemeldet als");
  static if_you_want_to_login_with_this_account_please_press = createTranslationKey("if_you_want_to_login_with_this_account_please_press", "Wenn Sie sich mit diesem Konto anmelden möchten, drücken Sie bitte");
  static logout = createTranslationKey("logout", "Abmelden");
  static logout_confirm_message = createTranslationKey("logout_confirm_message", "Möchten Sie sich wirklich abmelden?");
  static register = createTranslationKey("register", "Registrieren");
  static sign_in = createTranslationKey("sign_in", "Anmelden");
  static continue = createTranslationKey("continue", "Fortfahren");
  static is_currently_authenticated_remember_this_account = createTranslationKey("is_currently_authenticated_remember_this_account", "Dieses Konto merken");
  static forgot_password = createTranslationKey("forgot_password", "Passwort vergessen?");

  static navigate_to = createTranslationKey("navigate_to", "Navigiere zu");
  static open_drawer = createTranslationKey("open_drawer", "Seitenleiste öffnen")

  static canteen = createTranslationKey("canteen", "Mensa");

  static show_login_with_username_and_password = createTranslationKey("show_login_with_username_and_password", "Mitarbeiter-Login");
  static email = createTranslationKey("email", "E-Mail");
  static password = createTranslationKey("password", "Passwort");
  static password_show = createTranslationKey("password_show", "Passwort anzeigen");
  static password_hide = createTranslationKey("password_hide", "Passwort verstecken");
  static confirm_password = createTranslationKey("confirm_password", "Passwort bestätigen");
  static continue_as_anonymous = createTranslationKey("continue_as_anonymous", "Anonym fortfahren");
  static sign_in_with = createTranslationKey("sign_in_with", "Fortfahren mit");

  static home = createTranslationKey("home", "Startseite");

  static settings = createTranslationKey("settings", "Einstellungen");

  static switch = createTranslationKey("switch", "Umschalten");
  static edit = createTranslationKey("edit", "Bearbeiten");
  static save = createTranslationKey("save", "Speichern");
  static button_disabled = createTranslationKey("button_disabled", "Knopf deaktiviert");
  static select = createTranslationKey("select", "Auswählen");

  static language = createTranslationKey("language", "Sprache");

  static drawer_config_position = createTranslationKey("drawer_config_position", "Position des Menüs");
  static drawer_config_position_left = createTranslationKey("drawer_config_position_left", "Links");
  static drawer_config_position_right = createTranslationKey("drawer_config_position_right", "Rechts");
  static drawer_config_position_system = createTranslationKey("drawer_config_position_system", "System");


  static color_scheme = createTranslationKey("color_scheme", "Farbschema");
  static color_scheme_light = createTranslationKey("color_scheme_light", "Hell");
  static color_scheme_dark = createTranslationKey("color_scheme_dark", "Dunkel");
  static color_scheme_system = createTranslationKey("color_scheme_system", "System");

  static rushMinutes_openedFrom = createTranslationKey("rushMinutes_openedFrom", "Geöffnet von");
  static rushMinutes_closedAfter = createTranslationKey("rushMinutes_closedAfter", "Geschlossen nach");

  static by_continuing_you_agree_to_terms_and_conditions_and_privacy_policy = createTranslationKey("by_continuing_you_agree_to_terms_and_conditions_and_privacy_policy", "Mit dem Fortfahren stimmen Sie den Nutzungsbedingungen und der Datenschutzerklärung zu");

  static cookie_policy_consent = createTranslationKey("cookie_policy_consent", "Einwilligung zur Cookie-Richtlinie");
  static cookie_policy_details = createTranslationKey("cookie_policy_details", "Details zur Cookie-Richtlinie");
  static cookie_policy_about = createTranslationKey("cookie_policy_about", "Über die Cookie-Richtlinie");
  static cookie_policy_button_accept_all = createTranslationKey("cookie_policy_button_accept_all", "Alle Cookies akzeptieren");
  static cookie_policy_button_deny_all = createTranslationKey("cookie_policy_button_deny_all", "Alle Cookies ablehnen");
  static cookie_policy_button_allow_selected = createTranslationKey("cookie_policy_button_allow_selected", "Ausgewählte Cookies zulassen");
  static cookie_policy_consent_date = createTranslationKey("cookie_policy_consent_date", "Datum der Zustimmung zur Cookie-Richtlinie");
  static cookie_policy_policy_date_updated = createTranslationKey("cookie_policy_policy_date_updated", "Datum der letzten Aktualisierung der Cookie-Richtlinie");
  static cookie_policy_details_name = createTranslationKey("cookie_policy_details_name", "Name des Cookies");
  static cookie_policy_group_necessary = createTranslationKey("cookie_policy_group_necessary", "Notwendige Cookies");
  static cookie_policy_details_provider = createTranslationKey("cookie_policy_details_provider", "Anbieter des Cookies");
  static cookie_policy_details_purpose = createTranslationKey("cookie_policy_details_purpose", "Zweck des Cookies");
  static cookie_policy_details_expiry = createTranslationKey("cookie_policy_details_expiry", "Ablaufdatum des Cookies");
  static cookie_policy_details_expiry_persistent = createTranslationKey("cookie_policy_details_expiry_persistent", "Persistente Cookies");
  static cookie_policy_details_type = createTranslationKey("cookie_policy_details_type", "Art des Cookies");
  static cookie_policy_provider_we = createTranslationKey("cookie_policy_provider_we", "Wir als Cookie-Anbieter");
  static cookies = createTranslationKey("cookies", "Cookies");

  static KEY_AUTH_REFRESH_TOKEN = createTranslationKey("KEY_AUTH_REFRESH_TOKEN", "Speichert den Refresh-Token");
  static KEY_AUTH_EXPIRES = createTranslationKey("KEY_AUTH_EXPIRES", "Speichert die Lebensdauer des Authentifizierungs-Tokens");
  static KEY_AUTH_EXPIRES_DATE = createTranslationKey("KEY_AUTH_EXPIRES_DATE", "Speichert das Ablaufdatum des Authentifizierungs-Tokens");
  static KEY_AUTH_ACCESS_TOKEN = createTranslationKey("KEY_AUTH_ACCESS_TOKEN", "Speichert den Authentifizierungs-Token");
  static CACHED_SERVER_INFO = createTranslationKey("CACHED_SERVER_INFO", "Speichert die Server-Informationen");
  static CACHED_THEME = createTranslationKey("CACHED_THEME", "Speichert das aktuelle Theme");
  static CACHED_USER = createTranslationKey("CACHED_USER", "Speichert den aktuellen Benutzer");
  static IS_ANONYMOUS = createTranslationKey("IS_ANONYMOUS", "Speichert ob der Benutzer ein Gast ist");
  static COOKIE_CONFIG = createTranslationKey("COOKIE_CONFIG", "Speichert die Cookie-Einstellungen");
  static required_for_functionality_of_the_app = createTranslationKey("required_for_functionality_of_the_app", "Erforderlich für die grundlegende Funktionalität der Applikation");
}
