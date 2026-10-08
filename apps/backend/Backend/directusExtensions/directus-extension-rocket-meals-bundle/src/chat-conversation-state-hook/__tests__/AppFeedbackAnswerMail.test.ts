import { describe, expect, it } from '@jest/globals';

import { BackendTranslator } from '../../helpers/translations/BackendTranslator';
import { AppFeedbackAnswerMail } from '../AppFeedbackAnswerMail';

const germanTranslate = BackendTranslator.getTranslator('de');
const englishTranslate = BackendTranslator.getTranslator('en');

describe('AppFeedbackAnswerMail', () => {
  it('uses the trimmed contact email as recipient', () => {
    expect(AppFeedbackAnswerMail.getRecipient({ contact_email: '  user@example.com ' })).toBe('user@example.com');
  });

  it('has no recipient without a valid contact email', () => {
    expect(AppFeedbackAnswerMail.getRecipient({ contact_email: null })).toBeUndefined();
    expect(AppFeedbackAnswerMail.getRecipient({ contact_email: '' })).toBeUndefined();
    expect(AppFeedbackAnswerMail.getRecipient({ contact_email: 'not-an-email' })).toBeUndefined();
  });

  it('builds no mail without recipient or answer', () => {
    const base = { projectName: 'Rocket Meals', translate: germanTranslate };
    expect(AppFeedbackAnswerMail.build({ ...base, feedback: { contact_email: null }, answer: 'Danke!' })).toBeUndefined();
    expect(AppFeedbackAnswerMail.build({ ...base, feedback: { contact_email: 'user@example.com' }, answer: '   ' })).toBeUndefined();
  });

  it('contains the answer and quotes the original feedback', () => {
    const mail = AppFeedbackAnswerMail.build({
      feedback: { contact_email: 'user@example.com', title: 'Absturz', content: 'Die App stürzt ab.\nBeim Start.' },
      answer: 'Danke, ist behoben.',
      projectName: 'Studi Futter',
      translate: germanTranslate,
    });

    expect(mail?.recipient).toBe('user@example.com');
    expect(mail?.subject).toBe('Studi Futter – Antwort auf dein Feedback');
    expect(mail?.markdown_content).toContain('Danke, ist behoben.');
    expect(mail?.markdown_content).toContain('## Dein Feedback');
    expect(mail?.markdown_content).toContain('> Absturz\n> \n> Die App stürzt ab.\n> Beim Start.');
  });

  it('is written in the language it is given', () => {
    const mail = AppFeedbackAnswerMail.build({
      feedback: { contact_email: 'user@example.com', title: null, content: null },
      answer: 'Thanks!',
      projectName: 'Rocket Meals',
      translate: englishTranslate,
    });

    expect(mail?.subject).toBe('Rocket Meals – Reply to your feedback');
    expect(mail?.markdown_content).not.toContain('##');
  });
});
