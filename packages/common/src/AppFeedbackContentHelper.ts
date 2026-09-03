/**
 * The feedback screen may append a serialized app state to the feedback content so that
 * support can debug the reported issue. The markers below separate that technical payload
 * from the text the user actually wrote.
 *
 * Everything starting at a marker is machine data and must never be shown to the user
 * again (e.g. as the initial message of the support chat or in the linked-elements preview).
 */
export class AppFeedbackContentHelper {
  static readonly APP_STATE_JSON_MARKER = '---APP_STATE_JSON---';
  static readonly APP_STATE_JSON_ERROR_MARKER = '---APP_STATE_JSON_ERROR---';

  /** Append the serialized app state to the feedback content. */
  static appendAppState(content: string | undefined | null, appStateJson: string): string {
    return `${content ?? ''}\n\n${AppFeedbackContentHelper.APP_STATE_JSON_MARKER}\n${appStateJson}`;
  }

  /** Append the serialization error, so a failed app state dump can still be investigated. */
  static appendAppStateError(content: string | undefined | null, errorJson: string): string {
    return `${content ?? ''}\n\n${AppFeedbackContentHelper.APP_STATE_JSON_ERROR_MARKER}\n${errorJson}`;
  }

  /**
   * Return only the part the user wrote, i.e. the content without any appended app state.
   */
  static stripAppState(content: string | undefined | null): string {
    if (!content) {
      return '';
    }

    let userContent = content;
    for (const marker of [
      AppFeedbackContentHelper.APP_STATE_JSON_MARKER,
      AppFeedbackContentHelper.APP_STATE_JSON_ERROR_MARKER,
    ]) {
      const markerIndex = userContent.indexOf(marker);
      if (markerIndex >= 0) {
        userContent = userContent.substring(0, markerIndex);
      }
    }

    return userContent.trim();
  }
}
