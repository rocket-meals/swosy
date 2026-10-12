/**
 * ActionRecommendationDefinitions.ts – which collections can get action recommendations, and what
 * each of them offers.
 *
 * Fixed in code on purpose: a collection says itself which fields may be sent to the AI (an allowlist,
 * personal data such as `profile` or `contact_email` never leaves the server) and which actions make
 * sense for it. A new collection only needs an entry here (plus the labels of new actions in the
 * backend catalog), the endpoint, the prompt and the table `action_recommendations` are shared.
 *
 * No Vue and no Directus imports: the endpoint and the module pages both use it.
 */

import { CollectionNames } from 'repo-depkit-common/src/databaseTypes/CollectionNames';
import { BackendTranslationKeys } from '../translations/BackendTranslationKeys';

/** Everything that can be recommended. The value is stored in `action_recommendations.action`. */
export enum ActionRecommendationAction {
  REPLY = 'reply',
  IGNORE = 'ignore',
  FORWARD_TO_KITCHEN = 'forward_to_kitchen',
  FORWARD_TO_DEVELOPMENT = 'forward_to_development',
}

/** The state of a recommendation, stored in `action_recommendations.state`. */
export enum ActionRecommendationState {
  OPEN = 'open',
  ACCEPTED = 'accepted',
  DISMISSED = 'dismissed',
}

export type ActionRecommendationActionInfo = {
  /** What the AI is told the action means (prompt text, never shown in the UI). */
  promptDescription: string;
  labelKey: BackendTranslationKeys;
  icon: string;
};

export const ACTION_RECOMMENDATION_ACTIONS: Record<ActionRecommendationAction, ActionRecommendationActionInfo> = {
  [ActionRecommendationAction.REPLY]: {
    promptDescription: 'Antworten: der Eintrag enthält eine Frage, ein konkretes Problem oder Kritik, auf die eine Antwort hilft. Schreibe dann einen kurzen, freundlichen Antwortvorschlag.',
    labelKey: BackendTranslationKeys.rocket_meals_module_action_recommendation_action_reply,
    icon: 'reply',
  },
  [ActionRecommendationAction.IGNORE]: {
    promptDescription: 'Ohne Antwort erledigen: kein konkreter Inhalt, reines Lob, Unsinn, Spam oder Beleidigung, eine Antwort bringt niemandem etwas.',
    labelKey: BackendTranslationKeys.rocket_meals_module_action_recommendation_action_ignore,
    icon: 'task_alt',
  },
  [ActionRecommendationAction.FORWARD_TO_KITCHEN]: {
    promptDescription: 'An die Küche weitergeben: konkreter Hinweis zur Speise selbst (Geschmack, Temperatur, Menge, Allergene, falsche Kennzeichnung), den die Küche kennen sollte.',
    labelKey: BackendTranslationKeys.rocket_meals_module_action_recommendation_action_forward_to_kitchen,
    icon: 'soup_kitchen',
  },
  [ActionRecommendationAction.FORWARD_TO_DEVELOPMENT]: {
    promptDescription: 'An die Entwicklung weitergeben: Fehler in der App oder ein konkreter Funktionswunsch.',
    labelKey: BackendTranslationKeys.rocket_meals_module_action_recommendation_action_forward_to_development,
    icon: 'bug_report',
  },
};

export type ActionRecommendationDefinition = {
  collection: CollectionNames;
  /** What an item of the collection is, for the AI (prompt text). */
  promptContext: string;
  /** The only fields of an item that are sent to the AI, besides `id`. */
  fields: readonly string[];
  /** The actions the AI may recommend for an item of this collection. */
  actions: readonly ActionRecommendationAction[];
  /** Only items with text in one of these fields are worth a recommendation or a summary. */
  textFields: readonly string[];
  /** A field the items of a summary can be grouped by, e.g. all feedbacks of one food. */
  summaryGroupField?: string;
};

export class ActionRecommendationDefinitions {
  static readonly DEFINITIONS: readonly ActionRecommendationDefinition[] = [
    {
      collection: CollectionNames.FOODS_FEEDBACKS,
      promptContext: 'Rückmeldungen von Gästen einer Mensa zu einer Speise: ein Kommentar und eine Bewertung von 1 (schlecht) bis 5 (gut).',
      fields: ['comment', 'rating'],
      textFields: ['comment'],
      actions: [ActionRecommendationAction.REPLY, ActionRecommendationAction.IGNORE, ActionRecommendationAction.FORWARD_TO_KITCHEN],
      summaryGroupField: 'food',
    },
    {
      collection: CollectionNames.APP_FEEDBACKS,
      promptContext: 'Rückmeldungen zur Mensa- und Campus-App, aus dem Feedback-Formular der App oder als Bewertung im App Store bzw. Google Play. "positive" sagt, ob die Rückmeldung positiv gemeint ist.',
      fields: ['title', 'content', 'positive'],
      textFields: ['title', 'content'],
      actions: [ActionRecommendationAction.REPLY, ActionRecommendationAction.IGNORE, ActionRecommendationAction.FORWARD_TO_DEVELOPMENT],
    },
  ];

  /** At most this many items are sent for recommendations in one request. */
  static readonly MAX_ITEMS_PER_RECOMMENDATION = 25;
  /** At most this many items, the newest first, go into one summary. */
  static readonly MAX_ITEMS_PER_SUMMARY = 200;

  static getDefinition(collection: unknown): ActionRecommendationDefinition | null {
    return ActionRecommendationDefinitions.DEFINITIONS.find(definition => definition.collection === collection) ?? null;
  }

  static isAction(value: unknown): value is ActionRecommendationAction {
    return Object.values(ActionRecommendationAction).includes(value as ActionRecommendationAction);
  }

  static getActionInfo(action: unknown): ActionRecommendationActionInfo | null {
    return ActionRecommendationDefinitions.isAction(action) ? ACTION_RECOMMENDATION_ACTIONS[action] : null;
  }

  /** The fields to read for an item: the id and the allowlist. */
  static getReadFields(definition: ActionRecommendationDefinition): string[] {
    return ['id', ...definition.fields];
  }

  /** The item ids of a request: strings or numbers, without duplicates and empty ones, at most `max`. */
  static parseItemIds(value: unknown, max: number = ActionRecommendationDefinitions.MAX_ITEMS_PER_RECOMMENDATION): string[] {
    if (!Array.isArray(value)) {
      return [];
    }
    const ids = value.filter(id => typeof id === 'string' || typeof id === 'number').map(id => String(id).trim());
    return [...new Set(ids.filter(id => id.length > 0))].slice(0, max);
  }

  /** The language the AI writes in: a short code like `de` or `en-US`, German otherwise. */
  static parseLanguage(value: unknown): string {
    return typeof value === 'string' && /^[a-zA-Z]{2,3}(-[a-zA-Z0-9]{2,8})?$/.test(value) ? value : 'de';
  }

  /** A Directus filter for items that have text in at least one text field. */
  static buildHasTextFilter(definition: ActionRecommendationDefinition): Record<string, unknown> {
    return { _or: definition.textFields.map(field => ({ [field]: { _nempty: true } })) };
  }
}
