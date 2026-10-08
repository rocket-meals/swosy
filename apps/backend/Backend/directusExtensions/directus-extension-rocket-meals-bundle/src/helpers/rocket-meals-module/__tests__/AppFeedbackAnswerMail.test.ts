import { describe, expect, it } from '@jest/globals';

import { BackendTranslator } from '../../translations/BackendTranslator';
import { AppFeedbackAnswerMail } from '../AppFeedbackAnswerMail';

const germanTranslate = BackendTranslator.getTranslator('de');
const englishTranslate = BackendTranslator.getTranslator('en');

const feedback = { contact_email: '  user@example.com ', title: 'Absturz', content: 'Die App stürzt ab.\nBeim Start.' };

describe('AppFeedbackAnswerMail.buildMailAnswer', () => {
  it('builds no mail without valid contact email or answer', () => {
    const base = { projectName: 'Rocket Meals', translate: germanTranslate };
    expect(AppFeedbackAnswerMail.buildMailAnswer({ ...base, feedback: { contact_email: null }, answer: 'Danke!' })).toBeUndefined();
    expect(AppFeedbackAnswerMail.buildMailAnswer({ ...base, feedback: { contact_email: 'not-an-email' }, answer: 'Danke!' })).toBeUndefined();
    expect(AppFeedbackAnswerMail.buildMailAnswer({ ...base, feedback, answer: '   ' })).toBeUndefined();
  });

  it('contains the answer, quotes the feedback and asks not to reply', () => {
    const mail = AppFeedbackAnswerMail.buildMailAnswer({ feedback, answer: 'Danke, ist behoben.', projectName: 'Studi Futter', translate: germanTranslate });

    expect(mail?.recipient).toBe('user@example.com');
    expect(mail?.subject).toBe('Studi Futter: Antwort auf dein Feedback');
    expect(mail?.markdown_content).toContain('Danke, ist behoben.');
    expect(mail?.markdown_content).toContain('## Dein Feedback');
    expect(mail?.markdown_content).toContain('> Absturz\n> \n> Die App stürzt ab.\n> Beim Start.');
    expect(mail?.markdown_content).toContain('Bitte antworte nicht auf diese E-Mail');
  });

  it('is written in the language it is given', () => {
    const mail = AppFeedbackAnswerMail.buildMailAnswer({ feedback: { contact_email: 'user@example.com' }, answer: 'Thanks!', projectName: 'Rocket Meals', translate: englishTranslate });

    expect(mail?.subject).toBe('Rocket Meals: Reply to your feedback');
    expect(mail?.markdown_content).not.toContain('##');
  });
});

describe('AppFeedbackAnswerMail.buildChatAnswer', () => {
  it('points to the menu item "Chats" of the app instead of a link and names the support address', () => {
    const mail = AppFeedbackAnswerMail.buildChatAnswer({ feedback, answer: 'Schau mal in den Chat.', projectName: 'Swosy', translate: germanTranslate, supportEmail: 'support@example.com' });

    expect(mail?.markdown_content).toContain('Schau mal in den Chat.');
    expect(mail?.markdown_content).toContain('„Chats“');
    expect(mail?.markdown_content).toContain('support@example.com');
    expect(mail?.markdown_content).not.toContain('http');
    expect(mail?.markdown_content).not.toContain('Bitte antworte nicht');
  });
});

describe('texts of the answer mails', () => {
  it('use neither dashes nor semicolons (writing rule of the README)', () => {
    const mail = AppFeedbackAnswerMail.buildMailAnswer({ feedback, answer: 'Danke.', projectName: 'Swosy', translate: germanTranslate });
    const chatMail = AppFeedbackAnswerMail.buildChatAnswer({ feedback, answer: 'Danke.', projectName: 'Swosy', translate: germanTranslate, supportEmail: 'support@example.com' });
    for (const text of [mail?.subject, mail?.markdown_content, chatMail?.markdown_content]) {
      expect(text).not.toMatch(/[–—;；؛]/);
    }
  });
});
