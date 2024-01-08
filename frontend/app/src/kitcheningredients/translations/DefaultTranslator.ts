import {TranslationKeys} from "./TranslationKeys";
import {RequiredStorageKeys} from "../storage/RequiredStorageKeys";

export class DefaultTranslator{

    static useTranslation(translation_key){
      switch(translation_key){
        case TranslationKeys.home: return "Start";
        case TranslationKeys.log_in_with: return "Anmelden mit";
        case TranslationKeys.continue: return "Weiter";
        case TranslationKeys.sign_in: return "Anmelden";
        case TranslationKeys.email: return "E-Mail";
        case TranslationKeys.password_visible: return "Passwort sichtbar";
        case TranslationKeys.password_hidden: return "Passwort versteckt";
        case TranslationKeys.confirm_password: return "Passwort bestätigen";
        case TranslationKeys.password: return "Passwort";
        case TranslationKeys.register: return "Registrieren";
        case TranslationKeys.logout_confirm_message: return "Willst du dich abmelden?";
        case TranslationKeys.logout: return "Abmelden";
        case TranslationKeys.sidebar_menu: return "Menü";
        case TranslationKeys.continue_as_anonymous: return "Anonym fortfahren";
        case TranslationKeys.forgot_password: return "Passwort vergessen";
        case TranslationKeys.is_currently_authenticated_remember_this_account: return "Ist aktuell angemeldet. Erkennst du diesen Account?";
        case TranslationKeys.profile_and_settings: return "Profil und Einstellungen";

        case TranslationKeys.rushMinutes_openedFrom: return "Offen ab";
        case TranslationKeys.rushMinutes_closedAfter: return "Geschlossen ab";

        case TranslationKeys.switch: return "Wechseln";
        case TranslationKeys.button_disabled: return "Deaktiviert";

        case TranslationKeys.by_continuing_you_agree_to_terms_and_conditions_and_privacy_policy: return "Indem du fortfährst, bestätigst du, dass du unsere Datenschutzrichtlinien gelesen hast.";

        case TranslationKeys.cookie_policy_consent: return "Zustimmung";
        case TranslationKeys.cookie_policy_details: return "Details";
        case TranslationKeys.cookie_policy_about: return "Über Cookies";
        case TranslationKeys.cookie_policy_button_accept_all: return "Alles akzeptieren";
        case TranslationKeys.cookie_policy_button_deny_all: return "Ablehnen";
        case TranslationKeys.cookie_policy_button_allow_selected: return "Auswahl erlauben";
        case TranslationKeys.cookie_policy_consent_date: return "Einwilligungsdatum";
        case TranslationKeys.cookie_policy_policy_date_updated: return "Die Cookie-Erklärung wurde das letzte Mal aktualisiert am:";
        case TranslationKeys.cookies: return "Cookies";
        case TranslationKeys.cookie_policy_details_name: return "Name";
        case TranslationKeys.cookie_policy_details_provider: return "Anbieter";
        case TranslationKeys.cookie_policy_details_purpose: return "Zweck";
        case TranslationKeys.cookie_policy_details_expiry: return "Ablauf";
        case TranslationKeys.cookie_policy_details_expiry_persistent: return "Persistent";
        case TranslationKeys.cookie_policy_details_type: return "Typ";
        case TranslationKeys.cookie_policy_group_necessary: return "Notwendig";
        case TranslationKeys.cookie_policy_provider_we: return "Wir";

      }
    }

    static useRequiredStorageKeysPurpose(storageKey: RequiredStorageKeys): string{
      switch (storageKey) {
        case RequiredStorageKeys.KEY_AUTH_REFRESH_TOKEN: return "Speichert den Refresh-Token";
        case RequiredStorageKeys.KEY_AUTH_EXPIRES: return "Speichert die Lebensdauer des Authentifizierungs-Tokens";
        case RequiredStorageKeys.KEY_AUTH_EXPIRES_DATE: return "Speichert das Ablaufdatum des Authentifizierungs-Tokens";
        case RequiredStorageKeys.KEY_AUTH_ACCESS_TOKEN: return "Speichert den Authentifizierungs-Token";
        case RequiredStorageKeys.CACHED_SERVER_INFO: return "Speichert die Server-Informationen";
        case RequiredStorageKeys.CACHED_THEME: return "Speichert das aktuelle Theme";
        case RequiredStorageKeys.CACHED_USER: return "Speichert den aktuellen Benutzer";
        case RequiredStorageKeys.IS_ANONYMOUS: return "Speichert ob der Benutzer ein Gast ist";
        case RequiredStorageKeys.COOKIE_CONFIG: return "Speichert die Cookie-Einstellungen";
        default: return "Erforderlich für die grundlegende Funktionalität der Webseite";
      }
    }


}
