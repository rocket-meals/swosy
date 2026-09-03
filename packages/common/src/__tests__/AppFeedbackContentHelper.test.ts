import { AppFeedbackContentHelper } from 'repo-depkit-common';

describe('AppFeedbackContentHelper.stripAppState', () => {
  it('returns the untouched text when no app state was appended', () => {
    expect(AppFeedbackContentHelper.stripAppState('Die App stürzt beim Login ab.')).toBe(
      'Die App stürzt beim Login ab.'
    );
  });

  it('removes the appended app state dump', () => {
    const content = AppFeedbackContentHelper.appendAppState('Die App stürzt ab.', '{"settings":{}}');
    expect(AppFeedbackContentHelper.stripAppState(content)).toBe('Die App stürzt ab.');
  });

  it('removes an appended app state serialization error', () => {
    const content = AppFeedbackContentHelper.appendAppStateError('Die App stürzt ab.', '{"message":"boom"}');
    expect(AppFeedbackContentHelper.stripAppState(content)).toBe('Die App stürzt ab.');
  });

  it('handles empty, null and undefined content', () => {
    expect(AppFeedbackContentHelper.stripAppState('')).toBe('');
    expect(AppFeedbackContentHelper.stripAppState(null)).toBe('');
    expect(AppFeedbackContentHelper.stripAppState(undefined)).toBe('');
  });

  it('drops everything when the user wrote nothing but the app state was attached', () => {
    const content = AppFeedbackContentHelper.appendAppState('', '{"settings":{}}');
    expect(AppFeedbackContentHelper.stripAppState(content)).toBe('');
  });
});
